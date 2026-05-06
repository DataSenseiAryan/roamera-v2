import { Router } from 'express';
import { eq, and, desc, inArray, count } from 'drizzle-orm';

import { db } from '../db/client';
import {
  circles,
  circleMembers,
  circleMessages,
  circleMessageReactions,
  circlePolls,
  circlePollVotes,
  users,
  trips,
} from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { getWsManager } from '../lib/ws';
import { getPublicUrl } from '../lib/storage';

const router = Router();

type CircleRole = 'owner' | 'member';

async function getMemberRole(circleId: string, userId: string): Promise<CircleRole | null> {
  const member = await db.query.circleMembers.findFirst({
    where: (t, { and: a, eq: e }) => a(e(t.circleId, circleId), e(t.userId, userId)),
  });
  return (member?.role as CircleRole) ?? null;
}

function requireCircleRole(minRole: CircleRole) {
  return async (
    req: AuthRequest,
    _res: unknown,
    next: (err?: unknown) => void,
  ) => {
    try {
      const circleId = req.params.circleId as string;
      const userId = req.user!.id;
      const role = await getMemberRole(circleId, userId);
      if (!role || (minRole === 'owner' && role !== 'owner')) {
        throw new AppError('Forbidden', 403);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

function toISO(value: Date | number | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value * 1000).toISOString();
  return null;
}

function parseOptionalDate(input: unknown): Date | null | undefined {
  if (input === undefined) return undefined;
  if (input === null || input === '') return null;
  const d = new Date(String(input));
  if (Number.isNaN(d.getTime())) throw new AppError('Invalid date', 400);
  return d;
}

async function memberCountsForCircleIds(ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const rows = await db
    .select({
      circleId: circleMembers.circleId,
      c: count(),
    })
    .from(circleMembers)
    .where(inArray(circleMembers.circleId, ids))
    .groupBy(circleMembers.circleId);
  for (const row of rows) {
    map.set(row.circleId, row.c);
  }
  return map;
}

async function tripTitlesForIds(ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean) as string[])];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const rows = await db
    .select({ id: trips.id, title: trips.title })
    .from(trips)
    .where(inArray(trips.id, unique));
  for (const row of rows) {
    map.set(row.id, row.title);
  }
  return map;
}

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const memberships = await db.query.circleMembers.findMany({
      where: (t, { eq: e }) => e(t.userId, userId),
    });

    const fromMembership: typeof circles.$inferSelect[] = [];
    const roleByCircleId = new Map<string, CircleRole>();
    for (const m of memberships) {
      const c = await db.query.circles.findFirst({
        where: (t, { eq: e }) => e(t.id, m.circleId),
      });
      if (c) {
        fromMembership.push(c);
        roleByCircleId.set(m.circleId, m.role as CircleRole);
      }
    }

    const publicRows = await db.select().from(circles).where(eq(circles.isPublic, true));

    const merged = new Map<string, typeof circles.$inferSelect>();
    for (const c of fromMembership) merged.set(c.id, c);
    for (const c of publicRows) {
      if (!merged.has(c.id)) merged.set(c.id, c);
    }

    const ids = [...merged.keys()];
    const counts = await memberCountsForCircleIds(ids);
    const tripTitles = await tripTitlesForIds([...merged.values()].map((c) => c.linkedTripId));

    const payload = ids.map((id) => {
      const c = merged.get(id)!;
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        destination: c.destination,
        dateFrom: toISO(c.dateFrom as Date | number | undefined),
        dateTo: toISO(c.dateTo as Date | number | undefined),
        isPublic: c.isPublic,
        linkedTripId: c.linkedTripId,
        linkedTripTitle: c.linkedTripId ? tripTitles.get(c.linkedTripId) ?? null : null,
        memberCount: counts.get(id) ?? 0,
        myRole: roleByCircleId.get(id) ?? null,
        createdAt: toISO(c.createdAt as Date | number | undefined)!,
      };
    });

    res.json({ circles: payload });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      description,
      destination,
      dateFrom,
      dateTo,
      isPublic = true,
    } = req.body as {
      title: string;
      description?: string;
      destination?: string;
      dateFrom?: string;
      dateTo?: string;
      isPublic?: boolean;
    };

    if (!title?.trim()) throw new AppError('Title is required', 400);

    const id = crypto.randomUUID();

    await db.insert(circles).values({
      id,
      ownerId: userId,
      title: title.trim(),
      description: description?.trim() ?? null,
      destination: destination?.trim() ?? null,
      dateFrom: parseOptionalDate(dateFrom) ?? null,
      dateTo: parseOptionalDate(dateTo) ?? null,
      isPublic: Boolean(isPublic),
      createdAt: new Date(),
    });

    await db.insert(circleMembers).values({
      circleId: id,
      userId,
      role: 'owner',
      joinedAt: new Date(),
    });

    const row = await db.query.circles.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });

    res.status(201).json({
      success: true,
      circle: {
        ...formatCircleDetail(row!),
        myRole: 'owner' as const,
        memberCount: 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

function formatCircleDetail(c: typeof circles.$inferSelect) {
  return {
    id: c.id,
    ownerId: c.ownerId,
    title: c.title,
    description: c.description,
    destination: c.destination,
    dateFrom: toISO(c.dateFrom as Date | number | undefined),
    dateTo: toISO(c.dateTo as Date | number | undefined),
    isPublic: c.isPublic,
    coverUrl: c.coverKey ? getPublicUrl(c.coverKey) : null,
    linkedTripId: c.linkedTripId,
    createdAt: toISO(c.createdAt as Date | number | undefined)!,
  };
}

router.get('/:circleId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const circleId = req.params.circleId as string;
    const userId = req.user!.id;

    const circle = await db.query.circles.findFirst({
      where: (t, { eq: e }) => e(t.id, circleId),
    });
    if (!circle) throw new AppError('Circle not found', 404);

    const role = await getMemberRole(circleId, userId);
    if (!circle.isPublic && !role) throw new AppError('Forbidden', 403);

    const membersRows = await db.query.circleMembers.findMany({
      where: (t, { eq: e }) => e(t.circleId, circleId),
    });

    const members = await Promise.all(
      membersRows.map(async (m) => {
        const u = await db.query.users.findFirst({
          where: (t, { eq: e }) => e(t.id, m.userId),
        });
        return {
          userId: m.userId,
          role: m.role,
          username: u?.username ?? '',
          displayName: u?.username ?? '',
          avatarKey: u?.avatarKey ?? null,
          joinedAt: toISO(m.joinedAt as Date | number | undefined)!,
        };
      }),
    );

    let linkedTripTitle: string | null = null;
    if (circle.linkedTripId) {
      const trip = await db.query.trips.findFirst({
        where: (t, { eq: e }) => e(t.id, circle.linkedTripId!),
      });
      linkedTripTitle = trip?.title ?? null;
    }

    const memberCount = membersRows.length;

    res.json({
      success: true,
      circle: {
        ...formatCircleDetail(circle),
        myRole: role,
      },
      members,
      linkedTripTitle,
      memberCount,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:circleId', authenticate, requireCircleRole('owner'), async (req: AuthRequest, res, next) => {
  try {
    const circleId = req.params.circleId as string;
    const body = req.body as Record<string, unknown>;

    const circle = await db.query.circles.findFirst({
      where: (t, { eq: e }) => e(t.id, circleId),
    });
    if (!circle) throw new AppError('Circle not found', 404);

    const patch: Partial<typeof circles.$inferInsert> = {};

    if ('title' in body && body.title !== undefined) {
      const t = String(body.title).trim();
      if (!t) throw new AppError('Title cannot be empty', 400);
      patch.title = t;
    }
    if ('description' in body) patch.description = body.description == null ? null : String(body.description);
    if ('destination' in body) {
      patch.destination = body.destination == null ? null : String(body.destination);
    }
    if ('dateFrom' in body) {
      patch.dateFrom = parseOptionalDate(body.dateFrom) ?? null;
    }
    if ('dateTo' in body) {
      patch.dateTo = parseOptionalDate(body.dateTo) ?? null;
    }
    if ('isPublic' in body && body.isPublic !== undefined) {
      patch.isPublic = Boolean(body.isPublic);
    }
    if ('coverKey' in body) {
      patch.coverKey = body.coverKey == null ? null : String(body.coverKey);
    }
    if ('linkedTripId' in body) {
      patch.linkedTripId = body.linkedTripId == null ? null : String(body.linkedTripId);
    }

    if (Object.keys(patch).length === 0) throw new AppError('No valid fields to update', 400);

    await db.update(circles).set(patch).where(eq(circles.id, circleId));

    const updated = await db.query.circles.findFirst({
      where: (t, { eq: e }) => e(t.id, circleId),
    });

    res.json({ success: true, circle: formatCircleDetail(updated!) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:circleId', authenticate, requireCircleRole('owner'), async (req: AuthRequest, res, next) => {
  try {
    const circleId = req.params.circleId as string;
    await db.delete(circles).where(eq(circles.id, circleId));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:circleId/join', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const circleId = req.params.circleId as string;
    const userId = req.user!.id;

    const circle = await db.query.circles.findFirst({
      where: (t, { eq: e }) => e(t.id, circleId),
    });
    if (!circle) throw new AppError('Circle not found', 404);
    if (!circle.isPublic) throw new AppError('Forbidden', 403);

    const existing = await getMemberRole(circleId, userId);
    if (existing) throw new AppError('Already a member', 400);

    await db.insert(circleMembers).values({
      circleId,
      userId,
      role: 'member',
      joinedAt: new Date(),
    });

    getWsManager().broadcast(`circle:${circleId}`, 'circle:member_joined', { circleId, userId });
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:circleId/leave', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const circleId = req.params.circleId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(circleId, userId);
    if (!role) throw new AppError('Not a member', 400);
    if (role === 'owner') throw new AppError('Owner cannot leave; delete the circle instead', 403);

    await db
      .delete(circleMembers)
      .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));

    getWsManager().broadcast(`circle:${circleId}`, 'circle:member_left', { circleId, userId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:circleId/invite', authenticate, requireCircleRole('owner'), async (req: AuthRequest, res, next) => {
  try {
    const circleId = req.params.circleId as string;
    const userId = req.user!.id;
    const { usernames } = req.body as { usernames?: string[] };

    if (!Array.isArray(usernames) || usernames.length === 0) {
      throw new AppError('usernames array is required', 400);
    }

    const circle = await db.query.circles.findFirst({
      where: (t, { eq: e }) => e(t.id, circleId),
    });
    if (!circle) throw new AppError('Circle not found', 404);

    const normalized = [...new Set(usernames.map((u) => String(u).trim()).filter(Boolean))];

    let addedCount = 0;
    for (const username of normalized) {
      const target = await db.query.users.findFirst({
        where: (t, { eq: e }) => e(t.username, username),
      });
      if (!target || target.id === userId) continue;

      const already = await db.query.circleMembers.findFirst({
        where: (t, { and: a, eq: e }) => a(e(t.circleId, circleId), e(t.userId, target.id)),
      });
      if (already) continue;

      await db.insert(circleMembers).values({
        circleId,
        userId: target.id,
        role: 'member',
        joinedAt: new Date(),
      });
      getWsManager().broadcast(`circle:${circleId}`, 'circle:member_joined', { circleId, userId: target.id });
      addedCount += 1;
    }

    res.json({ addedCount });
  } catch (err) {
    next(err);
  }
});

router.delete(
  '/:circleId/members/:userId',
  authenticate,
  requireCircleRole('owner'),
  async (req: AuthRequest, res, next) => {
    try {
      const circleId = req.params.circleId as string;
      const actorId = req.user!.id;
      const targetUserId = req.params.userId as string;

      if (targetUserId === actorId) throw new AppError('Use leave to remove yourself', 400);

      const circle = await db.query.circles.findFirst({
        where: (t, { eq: e }) => e(t.id, circleId),
      });
      if (!circle) throw new AppError('Circle not found', 404);
      if (targetUserId === circle.ownerId) throw new AppError('Cannot remove the circle owner', 403);

      const targetMembership = await db.query.circleMembers.findFirst({
        where: (t, { and: a, eq: e }) => a(e(t.circleId, circleId), e(t.userId, targetUserId)),
      });
      if (!targetMembership) throw new AppError('Member not found', 404);

      await db
        .delete(circleMembers)
        .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, targetUserId)));

      getWsManager().broadcast(`circle:${circleId}`, 'circle:member_left', { circleId, userId: targetUserId });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

async function reactionsGrouped(messageIds: string[]) {
  const map = new Map<string, { emoji: string; count: number }[]>();
  if (messageIds.length === 0) return map;

  const rows = await db
    .select({
      messageId: circleMessageReactions.messageId,
      emoji: circleMessageReactions.emoji,
      c: count(),
    })
    .from(circleMessageReactions)
    .where(inArray(circleMessageReactions.messageId, messageIds))
    .groupBy(circleMessageReactions.messageId, circleMessageReactions.emoji);

  for (const row of rows) {
    const list = map.get(row.messageId) ?? [];
    list.push({ emoji: row.emoji, count: row.c });
    map.set(row.messageId, list);
  }
  return map;
}

router.get(
  '/:circleId/messages',
  authenticate,
  requireCircleRole('member'),
  async (req: AuthRequest, res, next) => {
    try {
      const circleId = req.params.circleId as string;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

      let olderThan: Date | number | undefined;
      if (cursor) {
        const curRow = await db.query.circleMessages.findFirst({
          where: (t, { and: a, eq: e }) => a(e(t.id, cursor), e(t.circleId, circleId)),
        });
        if (!curRow) throw new AppError('Invalid cursor', 400);
        olderThan = curRow.createdAt as Date | number;
      }

      let rows = await db.query.circleMessages.findMany({
        where: (t, { and: a, eq: e, lt: l }) =>
          olderThan ? a(e(t.circleId, circleId), l(t.createdAt, olderThan as Date)) : e(t.circleId, circleId),
        orderBy: (t) => [desc(t.createdAt)],
        limit,
      });

      rows = rows.reverse();

      const mids = rows.map((r) => r.id);
      const reactionMap = await reactionsGrouped(mids);

      const messages = await Promise.all(
        rows.map(async (msg) => {
          const u = await db.query.users.findFirst({
            where: (t, { eq: e }) => e(t.id, msg.userId),
          });
          return {
            id: msg.id,
            circleId: msg.circleId,
            userId: msg.userId,
            content: msg.isDeleted ? '' : msg.content,
            isDeleted: Boolean(msg.isDeleted),
            replyToId: msg.replyToId,
            createdAt: toISO(msg.createdAt as Date | number | undefined)!,
            author: {
              username: u?.username ?? '',
              avatarKey: u?.avatarKey ?? null,
            },
            reactions: reactionMap.get(msg.id) ?? [],
          };
        }),
      );

      const nextCursor =
        rows.length === limit && rows.length > 0 ? rows[0]?.id ?? null : null;

      res.json({ messages, nextCursor });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:circleId/messages',
  authenticate,
  requireCircleRole('member'),
  async (req: AuthRequest, res, next) => {
    try {
      const circleId = req.params.circleId as string;
      const userId = req.user!.id;
      const { content, replyToId } = req.body as { content?: string; replyToId?: string };

      if (!content?.trim()) throw new AppError('Content is required', 400);

      if (replyToId) {
        const parent = await db.query.circleMessages.findFirst({
          where: (t, { and: a, eq: e }) => a(e(t.id, replyToId), e(t.circleId, circleId)),
        });
        if (!parent) throw new AppError('Reply target not found', 400);
      }

      const id = crypto.randomUUID();
      await db.insert(circleMessages).values({
        id,
        circleId,
        userId,
        content: content.trim(),
        replyToId: replyToId ?? null,
        isDeleted: false,
        createdAt: new Date(),
      });

      const msg = await db.query.circleMessages.findFirst({
        where: (t, { eq: e }) => e(t.id, id),
      });
      const u = await db.query.users.findFirst({
        where: (t, { eq: e }) => e(t.id, userId),
      });

      const message = {
        id: msg!.id,
        circleId: msg!.circleId,
        userId: msg!.userId,
        content: msg!.content,
        isDeleted: Boolean(msg!.isDeleted),
        replyToId: msg!.replyToId,
        createdAt: toISO(msg!.createdAt as Date | number | undefined)!,
        author: {
          username: u?.username ?? '',
          avatarKey: u?.avatarKey ?? null,
        },
        reactions: [] as { emoji: string; count: number }[],
      };

      const ws = getWsManager();
      ws.broadcast(`circle:${circleId}`, 'circle:message', { circleId, message });

      res.status(201).json({ message });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:circleId/messages/:id/react',
  authenticate,
  requireCircleRole('member'),
  async (req: AuthRequest, res, next) => {
    try {
      const circleId = req.params.circleId as string;
      const messageId = req.params.id as string;
      const userId = req.user!.id;
      const { emoji } = req.body as { emoji?: string };

      if (!emoji?.trim()) throw new AppError('emoji is required', 400);

      const msg = await db.query.circleMessages.findFirst({
        where: (t, { and: a, eq: e }) => a(e(t.id, messageId), e(t.circleId, circleId)),
      });
      if (!msg || msg.isDeleted) throw new AppError('Message not found', 404);

      const existing = await db.query.circleMessageReactions.findFirst({
        where: (t, { and: a, eq: e }) =>
          a(a(e(t.messageId, messageId), e(t.userId, userId)), e(t.emoji, emoji.trim())),
      });

      if (existing) {
        await db
          .delete(circleMessageReactions)
          .where(
            and(
              eq(circleMessageReactions.messageId, messageId),
              eq(circleMessageReactions.userId, userId),
              eq(circleMessageReactions.emoji, emoji.trim()),
            ),
          );
      } else {
        await db.insert(circleMessageReactions).values({
          messageId,
          userId,
          emoji: emoji.trim(),
        });
      }

      const reactionMap = await reactionsGrouped([messageId]);
      const reactions = reactionMap.get(messageId) ?? [];

      const ws = getWsManager();
      ws.broadcast(`circle:${circleId}`, 'circle:reaction', {
        circleId,
        messageId,
        reactions,
      });

      res.json({ reactions });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:circleId/messages/:id',
  authenticate,
  requireCircleRole('member'),
  async (req: AuthRequest, res, next) => {
    try {
      const circleId = req.params.circleId as string;
      const messageId = req.params.id as string;
      const userId = req.user!.id;

      const msg = await db.query.circleMessages.findFirst({
        where: (t, { and: a, eq: e }) => a(e(t.id, messageId), e(t.circleId, circleId)),
      });
      if (!msg) throw new AppError('Message not found', 404);

      const circle = await db.query.circles.findFirst({
        where: (t, { eq: e }) => e(t.id, circleId),
      });

      const isAuthor = msg.userId === userId;
      const isCircleOwner = circle?.ownerId === userId;
      if (!isAuthor && !isCircleOwner) throw new AppError('Forbidden', 403);

      await db
        .update(circleMessages)
        .set({ isDeleted: true })
        .where(eq(circleMessages.id, messageId));

      const ws = getWsManager();
      ws.broadcast(`circle:${circleId}`, 'circle:message_deleted', { circleId, messageId });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

async function formatPollResponse(pollId: string, userId: string) {
  const poll = await db.query.circlePolls.findFirst({
    where: (t, { eq: e }) => e(t.id, pollId),
  });
  if (!poll) return null;

  const options = poll.optionsJson ?? [];
  const votesRows = await db.query.circlePollVotes.findMany({
    where: (t, { eq: e }) => e(t.pollId, pollId),
  });

  const votes = options.map((_, optionIndex) => ({
    optionIndex,
    count: votesRows.filter((v) => v.optionIndex === optionIndex).length,
  }));

  const myVotes = [
    ...new Set(
      votesRows.filter((v) => v.userId === userId).map((v) => v.optionIndex),
    ),
  ].sort((a, b) => a - b);

  return {
    id: poll.id,
    question: poll.question,
    options,
    isMultiple: poll.isMultiple,
    isClosed: poll.isClosed,
    deadline: toISO(poll.deadline as Date | number | undefined),
    votes,
    myVotes,
    createdAt: toISO(poll.createdAt as Date | number | undefined)!,
  };
}

router.get(
  '/:circleId/polls',
  authenticate,
  requireCircleRole('member'),
  async (req: AuthRequest, res, next) => {
    try {
      const circleId = req.params.circleId as string;
      const userId = req.user!.id;

      const pollsRows = await db.query.circlePolls.findMany({
        where: (t, { eq: e }) => e(t.circleId, circleId),
        orderBy: (t) => desc(t.createdAt),
      });

      const polls = (
        await Promise.all(pollsRows.map((p) => formatPollResponse(p.id, userId)))
      ).filter(Boolean);

      res.json({ polls });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:circleId/polls',
  authenticate,
  requireCircleRole('member'),
  async (req: AuthRequest, res, next) => {
    try {
      const circleId = req.params.circleId as string;
      const userId = req.user!.id;
      const {
        question,
        options,
        isMultiple = false,
        deadline,
      } = req.body as {
        question?: string;
        options?: string[];
        isMultiple?: boolean;
        deadline?: string | null;
      };

      if (!question?.trim()) throw new AppError('question is required', 400);
      if (!Array.isArray(options) || options.length < 2) {
        throw new AppError('At least two options are required', 400);
      }

      const cleanOptions = options.map((o) => String(o).trim()).filter(Boolean);
      if (cleanOptions.length < 2) throw new AppError('At least two options are required', 400);

      const id = crypto.randomUUID();
      await db.insert(circlePolls).values({
        id,
        circleId,
        userId,
        question: question.trim(),
        optionsJson: cleanOptions,
        isMultiple: Boolean(isMultiple),
        isClosed: false,
        deadline: deadline ? parseOptionalDate(deadline) ?? null : null,
        createdAt: new Date(),
      });

      const poll = await formatPollResponse(id, userId);

      const ws = getWsManager();
      ws.broadcast(`circle:${circleId}`, 'circle:poll_new', { circleId, poll });

      res.status(201).json({ poll });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:circleId/polls/:id/vote',
  authenticate,
  requireCircleRole('member'),
  async (req: AuthRequest, res, next) => {
    try {
      const circleId = req.params.circleId as string;
      const pollId = req.params.id as string;
      const userId = req.user!.id;
      const body = req.body as { optionIndex?: number; optionIndices?: number[] };

      const poll = await db.query.circlePolls.findFirst({
        where: (t, { and: a, eq: e }) => a(e(t.id, pollId), e(t.circleId, circleId)),
      });
      if (!poll) throw new AppError('Poll not found', 404);
      if (poll.isClosed) throw new AppError('Poll is closed', 400);

      const optionCount = poll.optionsJson.length;

      let indices: number[] = [];
      if (poll.isMultiple) {
        if (Array.isArray(body.optionIndices)) {
          indices = body.optionIndices.map((i) => Number(i));
        } else if (body.optionIndex !== undefined) {
          indices = [Number(body.optionIndex)];
        }
      } else if (body.optionIndex !== undefined) {
        indices = [Number(body.optionIndex)];
      } else {
        throw new AppError('optionIndex or optionIndices required', 400);
      }

      if (indices.length === 0) throw new AppError('No option selected', 400);
      if (!poll.isMultiple && indices.length !== 1) {
        throw new AppError('Single-choice poll accepts one option', 400);
      }

      const uniqueIdx = [...new Set(indices)];
      for (const idx of uniqueIdx) {
        if (!Number.isInteger(idx) || idx < 0 || idx >= optionCount) {
          throw new AppError('Invalid option index', 400);
        }
      }

      await db.delete(circlePollVotes).where(and(eq(circlePollVotes.pollId, pollId), eq(circlePollVotes.userId, userId)));

      await db.insert(circlePollVotes).values(
        uniqueIdx.map((optionIndex) => ({
          pollId,
          userId,
          optionIndex,
        })),
      );

      const updated = await formatPollResponse(pollId, userId);

      const ws = getWsManager();
      ws.broadcast(`circle:${circleId}`, 'circle:poll_voted', {
        circleId,
        pollId,
        votes: updated!.votes,
        myVotes: updated!.myVotes,
      });

      res.json({ poll: updated });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:circleId/polls/:id/close',
  authenticate,
  requireCircleRole('owner'),
  async (req: AuthRequest, res, next) => {
    try {
      const circleId = req.params.circleId as string;
      const pollId = req.params.id as string;

      const poll = await db.query.circlePolls.findFirst({
        where: (t, { and: a, eq: e }) => a(e(t.id, pollId), e(t.circleId, circleId)),
      });
      if (!poll) throw new AppError('Poll not found', 404);

      await db.update(circlePolls).set({ isClosed: true }).where(eq(circlePolls.id, pollId));

      const ws = getWsManager();
      ws.broadcast(`circle:${circleId}`, 'circle:poll_closed', { circleId, pollId });

      const closed = await formatPollResponse(pollId, req.user!.id);
      res.json({ poll: closed });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
