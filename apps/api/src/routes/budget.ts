import { Router } from 'express';
import { eq, and, asc } from 'drizzle-orm';

import { db } from '../db/client';
import { budgetItems, budgetItemMembers, settlements } from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { getWsManager } from '../lib/ws';
import { convertAmount } from '../lib/exchange';

const router = Router({ mergeParams: true });

type TripRole = 'owner' | 'editor' | 'viewer';
const ROLE_LEVEL: Record<TripRole, number> = { owner: 3, editor: 2, viewer: 1 };

async function getMemberRole(tripId: string, userId: string): Promise<TripRole | null> {
  const member = await db.query.tripMembers.findFirst({
    where: (t, { and: a, eq: e }) => a(e(t.tripId, tripId), e(t.userId, userId)),
  });
  return (member?.role as TripRole) ?? null;
}

function requireTripRole(minRole: TripRole) {
  return async (req: AuthRequest, res: any, next: any) => {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;
    const role = await getMemberRole(tripId, userId);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL[minRole]) {
      throw new AppError('Forbidden', 403);
    }
    next();
  };
}

async function assertTripMember(tripId: string, userId: string): Promise<void> {
  const role = await getMemberRole(tripId, userId);
  if (!role) throw new AppError('User is not a trip member', 400);
}

function simplifyDebts(balances: { userId: string; balance: number }[]): { from: string; to: string; amount: number }[] {
  const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ ...b, balance: -b.balance }));
  const creditors = balances.filter((b) => b.balance > 0).map((b) => ({ ...b }));

  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const transactions: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].balance, creditors[j].balance);
    if (amount > 0.01) {
      transactions.push({
        from: debtors[i].userId,
        to: creditors[j].userId,
        amount: Math.round(amount * 100) / 100,
      });
    }
    debtors[i].balance -= amount;
    creditors[j].balance -= amount;
    if (debtors[i].balance < 0.01) i++;
    if (creditors[j].balance < 0.01) j++;
  }
  return transactions;
}

function formatBudgetItem(
  item: typeof budgetItems.$inferSelect,
  splits: Array<{ userId: string; amount: number; isPaid: boolean }>,
) {
  return {
    id: item.id,
    tripId: item.tripId,
    category: item.category,
    name: item.name,
    totalPrice: parseFloat(item.totalPrice),
    currency: item.currency,
    persons: item.persons,
    days: item.days,
    sortOrder: item.sortOrder,
    splits,
  };
}

type BudgetItemOut = ReturnType<typeof formatBudgetItem>;

router.get('/', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;

    const trip = await db.query.trips.findFirst({ where: (t, { eq: e }) => e(t.id, tripId) });
    if (!trip) throw new AppError('Trip not found', 404);

    const baseCurrency = trip.currency ?? 'INR';
    const ownerId = trip.ownerId;

    const membersRows = await db.query.tripMembers.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
    });
    const memberIds = [...new Set(membersRows.map((m) => m.userId))];

    const itemsRows = await db.query.budgetItems.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
      orderBy: (t) => asc(t.sortOrder),
    });

    const itemIds = itemsRows.map((i) => i.id);
    const splitsRows =
      itemIds.length === 0
        ? []
        : await db.query.budgetItemMembers.findMany({
            where: (m, { inArray: inn }) => inn(m.budgetItemId, itemIds),
          });

    const splitsByItem = new Map<string, typeof splitsRows>();
    for (const s of splitsRows) {
      const list = splitsByItem.get(s.budgetItemId) ?? [];
      list.push(s);
      splitsByItem.set(s.budgetItemId, list);
    }

    const settlementsRows = await db.query.settlements.findMany({
      where: (s, { eq: e }) => e(s.tripId, tripId),
      orderBy: (s) => asc(s.settledAt),
    });

    const catOrderRows = await db.query.budgetCategoryOrder.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
      orderBy: (t) => asc(t.sortOrder),
    });
    const catRank = new Map(catOrderRows.map((r, idx) => [r.category, idx]));

    const balanceMap = new Map<string, number>();
    for (const uid of memberIds) balanceMap.set(uid, 0);

    let grandTotal = 0;
    const itemsOut: BudgetItemOut[] = [];

    for (const item of itemsRows) {
      const totalNum = parseFloat(item.totalPrice);
      const totalBase = await convertAmount(totalNum, item.currency, baseCurrency);
      grandTotal += totalBase;

      const itemSplits = splitsByItem.get(item.id) ?? [];
      const splitsOut = await Promise.all(
        itemSplits.map(async (sp) => ({
          userId: sp.userId,
          amount: parseFloat(sp.amount),
          isPaid: sp.isPaid,
          amountBase: await convertAmount(parseFloat(sp.amount), item.currency, baseCurrency),
        })),
      );

      balanceMap.set(ownerId, (balanceMap.get(ownerId) ?? 0) + totalBase);

      for (const sp of itemSplits) {
        const shareBase = await convertAmount(parseFloat(sp.amount), item.currency, baseCurrency);
        if (!sp.isPaid) {
          balanceMap.set(sp.userId, (balanceMap.get(sp.userId) ?? 0) - shareBase);
        } else {
          balanceMap.set(ownerId, (balanceMap.get(ownerId) ?? 0) - shareBase);
        }
      }

      itemsOut.push(
        formatBudgetItem(item, splitsOut.map(({ userId, amount, isPaid }) => ({ userId, amount, isPaid }))),
      );
    }

    grandTotal = Math.round(grandTotal * 100) / 100;

    for (const st of settlementsRows) {
      const amt = parseFloat(st.amount);
      const amtBase = await convertAmount(amt, st.currency, baseCurrency);
      balanceMap.set(st.fromUserId, (balanceMap.get(st.fromUserId) ?? 0) + amtBase);
      balanceMap.set(st.toUserId, (balanceMap.get(st.toUserId) ?? 0) - amtBase);
    }

    const userRows =
      memberIds.length === 0
        ? []
        : await db.query.users.findMany({
            where: (u, { inArray: inn }) => inn(u.id, memberIds),
          });
    const usernameById = new Map(userRows.map((u) => [u.id, u.username]));

    const balances = memberIds.map((userId) => ({
      userId,
      username: usernameById.get(userId) ?? '',
      balance: Math.round((balanceMap.get(userId) ?? 0) * 100) / 100,
    }));

    const simplifiedDebts = simplifyDebts(balances.map(({ userId, balance }) => ({ userId, balance })));

    const categoryKeys = [...new Set(itemsRows.map((i) => i.category))];
    categoryKeys.sort((a, b) => {
      const ra = catRank.has(a) ? catRank.get(a)! : 1e9;
      const rb = catRank.has(b) ? catRank.get(b)! : 1e9;
      if (ra !== rb) return ra - rb;
      return a.localeCompare(b);
    });

    const categories = await Promise.all(
      categoryKeys.map(async (name) => {
        const catItems = itemsRows.filter((i) => i.category === name);
        let total = 0;
        for (const it of catItems) {
          total += await convertAmount(parseFloat(it.totalPrice), it.currency, baseCurrency);
        }
        const sortedCatItems = [...catItems].sort((a, b) => a.sortOrder - b.sortOrder);
        const catItemsOut = sortedCatItems.map((it) => itemsOut.find((o) => o.id === it.id)!);
        return { name, total: Math.round(total * 100) / 100, items: catItemsOut };
      }),
    );

    const settlementUserIds = [...new Set(settlementsRows.flatMap((s) => [s.fromUserId, s.toUserId]))];
    const settleUsers =
      settlementUserIds.length === 0
        ? []
        : await db.query.users.findMany({
            where: (u, { inArray: inn }) => inn(u.id, settlementUserIds),
          });
    const settleUsernameById = new Map(settleUsers.map((u) => [u.id, u.username]));

    const settlementsOut = settlementsRows.map((s) => ({
      id: s.id,
      tripId: s.tripId,
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amount: parseFloat(s.amount),
      currency: s.currency,
      fromUsername: settleUsernameById.get(s.fromUserId) ?? '',
      toUsername: settleUsernameById.get(s.toUserId) ?? '',
      settledAt: s.settledAt instanceof Date ? s.settledAt.toISOString() : new Date((s.settledAt as number) * 1000).toISOString(),
      createdAt:
        s.createdAt instanceof Date ? s.createdAt.toISOString() : new Date((s.createdAt as number) * 1000).toISOString(),
    }));

    res.json({
      success: true,
      items: itemsOut,
      categories,
      grandTotal,
      currency: baseCurrency,
      balances,
      simplifiedDebts,
      settlements: settlementsOut,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/items', authenticate, requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const { category, name, totalPrice, currency = 'INR', persons = 1, days = 1, sortOrder = 0 } = req.body as {
      category: string;
      name: string;
      totalPrice: number | string;
      currency?: string;
      persons?: number;
      days?: number;
      sortOrder?: number;
    };

    if (!category?.trim() || !name?.trim()) throw new AppError('Category and name are required', 400);

    const id = crypto.randomUUID();
    const priceStr = String(totalPrice ?? '0');

    await db.insert(budgetItems).values({
      id,
      tripId,
      category: category.trim(),
      name: name.trim(),
      totalPrice: priceStr,
      currency,
      persons,
      days,
      sortOrder,
    });

    const row = await db.query.budgetItems.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
    const created = formatBudgetItem(row!, []);

    getWsManager().broadcast(`trip:${tripId}`, 'budget:created', { tripId, item: created });

    res.status(201).json({ success: true, item: created });
  } catch (err) {
    next(err);
  }
});

router.patch('/items/:id', authenticate, requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const itemId = req.params.id as string;

    const existing = await db.query.budgetItems.findFirst({ where: (t, { eq: e }) => e(t.id, itemId) });
    if (!existing || existing.tripId !== tripId) throw new AppError('Budget item not found', 404);

    const { category, name, totalPrice, currency, persons, days, sortOrder } = req.body as Record<string, unknown>;

    await db
      .update(budgetItems)
      .set({
        ...(category !== undefined && { category: String(category).trim() }),
        ...(name !== undefined && { name: String(name).trim() }),
        ...(totalPrice !== undefined && { totalPrice: String(totalPrice) }),
        ...(currency !== undefined && { currency: String(currency) }),
        ...(persons !== undefined && { persons: Number(persons) }),
        ...(days !== undefined && { days: Number(days) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      })
      .where(and(eq(budgetItems.id, itemId), eq(budgetItems.tripId, tripId)));

    const row = await db.query.budgetItems.findFirst({ where: (t, { eq: e }) => e(t.id, itemId) });
    const splits = await db.query.budgetItemMembers.findMany({
      where: (m, { eq: e }) => e(m.budgetItemId, itemId),
    });
    const updated = formatBudgetItem(
      row!,
      splits.map((s) => ({ userId: s.userId, amount: parseFloat(s.amount), isPaid: s.isPaid })),
    );

    getWsManager().broadcast(`trip:${tripId}`, 'budget:updated', { tripId, item: updated });

    res.json({ success: true, item: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:id', authenticate, requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const itemId = req.params.id as string;

    const existing = await db.query.budgetItems.findFirst({ where: (t, { eq: e }) => e(t.id, itemId) });
    if (!existing || existing.tripId !== tripId) throw new AppError('Budget item not found', 404);

    await db.delete(budgetItems).where(and(eq(budgetItems.id, itemId), eq(budgetItems.tripId, tripId)));

    getWsManager().broadcast(`trip:${tripId}`, 'budget:deleted', { tripId, itemId });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/items/:id/splits', authenticate, requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const itemId = req.params.id as string;
    const { splits } = req.body as { splits: Array<{ userId: string; amount: number | string }> };

    const existing = await db.query.budgetItems.findFirst({ where: (t, { eq: e }) => e(t.id, itemId) });
    if (!existing || existing.tripId !== tripId) throw new AppError('Budget item not found', 404);

    if (!Array.isArray(splits)) throw new AppError('splits array required', 400);

    for (const sp of splits) {
      await assertTripMember(tripId, sp.userId);
    }

    await db.delete(budgetItemMembers).where(eq(budgetItemMembers.budgetItemId, itemId));

    if (splits.length > 0) {
      await db.insert(budgetItemMembers).values(
        splits.map((sp) => ({
          budgetItemId: itemId,
          userId: sp.userId,
          amount: String(sp.amount),
          isPaid: false,
        })),
      );
    }

    const row = await db.query.budgetItems.findFirst({ where: (t, { eq: e }) => e(t.id, itemId) });
    const splitRows = await db.query.budgetItemMembers.findMany({
      where: (m, { eq: e }) => e(m.budgetItemId, itemId),
    });
    const item = formatBudgetItem(
      row!,
      splitRows.map((s) => ({ userId: s.userId, amount: parseFloat(s.amount), isPaid: s.isPaid })),
    );

    getWsManager().broadcast(`trip:${tripId}`, 'budget:splits_updated', { tripId, item });

    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
});

router.patch('/items/:id/splits/:userId', authenticate, requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const itemId = req.params.id as string;
    const splitUserId = req.params.userId as string;

    const existing = await db.query.budgetItems.findFirst({ where: (t, { eq: e }) => e(t.id, itemId) });
    if (!existing || existing.tripId !== tripId) throw new AppError('Budget item not found', 404);

    const row = await db.query.budgetItemMembers.findFirst({
      where: (m, { and: a, eq: e }) => a(e(m.budgetItemId, itemId), e(m.userId, splitUserId)),
    });
    if (!row) throw new AppError('Split not found', 404);

    await db
      .update(budgetItemMembers)
      .set({ isPaid: !row.isPaid })
      .where(and(eq(budgetItemMembers.budgetItemId, itemId), eq(budgetItemMembers.userId, splitUserId)));

    const itemRow = await db.query.budgetItems.findFirst({ where: (t, { eq: e }) => e(t.id, itemId) });
    const splitRows = await db.query.budgetItemMembers.findMany({
      where: (m, { eq: e }) => e(m.budgetItemId, itemId),
    });
    const item = formatBudgetItem(
      itemRow!,
      splitRows.map((s) => ({ userId: s.userId, amount: parseFloat(s.amount), isPaid: s.isPaid })),
    );

    getWsManager().broadcast(`trip:${tripId}`, 'budget:splits_updated', { tripId, item });

    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
});

router.post('/settle', authenticate, requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const { fromUserId, toUserId, amount, currency = 'INR' } = req.body as {
      fromUserId: string;
      toUserId: string;
      amount: number | string;
      currency?: string;
    };

    if (!fromUserId || !toUserId || amount === undefined || amount === null) {
      throw new AppError('fromUserId, toUserId, and amount are required', 400);
    }

    await assertTripMember(tripId, fromUserId);
    await assertTripMember(tripId, toUserId);

    const id = crypto.randomUUID();
    await db.insert(settlements).values({
      id,
      tripId,
      fromUserId,
      toUserId,
      amount: String(amount),
      currency,
      settledAt: new Date(),
      createdAt: new Date(),
    });

    const row = await db.query.settlements.findFirst({ where: (s, { eq: e }) => e(s.id, id) });
    const fromU = await db.query.users.findFirst({ where: (u, { eq: e }) => e(u.id, fromUserId) });
    const toU = await db.query.users.findFirst({ where: (u, { eq: e }) => e(u.id, toUserId) });

    const settlement = {
      id: row!.id,
      tripId: row!.tripId,
      fromUserId: row!.fromUserId,
      toUserId: row!.toUserId,
      amount: parseFloat(row!.amount),
      currency: row!.currency,
      fromUsername: fromU?.username ?? '',
      toUsername: toU?.username ?? '',
      settledAt: row!.settledAt instanceof Date ? row!.settledAt.toISOString() : new Date((row!.settledAt as number) * 1000).toISOString(),
      createdAt: row!.createdAt instanceof Date ? row!.createdAt.toISOString() : new Date((row!.createdAt as number) * 1000).toISOString(),
    };

    getWsManager().broadcast(`trip:${tripId}`, 'budget:settled', { tripId, settlement });

    res.status(201).json({ success: true, settlement });
  } catch (err) {
    next(err);
  }
});

router.get('/settlements', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;

    const settlementsRows = await db.query.settlements.findMany({
      where: (s, { eq: e }) => e(s.tripId, tripId),
      orderBy: (s) => asc(s.settledAt),
    });

    const settlementUserIds = [...new Set(settlementsRows.flatMap((s) => [s.fromUserId, s.toUserId]))];
    const settleUsers =
      settlementUserIds.length === 0
        ? []
        : await db.query.users.findMany({
            where: (u, { inArray: inn }) => inn(u.id, settlementUserIds),
          });
    const settleUsernameById = new Map(settleUsers.map((u) => [u.id, u.username]));

    const list = settlementsRows.map((s) => ({
      id: s.id,
      tripId: s.tripId,
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amount: parseFloat(s.amount),
      currency: s.currency,
      fromUsername: settleUsernameById.get(s.fromUserId) ?? '',
      toUsername: settleUsernameById.get(s.toUserId) ?? '',
      settledAt: s.settledAt instanceof Date ? s.settledAt.toISOString() : new Date((s.settledAt as number) * 1000).toISOString(),
      createdAt:
        s.createdAt instanceof Date ? s.createdAt.toISOString() : new Date((s.createdAt as number) * 1000).toISOString(),
    }));

    res.json({ success: true, settlements: list });
  } catch (err) {
    next(err);
  }
});

export default router;
