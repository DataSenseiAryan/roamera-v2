import type { NextFunction, Response } from 'express';
import { Router } from 'express';
import { eq, and, inArray, desc } from 'drizzle-orm';

import { db } from '../db/client';
import {
  expenseGroups,
  expenseGroupMembers,
  expenses,
  expenseSplits,
  groupSettlements,
  users,
  circles,
} from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { convertAmount } from '../lib/exchange';

const router = Router();

function tsIso(v: Date | number | null | undefined): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString();
  return new Date(v * 1000).toISOString();
}

async function getGroupRole(groupId: string, userId: string): Promise<'owner' | 'member' | null> {
  const group = await db.query.expenseGroups.findFirst({
    where: (t, { eq: e }) => e(t.id, groupId),
  });
  if (!group) return null;
  if (group.ownerId === userId) return 'owner';
  const member = await db.query.expenseGroupMembers.findFirst({
    where: (t, { and: a, eq: e }) => a(e(t.groupId, groupId), e(t.userId, userId)),
  });
  return member ? 'member' : null;
}

function requireGroupRole(minRole: 'member' | 'owner') {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const role = await getGroupRole(req.params.groupId as string, req.user!.id);
      if (!role || (minRole === 'owner' && role !== 'owner')) throw new AppError('Forbidden', 403);
      next();
    } catch (err) {
      next(err);
    }
  };
}

function simplifyDebts(balances: { userId: string; balance: number }[]): { from: string; to: string; amount: number }[] {
  const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ ...b, balance: -b.balance }));
  const creditors = balances.filter((b) => b.balance > 0).map((b) => ({ ...b }));

  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const result: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].balance, creditors[j].balance);
    if (amount > 0.01)
      result.push({ from: debtors[i].userId, to: creditors[j].userId, amount: Math.round(amount * 100) / 100 });
    debtors[i].balance -= amount;
    creditors[j].balance -= amount;
    if (debtors[i].balance < 0.01) i++;
    if (creditors[j].balance < 0.01) j++;
  }
  return result;
}

async function listMemberIds(groupId: string): Promise<string[]> {
  const rows = await db.query.expenseGroupMembers.findMany({
    where: (t, { eq: e }) => e(t.groupId, groupId),
  });
  return rows.map((r) => r.userId);
}

async function assertUsersAreMembers(groupId: string, userIds: string[]): Promise<void> {
  const memberIds = new Set(await listMemberIds(groupId));
  for (const uid of userIds) {
    if (!memberIds.has(uid)) throw new AppError(`User ${uid} is not a group member`, 400);
  }
}

/** Assign cents fairly when splitting totalAmount across members (equal). */
function splitEqual(totalAmount: number, memberIds: string[]): { userId: string; amount: number }[] {
  const sorted = [...memberIds].sort();
  const n = sorted.length;
  if (n === 0) throw new AppError('Group has no members', 400);
  const totalCents = Math.round(totalAmount * 100);
  const base = Math.floor(totalCents / n);
  const rem = totalCents - base * n;
  return sorted.map((uid, i) => ({
    userId: uid,
    amount: (base + (i < rem ? 1 : 0)) / 100,
  }));
}

function splitWeighted(
  totalAmount: number,
  bodySplits: { userId: string; weight?: number }[],
  memberIds: Set<string>,
): { userId: string; amount: number }[] {
  let tw = 0;
  for (const s of bodySplits) {
    if (!memberIds.has(s.userId)) throw new AppError('Split user must be a group member', 400);
    tw += Math.max(0, Number(s.weight ?? 0));
  }
  if (tw <= 0) throw new AppError('Total weight must be positive', 400);

  const raw = bodySplits.map((s) => ({
    userId: s.userId,
    share: (totalAmount * Math.max(0, Number(s.weight ?? 0))) / tw,
  }));

  const cents = raw.map((r) => ({ userId: r.userId, cents: Math.round(r.share * 100) }));
  let drift = Math.round(totalAmount * 100) - cents.reduce((a, c) => a + c.cents, 0);
  let idx = cents.length - 1;
  while (Math.abs(drift) > 0 && idx >= 0) {
    const adj = drift > 0 ? 1 : -1;
    if (cents[idx].cents + adj >= 0) {
      cents[idx].cents += adj;
      drift -= adj;
    }
    idx--;
  }
  return cents.map((c) => ({ userId: c.userId, amount: c.cents / 100 }));
}

function splitExact(totalAmount: number, bodySplits: { userId: string; amount: number }[], memberIds: Set<string>) {
  let sum = 0;
  const out: { userId: string; amount: number }[] = [];
  for (const s of bodySplits) {
    if (!memberIds.has(s.userId)) throw new AppError('Split user must be a group member', 400);
    const a = Number(s.amount);
    sum += a;
    out.push({ userId: s.userId, amount: Math.round(a * 100) / 100 });
  }
  if (Math.abs(sum - totalAmount) > 0.01) throw new AppError('Split amounts must sum to expense amount', 400);
  return out;
}

function scaleSplitsToAmount(existing: { userId: string; amount: number }[], newTotal: number) {
  const oldSum = existing.reduce((s, x) => s + x.amount, 0);
  if (oldSum < 1e-6) throw new AppError('Cannot rescale splits', 400);
  const ratio = newTotal / oldSum;
  const scaled = existing.map((s) => ({
    userId: s.userId,
    amount: Math.round(s.amount * ratio * 100) / 100,
  }));
  const drift = Math.round((newTotal - scaled.reduce((a, b) => a + b.amount, 0)) * 100) / 100;
  scaled[scaled.length - 1].amount = Math.round((scaled[scaled.length - 1].amount + drift) * 100) / 100;
  return scaled;
}

async function computeSplitRows(
  groupId: string,
  totalAmount: number,
  splitType: 'equal' | 'weighted' | 'exact',
  bodySplits: { userId: string; weight?: number; amount?: number }[] | undefined,
): Promise<{ userId: string; amount: number }[]> {
  const memberIds = await listMemberIds(groupId);
  const memberSet = new Set(memberIds);

  if (splitType === 'equal') return splitEqual(totalAmount, memberIds);

  if (!bodySplits?.length) throw new AppError('splits array is required for weighted and exact splits', 400);

  if (splitType === 'weighted') return splitWeighted(totalAmount, bodySplits as { userId: string; weight?: number }[], memberSet);

  return splitExact(totalAmount, bodySplits as { userId: string; amount: number }[], memberSet);
}

async function computeBalanceMap(groupId: string, groupCurrency: string): Promise<Map<string, number>> {
  const memberRows = await db.query.expenseGroupMembers.findMany({
    where: (t, { eq: e }) => e(t.groupId, groupId),
  });
  const balanceMap = new Map<string, number>();
  for (const m of memberRows) balanceMap.set(m.userId, 0);

  const expensesList = await db.query.expenses.findMany({
    where: (t, { eq: e }) => e(t.groupId, groupId),
  });

  for (const ex of expensesList) {
    const amt = parseFloat(ex.amount);
    const paidConv = await convertAmount(amt, ex.currency, groupCurrency);
    balanceMap.set(ex.paidBy, (balanceMap.get(ex.paidBy) ?? 0) + paidConv);

    const splits = await db.query.expenseSplits.findMany({
      where: (s, { eq: e }) => e(s.expenseId, ex.id),
    });
    for (const sp of splits) {
      const splitAmt = parseFloat(sp.amount);
      const splitConv = await convertAmount(splitAmt, ex.currency, groupCurrency);
      balanceMap.set(sp.userId, (balanceMap.get(sp.userId) ?? 0) - splitConv);
    }
  }

  const settlementsRows = await db.query.groupSettlements.findMany({
    where: (s, { eq: e }) => e(s.groupId, groupId),
  });

  for (const st of settlementsRows) {
    const stAmt = parseFloat(st.amount);
    const stConv = await convertAmount(stAmt, st.currency, groupCurrency);
    balanceMap.set(st.fromUserId, (balanceMap.get(st.fromUserId) ?? 0) + stConv);
    balanceMap.set(st.toUserId, (balanceMap.get(st.toUserId) ?? 0) - stConv);
  }

  for (const k of balanceMap.keys()) {
    balanceMap.set(k, Math.round((balanceMap.get(k) ?? 0) * 100) / 100);
  }

  return balanceMap;
}

async function formatExpenseRow(
  ex: typeof expenses.$inferSelect,
  splitsRows: (typeof expenseSplits.$inferSelect)[],
  usernameById: Map<string, string>,
) {
  return {
    id: ex.id,
    description: ex.description,
    amount: parseFloat(ex.amount),
    currency: ex.currency,
    splitType: ex.splitType,
    category: ex.category,
    notes: ex.notes,
    date: ex.date == null ? null : tsIso(ex.date as Date | number),
    paidByUsername: usernameById.get(ex.paidBy) ?? '',
    splits: splitsRows.map((s) => ({
      userId: s.userId,
      username: usernameById.get(s.userId) ?? '',
      amount: parseFloat(s.amount),
      isSettled: s.isSettled,
    })),
  };
}

/** ─── Routes ───────────────────────────────────────────────────────── */

router.get('/groups', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const owned = await db.query.expenseGroups.findMany({
      where: (t, { eq: e }) => e(t.ownerId, userId),
    });
    const memberships = await db.query.expenseGroupMembers.findMany({
      where: (t, { eq: e }) => e(t.userId, userId),
    });
    const memberGroupIds = [...new Set(memberships.map((m) => m.groupId))];
    const extraGroups =
      memberGroupIds.length === 0
        ? []
        : await db.query.expenseGroups.findMany({
            where: (t, { inArray: inn }) => inn(t.id, memberGroupIds),
          });

    const byId = new Map<string, (typeof owned)[0]>();
    for (const g of owned) byId.set(g.id, g);
    for (const g of extraGroups) byId.set(g.id, g);

    const list = [...byId.values()];

    const out = await Promise.all(
      list.map(async (g) => {
        const memberRows = await db.query.expenseGroupMembers.findMany({
          where: (t, { eq: e }) => e(t.groupId, g.id),
        });
        const myRole: 'owner' | 'member' = g.ownerId === userId ? 'owner' : 'member';
        const balanceMap = await computeBalanceMap(g.id, g.currency);
        const myBalance = Math.round((balanceMap.get(userId) ?? 0) * 100) / 100;

        return {
          id: g.id,
          name: g.name,
          currency: g.currency,
          linkedCircleId: g.linkedCircleId,
          memberCount: memberRows.length,
          myRole,
          myBalance,
          createdAt: tsIso(g.createdAt as Date | number),
        };
      }),
    );

    res.json({ groups: out });
  } catch (err) {
    next(err);
  }
});

router.post('/groups', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { name, currency = 'INR', linkedCircleId } = req.body as {
      name?: string;
      currency?: string;
      linkedCircleId?: string | null;
    };

    if (!name?.trim()) throw new AppError('name is required', 400);

    if (linkedCircleId) {
      const circle = await db.query.circles.findFirst({
        where: (c, { eq: e }) => e(c.id, linkedCircleId),
      });
      if (!circle) throw new AppError('Linked circle not found', 404);
    }

    const id = crypto.randomUUID();
    await db.insert(expenseGroups).values({
      id,
      name: name.trim(),
      currency,
      ownerId: userId,
      linkedCircleId: linkedCircleId ?? null,
    });

    await db.insert(expenseGroupMembers).values({
      groupId: id,
      userId,
    });

    const row = await db.query.expenseGroups.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });

    let linkedCircleTitle: string | undefined;
    if (row!.linkedCircleId) {
      const c = await db.query.circles.findFirst({
        where: (cc, { eq: e }) => e(cc.id, row!.linkedCircleId!),
      });
      linkedCircleTitle = c?.title;
    }

    res.status(201).json({
      group: {
        id: row!.id,
        name: row!.name,
        currency: row!.currency,
        ownerId: row!.ownerId,
        linkedCircleId: row!.linkedCircleId,
        linkedCircleTitle,
        createdAt: tsIso(row!.createdAt as Date | number),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/groups/:groupId', authenticate, requireGroupRole('member'), async (req: AuthRequest, res, next) => {
  try {
    const groupId = req.params.groupId as string;
    const group = await db.query.expenseGroups.findFirst({
      where: (t, { eq: e }) => e(t.id, groupId),
    });
    if (!group) throw new AppError('Group not found', 404);

    const membersRows = await db.query.expenseGroupMembers.findMany({
      where: (t, { eq: e }) => e(t.groupId, groupId),
      orderBy: (t) => t.joinedAt,
    });

    const userIds = [...new Set(membersRows.map((m) => m.userId))];
    const userRows =
      userIds.length === 0
        ? []
        : await db.query.users.findMany({
            where: (u, { inArray: inn }) => inn(u.id, userIds),
          });
    const byUserId = new Map(userRows.map((u) => [u.id, u]));

    let linkedCircleTitle: string | undefined;
    if (group.linkedCircleId) {
      const cid = group.linkedCircleId;
      const c = await db.query.circles.findFirst({
        where: (cc, { eq: e }) => e(cc.id, cid),
      });
      linkedCircleTitle = c?.title;
    }

    res.json({
      group: {
        id: group.id,
        name: group.name,
        currency: group.currency,
        ownerId: group.ownerId,
        linkedCircleId: group.linkedCircleId,
        linkedCircleTitle,
        createdAt: tsIso(group.createdAt as Date | number),
      },
      members: membersRows.map((m) => {
        const u = byUserId.get(m.userId);
        return {
          userId: m.userId,
          username: u?.username ?? '',
          displayName: u?.username ?? '',
          joinedAt: tsIso(m.joinedAt as Date | number),
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/groups/:groupId', authenticate, requireGroupRole('owner'), async (req: AuthRequest, res, next) => {
  try {
    const groupId = req.params.groupId as string;
    const group = await db.query.expenseGroups.findFirst({
      where: (t, { eq: e }) => e(t.id, groupId),
    });
    if (!group) throw new AppError('Group not found', 404);

    const { name, currency } = req.body as { name?: string; currency?: string };

    await db
      .update(expenseGroups)
      .set({
        ...(name !== undefined && { name: String(name).trim() }),
        ...(currency !== undefined && { currency: String(currency) }),
      })
      .where(eq(expenseGroups.id, groupId));

    const row = await db.query.expenseGroups.findFirst({
      where: (t, { eq: e }) => e(t.id, groupId),
    });

    let linkedCircleTitle: string | undefined;
    if (row!.linkedCircleId) {
      const c = await db.query.circles.findFirst({
        where: (cc, { eq: e }) => e(cc.id, row!.linkedCircleId!),
      });
      linkedCircleTitle = c?.title;
    }

    res.json({
      group: {
        id: row!.id,
        name: row!.name,
        currency: row!.currency,
        ownerId: row!.ownerId,
        linkedCircleId: row!.linkedCircleId,
        linkedCircleTitle,
        createdAt: tsIso(row!.createdAt as Date | number),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/groups/:groupId', authenticate, requireGroupRole('owner'), async (req: AuthRequest, res, next) => {
  try {
    const groupId = req.params.groupId as string;
    await db.delete(expenseGroups).where(eq(expenseGroups.id, groupId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/groups/:groupId/members', authenticate, requireGroupRole('owner'), async (req: AuthRequest, res, next) => {
  try {
    const groupId = req.params.groupId as string;
    const { username } = req.body as { username?: string };
    if (!username?.trim()) throw new AppError('username is required', 400);

    const target = await db.query.users.findFirst({
      where: (u, { eq: e }) => e(u.username, username.trim()),
    });
    if (!target) throw new AppError('User not found', 404);

    const existing = await db.query.expenseGroupMembers.findFirst({
      where: (t, { and: a, eq: e }) => a(e(t.groupId, groupId), e(t.userId, target.id)),
    });

    if (existing) {
      res.status(200).json({
        member: {
          userId: target.id,
          username: target.username,
          displayName: target.username,
          joinedAt: tsIso(existing.joinedAt as Date | number),
        },
      });
      return;
    }

    await db.insert(expenseGroupMembers).values({
      groupId,
      userId: target.id,
    });

    const row = await db.query.expenseGroupMembers.findFirst({
      where: (t, { and: a, eq: e }) => a(e(t.groupId, groupId), e(t.userId, target.id)),
    });

    res.status(201).json({
      member: {
        userId: target.id,
        username: target.username,
        displayName: target.username,
        joinedAt: tsIso(row!.joinedAt as Date | number),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete(
  '/groups/:groupId/members/:userId',
  authenticate,
  requireGroupRole('owner'),
  async (req: AuthRequest, res, next) => {
    try {
      const groupId = req.params.groupId as string;
      const targetUserId = req.params.userId as string;

      if (targetUserId === req.user!.id) throw new AppError('Owner cannot remove themselves; delete the group instead', 400);

      const expensesList = await db.query.expenses.findMany({
        where: (t, { eq: e }) => e(t.groupId, groupId),
      });

      for (const ex of expensesList) {
        const splits = await db.query.expenseSplits.findMany({
          where: (s, { eq: e }) => e(s.expenseId, ex.id),
        });
        const hasUnsettled = splits.some((s) => !s.isSettled);
        if (!hasUnsettled) continue;
        const involved = ex.paidBy === targetUserId || splits.some((s) => s.userId === targetUserId);
        if (involved) throw new AppError('Cannot remove member with unsettled expenses involving them', 400);
      }

      await db
        .delete(expenseGroupMembers)
        .where(and(eq(expenseGroupMembers.groupId, groupId), eq(expenseGroupMembers.userId, targetUserId)));

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

router.get('/groups/:groupId/expenses', authenticate, requireGroupRole('member'), async (req: AuthRequest, res, next) => {
  try {
    const groupId = req.params.groupId as string;

    const expensesList = await db.query.expenses.findMany({
      where: (t, { eq: e }) => e(t.groupId, groupId),
      orderBy: (t) => desc(t.createdAt),
    });

    const allUserIds = new Set<string>();
    for (const ex of expensesList) {
      allUserIds.add(ex.paidBy);
    }

    const splitsByExpense = new Map<string, (typeof expenseSplits.$inferSelect)[]>();
    for (const ex of expensesList) {
      const sp = await db.query.expenseSplits.findMany({
        where: (s, { eq: e }) => e(s.expenseId, ex.id),
      });
      splitsByExpense.set(ex.id, sp);
      for (const s of sp) allUserIds.add(s.userId);
    }

    const ids = [...allUserIds];
    const userRows =
      ids.length === 0 ? [] : await db.query.users.findMany({ where: (u, { inArray: inn }) => inn(u.id, ids) });
    const usernameById = new Map(userRows.map((u) => [u.id, u.username]));

    const out = await Promise.all(
      expensesList.map((ex) => formatExpenseRow(ex, splitsByExpense.get(ex.id) ?? [], usernameById)),
    );

    res.json({ expenses: out });
  } catch (err) {
    next(err);
  }
});

router.post('/groups/:groupId/expenses', authenticate, requireGroupRole('member'), async (req: AuthRequest, res, next) => {
  try {
    const groupId = req.params.groupId as string;
    const group = await db.query.expenseGroups.findFirst({
      where: (t, { eq: e }) => e(t.id, groupId),
    });
    if (!group) throw new AppError('Group not found', 404);

    const {
      description,
      amount,
      currency,
      paidBy,
      splitType = 'equal',
      category,
      notes,
      date,
      splits: splitsBody,
    } = req.body as {
      description?: string;
      amount?: number | string;
      currency?: string;
      paidBy?: string;
      splitType?: 'equal' | 'weighted' | 'exact';
      category?: string | null;
      notes?: string | null;
      date?: string | number | null;
      splits?: { userId: string; weight?: number; amount?: number }[];
    };

    if (!description?.trim()) throw new AppError('description is required', 400);
    if (amount === undefined || amount === null) throw new AppError('amount is required', 400);
    const amtNum = Number(amount);
    if (!Number.isFinite(amtNum) || amtNum <= 0) throw new AppError('amount must be a positive number', 400);
    if (!paidBy) throw new AppError('paidBy is required', 400);

    await assertUsersAreMembers(groupId, [paidBy]);

    const expenseCurrency = currency ?? group.currency;

    const splitRows = await computeSplitRows(groupId, amtNum, splitType, splitsBody);

    const expenseId = crypto.randomUUID();
    await db.insert(expenses).values({
      id: expenseId,
      groupId,
      paidBy,
      description: description.trim(),
      amount: String(amtNum),
      currency: expenseCurrency,
      category: category ?? null,
      notes: notes ?? null,
      date:
        date === undefined || date === null
          ? null
          : new Date(date as string | number),
      splitType,
    });

    for (const s of splitRows) {
      await db.insert(expenseSplits).values({
        id: crypto.randomUUID(),
        expenseId,
        userId: s.userId,
        amount: String(s.amount),
      });
    }

    const row = await db.query.expenses.findFirst({
      where: (t, { eq: e }) => e(t.id, expenseId),
    });
    const splitRowsDb = await db.query.expenseSplits.findMany({
      where: (s, { eq: e }) => e(s.expenseId, expenseId),
    });

    const userIds = new Set<string>([row!.paidBy, ...splitRowsDb.map((s) => s.userId)]);
    const usersList =
      userIds.size === 0
        ? []
        : await db.query.users.findMany({
            where: (u, { inArray: inn }) => inn(u.id, [...userIds]),
          });
    const usernameById = new Map(usersList.map((u) => [u.id, u.username]));

    res.status(201).json({ expense: await formatExpenseRow(row!, splitRowsDb, usernameById) });
  } catch (err) {
    next(err);
  }
});

router.patch('/groups/:groupId/expenses/:id', authenticate, requireGroupRole('member'), async (req: AuthRequest, res, next) => {
  try {
    const groupId = req.params.groupId as string;
    const expenseId = req.params.id as string;
    const userId = req.user!.id;

    const role = await getGroupRole(groupId, userId);
    const existing = await db.query.expenses.findFirst({
      where: (t, { and: a, eq: e }) => a(e(t.id, expenseId), e(t.groupId, groupId)),
    });
    if (!existing) throw new AppError('Expense not found', 404);
    if (role !== 'owner' && existing.paidBy !== userId) throw new AppError('Forbidden', 403);

    const {
      description,
      amount,
      currency,
      paidBy,
      splitType,
      category,
      notes,
      date,
      splits: splitsBody,
    } = req.body as Record<string, unknown>;

    const nextAmount = amount !== undefined ? Number(amount) : parseFloat(existing.amount);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) throw new AppError('amount must be positive', 400);

    const nextCurrency = currency !== undefined ? String(currency) : existing.currency;
    const nextSplitType = (splitType !== undefined ? splitType : existing.splitType) as 'equal' | 'weighted' | 'exact';
    const nextPaidBy = paidBy !== undefined ? String(paidBy) : existing.paidBy;

    await assertUsersAreMembers(groupId, [nextPaidBy]);

    const splitRecalcNeeded =
      amount !== undefined ||
      currency !== undefined ||
      splitType !== undefined ||
      splitsBody !== undefined ||
      paidBy !== undefined;

    let newSplits: { userId: string; amount: number }[];

    if (!splitRecalcNeeded) {
      const existingSplits = await db.query.expenseSplits.findMany({
        where: (s, { eq: e }) => e(s.expenseId, expenseId),
      });
      newSplits = existingSplits.map((s) => ({ userId: s.userId, amount: parseFloat(s.amount) }));
    } else if (nextSplitType === 'equal') {
      newSplits = await computeSplitRows(groupId, nextAmount, 'equal', undefined);
    } else if (splitsBody !== undefined && Array.isArray(splitsBody)) {
      newSplits = await computeSplitRows(groupId, nextAmount, nextSplitType, splitsBody as { userId: string; weight?: number; amount?: number }[]);
    } else {
      const existingSplits = await db.query.expenseSplits.findMany({
        where: (s, { eq: e }) => e(s.expenseId, expenseId),
      });
      const scaled = existingSplits.map((s) => ({ userId: s.userId, amount: parseFloat(s.amount) }));
      newSplits = scaleSplitsToAmount(scaled, nextAmount);
    }

    await db
      .update(expenses)
      .set({
        ...(description !== undefined && { description: String(description).trim() }),
        ...(amount !== undefined && { amount: String(nextAmount) }),
        ...(currency !== undefined && { currency: nextCurrency }),
        ...(paidBy !== undefined && { paidBy: nextPaidBy }),
        ...(splitType !== undefined && { splitType: nextSplitType }),
        ...(category !== undefined && { category: category === null ? null : String(category) }),
        ...(notes !== undefined && { notes: notes === null ? null : String(notes) }),
        ...(date !== undefined && {
          date:
            date === null
              ? null
              : new Date(date as string | number),
        }),
      })
      .where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)));

    await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));

    for (const s of newSplits) {
      await db.insert(expenseSplits).values({
        id: crypto.randomUUID(),
        expenseId,
        userId: s.userId,
        amount: String(s.amount),
      });
    }

    const row = await db.query.expenses.findFirst({
      where: (t, { eq: e }) => e(t.id, expenseId),
    });
    const splitRowsDb = await db.query.expenseSplits.findMany({
      where: (s, { eq: e }) => e(s.expenseId, expenseId),
    });

    const uidSet = new Set<string>([row!.paidBy, ...splitRowsDb.map((s) => s.userId)]);
    const usersList = await db.query.users.findMany({
      where: (u, { inArray: inn }) => inn(u.id, [...uidSet]),
    });
    const usernameById = new Map(usersList.map((u) => [u.id, u.username]));

    res.json({ expense: await formatExpenseRow(row!, splitRowsDb, usernameById) });
  } catch (err) {
    next(err);
  }
});

router.delete('/groups/:groupId/expenses/:id', authenticate, requireGroupRole('member'), async (req: AuthRequest, res, next) => {
  try {
    const groupId = req.params.groupId as string;
    const expenseId = req.params.id as string;
    const userId = req.user!.id;

    const role = await getGroupRole(groupId, userId);
    const existing = await db.query.expenses.findFirst({
      where: (t, { and: a, eq: e }) => a(e(t.id, expenseId), e(t.groupId, groupId)),
    });
    if (!existing) throw new AppError('Expense not found', 404);
    if (role !== 'owner' && existing.paidBy !== userId) throw new AppError('Forbidden', 403);

    await db.delete(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)));

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get('/groups/:groupId/balances', authenticate, requireGroupRole('member'), async (req: AuthRequest, res, next) => {
  try {
    const groupId = req.params.groupId as string;
    const group = await db.query.expenseGroups.findFirst({
      where: (t, { eq: e }) => e(t.id, groupId),
    });
    if (!group) throw new AppError('Group not found', 404);

    const balanceMap = await computeBalanceMap(groupId, group.currency);

    const memberRows = await db.query.expenseGroupMembers.findMany({
      where: (t, { eq: e }) => e(t.groupId, groupId),
    });
    const memberIds = memberRows.map((m) => m.userId);

    const userRows =
      memberIds.length === 0
        ? []
        : await db.query.users.findMany({
            where: (u, { inArray: inn }) => inn(u.id, memberIds),
          });
    const usernameById = new Map(userRows.map((u) => [u.id, u.username]));

    const members = memberIds.map((uid) => ({
      userId: uid,
      username: usernameById.get(uid) ?? '',
      netBalance: balanceMap.get(uid) ?? 0,
      currency: group.currency,
    }));

    const simplifiedDebtsRaw = simplifyDebts(memberIds.map((uid) => ({ userId: uid, balance: balanceMap.get(uid) ?? 0 })));

    const simplifiedDebts = simplifiedDebtsRaw.map((d) => ({
      from: d.from,
      fromUsername: usernameById.get(d.from) ?? '',
      to: d.to,
      toUsername: usernameById.get(d.to) ?? '',
      amount: d.amount,
      currency: group.currency,
    }));

    res.json({
      members,
      simplifiedDebts,
      groupCurrency: group.currency,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/groups/:groupId/settle', authenticate, requireGroupRole('member'), async (req: AuthRequest, res, next) => {
  try {
    const groupId = req.params.groupId as string;
    const fromUserId = req.user!.id;
    const { toUserId, amount, currency } = req.body as {
      toUserId?: string;
      amount?: number | string;
      currency?: string;
    };

    const group = await db.query.expenseGroups.findFirst({
      where: (t, { eq: e }) => e(t.id, groupId),
    });
    if (!group) throw new AppError('Group not found', 404);

    if (!toUserId || amount === undefined || amount === null) throw new AppError('toUserId and amount are required', 400);

    const amtNum = Number(amount);
    if (!Number.isFinite(amtNum) || amtNum <= 0) throw new AppError('amount must be a positive number', 400);

    if (toUserId === fromUserId) throw new AppError('Cannot settle with yourself', 400);

    await assertUsersAreMembers(groupId, [fromUserId, toUserId]);

    const settleCurrency = currency ?? group.currency;

    const id = crypto.randomUUID();
    await db.insert(groupSettlements).values({
      id,
      groupId,
      fromUserId,
      toUserId,
      amount: String(amtNum),
      currency: settleCurrency,
      settledAt: new Date(),
    });

    const row = await db.query.groupSettlements.findFirst({
      where: (s, { eq: e }) => e(s.id, id),
    });

    res.status(201).json({
      success: true,
      settlement: {
        id: row!.id,
        groupId: row!.groupId,
        fromUserId: row!.fromUserId,
        toUserId: row!.toUserId,
        amount: parseFloat(row!.amount),
        currency: row!.currency,
        settledAt: tsIso(row!.settledAt as Date | number),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
