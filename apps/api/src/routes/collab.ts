import { Router } from 'express';
import { eq, and, desc, lt, inArray } from 'drizzle-orm';

import { db } from '../db/client';
import {
  collabMessages,
  collabMessageReactions,
  collabNotes,
  collabPolls,
  collabPollVotes,
  users,
} from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { getPublicUrl } from '../lib/storage';
import { getWsManager } from '../lib/ws';

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

function tsIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'number') return new Date(v * 1000).toISOString();
  return new Date().toISOString();
}

async function loadUsersMap(userIds: string[]): Promise<Map<string, typeof users.$inferSelect>> {
  const uniq = [...new Set(userIds)].filter(Boolean);
  if (!uniq.length) return new Map();
  const rows = await db.select().from(users).where(inArray(users.id, uniq));
  return new Map(rows.map((u) => [u.id, u]));
}

// ─── Messages ────────────────────────────────────────────────────────────────

router.get('/messages', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

    let cursorCreatedAt: Date | null = null;
    if (cursor) {
      const [curRow] = await db
        .select()
        .from(collabMessages)
        .where(and(eq(collabMessages.id, cursor), eq(collabMessages.tripId, tripId)))
        .limit(1);
      if (!curRow) throw new AppError('Invalid cursor', 400);
      cursorCreatedAt = curRow.createdAt instanceof Date ? curRow.createdAt : new Date((curRow.createdAt as number) * 1000);
    }

    const pageQuery = db
      .select()
      .from(collabMessages)
      .where(
        cursorCreatedAt
          ? and(eq(collabMessages.tripId, tripId), lt(collabMessages.createdAt, cursorCreatedAt))
          : eq(collabMessages.tripId, tripId),
      )
      .orderBy(desc(collabMessages.createdAt))
      .limit(limit + 1);

    const rawRows = await pageQuery;
    const hasMore = rawRows.length > limit;
    const rows = hasMore ? rawRows.slice(0, limit) : rawRows;
    const nextCursor = hasMore && rows.length ? rows[rows.length - 1]!.id : null;

    const msgIds = rows.map((r) => r.id);
    let reactionsRows: (typeof collabMessageReactions.$inferSelect)[] = [];
    if (msgIds.length) {
      reactionsRows = await db
        .select()
        .from(collabMessageReactions)
        .where(inArray(collabMessageReactions.messageId, msgIds));
    }

    const reactionCounts = new Map<string, Record<string, number>>();
    const myByMessage = new Map<string, Set<string>>();
    for (const r of reactionsRows) {
      const counts = reactionCounts.get(r.messageId) ?? {};
      counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
      reactionCounts.set(r.messageId, counts);
      if (r.userId === userId) {
        const mine = myByMessage.get(r.messageId) ?? new Set();
        mine.add(r.emoji);
        myByMessage.set(r.messageId, mine);
      }
    }

    const authorMap = await loadUsersMap(rows.map((m) => m.userId));

    const messages = rows.map((row) => {
      const author = authorMap.get(row.userId);
      const counts = reactionCounts.get(row.id);
      const mine = myByMessage.get(row.id);
      return {
        id: row.id,
        tripId: row.tripId,
        userId: row.userId,
        username: author?.username ?? 'unknown',
        avatarUrl: getPublicUrl(author?.avatarKey ?? null),
        content: row.content,
        replyToId: row.replyToId,
        isDeleted: row.isDeleted,
        ...(counts && Object.keys(counts).length ? { reactions: counts } : {}),
        ...(mine && mine.size ? { myReactions: [...mine] } : {}),
        createdAt: tsIso(row.createdAt),
      };
    });

    res.json({ messages, nextCursor });
  } catch (err) {
    next(err);
  }
});

router.post('/messages', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;
    const { content, replyToId } = req.body as { content?: string; replyToId?: string };

    const body = typeof content === 'string' ? content.trim() : '';
    if (!body.length || body.length > 4000) throw new AppError('Invalid message content', 400);

    if (replyToId) {
      const [parent] = await db
        .select()
        .from(collabMessages)
        .where(and(eq(collabMessages.id, replyToId), eq(collabMessages.tripId, tripId)))
        .limit(1);
      if (!parent) throw new AppError('Reply target not found', 400);
    }

    const id = crypto.randomUUID();
    await db.insert(collabMessages).values({
      id,
      tripId,
      userId,
      content: body,
      replyToId: replyToId ?? null,
      isDeleted: false,
      createdAt: new Date(),
    });

    const [row] = await db.select().from(collabMessages).where(eq(collabMessages.id, id)).limit(1);
    const authorMap = await loadUsersMap([userId]);
    const author = authorMap.get(userId);
    const message = {
      id: row!.id,
      tripId: row!.tripId,
      userId: row!.userId,
      username: author?.username ?? 'unknown',
      avatarUrl: getPublicUrl(author?.avatarKey ?? null),
      content: row!.content,
      replyToId: row!.replyToId,
      isDeleted: row!.isDeleted,
      createdAt: tsIso(row!.createdAt),
    };

    getWsManager().broadcast(`trip:${tripId}`, 'collab:message', message);

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
});

router.post('/messages/:id/react', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const messageId = req.params.id as string;
    const userId = req.user!.id;
    const { emoji } = req.body as { emoji?: string };
    if (!emoji?.trim()) throw new AppError('emoji is required', 400);

    const [msg] = await db
      .select()
      .from(collabMessages)
      .where(and(eq(collabMessages.id, messageId), eq(collabMessages.tripId, tripId)))
      .limit(1);
    if (!msg || msg.isDeleted) throw new AppError('Message not found', 404);

    const [existing] = await db
      .select()
      .from(collabMessageReactions)
      .where(
        and(
          eq(collabMessageReactions.messageId, messageId),
          eq(collabMessageReactions.userId, userId),
          eq(collabMessageReactions.emoji, emoji.trim()),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .delete(collabMessageReactions)
        .where(
          and(
            eq(collabMessageReactions.messageId, messageId),
            eq(collabMessageReactions.userId, userId),
            eq(collabMessageReactions.emoji, emoji.trim()),
          ),
        );
    } else {
      await db.insert(collabMessageReactions).values({
        messageId,
        userId,
        emoji: emoji.trim(),
      });
    }

    getWsManager().broadcast(`trip:${tripId}`, 'collab:reaction', {
      messageId,
      userId,
      emoji: emoji.trim(),
      removed: !!existing,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/messages/:id', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const messageId = req.params.id as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    const [msg] = await db
      .select()
      .from(collabMessages)
      .where(and(eq(collabMessages.id, messageId), eq(collabMessages.tripId, tripId)))
      .limit(1);
    if (!msg) throw new AppError('Message not found', 404);

    const isOwner = role === 'owner';
    const isAuthor = msg.userId === userId;
    if (!isOwner && !isAuthor) throw new AppError('Forbidden', 403);

    await db.update(collabMessages).set({ isDeleted: true }).where(eq(collabMessages.id, messageId));

    getWsManager().broadcast(`trip:${tripId}`, 'collab:message_deleted', { messageId });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── Notes ─────────────────────────────────────────────────────────────────────

router.get('/notes', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;

    const rows = await db
      .select()
      .from(collabNotes)
      .where(eq(collabNotes.tripId, tripId))
      .orderBy(desc(collabNotes.isPinned), desc(collabNotes.updatedAt));

    const authorMap = await loadUsersMap(rows.map((n) => n.userId));
    const notes = rows.map((row) => {
      const author = authorMap.get(row.userId);
      return {
        id: row.id,
        tripId: row.tripId,
        userId: row.userId,
        username: author?.username,
        title: row.title,
        content: row.content,
        category: row.category ?? null,
        color: row.color ?? null,
        isPinned: row.isPinned,
        createdAt: tsIso(row.createdAt),
        updatedAt: tsIso(row.updatedAt),
      };
    });

    res.json({ notes });
  } catch (err) {
    next(err);
  }
});

router.post('/notes', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;
    const { title, content = '', category, color = '#ffffff' } = req.body as {
      title?: string;
      content?: string;
      category?: string;
      color?: string;
    };

    if (!title?.trim()) throw new AppError('title is required', 400);

    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(collabNotes).values({
      id,
      tripId,
      userId,
      title: title.trim(),
      content: typeof content === 'string' ? content : '',
      category: category?.trim() ?? null,
      color: typeof color === 'string' ? color : '#ffffff',
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    });

    const [row] = await db.select().from(collabNotes).where(eq(collabNotes.id, id)).limit(1);
    const authorMap = await loadUsersMap([userId]);
    const author = authorMap.get(userId);
    const note = {
      id: row!.id,
      tripId: row!.tripId,
      userId: row!.userId,
      username: author?.username,
      title: row!.title,
      content: row!.content,
      category: row!.category ?? null,
      color: row!.color ?? null,
      isPinned: row!.isPinned,
      createdAt: tsIso(row!.createdAt),
      updatedAt: tsIso(row!.updatedAt),
    };

    getWsManager().broadcast(`trip:${tripId}`, 'collab:note_created', note);

    res.status(201).json({ note });
  } catch (err) {
    next(err);
  }
});

router.patch('/notes/:id', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const noteId = req.params.id as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    const [row] = await db
      .select()
      .from(collabNotes)
      .where(and(eq(collabNotes.id, noteId), eq(collabNotes.tripId, tripId)))
      .limit(1);
    if (!row) throw new AppError('Note not found', 404);

    const isAuthor = row.userId === userId;
    const canEditOthers = role === 'editor' || role === 'owner';
    if (!isAuthor && !canEditOthers) throw new AppError('Forbidden', 403);

    const body = req.body as Partial<{ title: string; content: string; category: string; color: string }>;
    const patch: Partial<typeof collabNotes.$inferInsert> = { updatedAt: new Date() };
    if (body.title !== undefined) patch.title = body.title.trim();
    if (body.content !== undefined) patch.content = body.content;
    if (body.category !== undefined) patch.category = body.category?.trim() ?? null;
    if (body.color !== undefined) patch.color = body.color;

    await db.update(collabNotes).set(patch).where(eq(collabNotes.id, noteId));

    const [updated] = await db.select().from(collabNotes).where(eq(collabNotes.id, noteId)).limit(1);
    const authorMap = await loadUsersMap([updated!.userId]);
    const author = authorMap.get(updated!.userId);
    const note = {
      id: updated!.id,
      tripId: updated!.tripId,
      userId: updated!.userId,
      username: author?.username,
      title: updated!.title,
      content: updated!.content,
      category: updated!.category ?? null,
      color: updated!.color ?? null,
      isPinned: updated!.isPinned,
      createdAt: tsIso(updated!.createdAt),
      updatedAt: tsIso(updated!.updatedAt),
    };

    getWsManager().broadcast(`trip:${tripId}`, 'collab:note_updated', note);

    res.json({ note });
  } catch (err) {
    next(err);
  }
});

router.delete('/notes/:id', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const noteId = req.params.id as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    const [row] = await db
      .select()
      .from(collabNotes)
      .where(and(eq(collabNotes.id, noteId), eq(collabNotes.tripId, tripId)))
      .limit(1);
    if (!row) throw new AppError('Note not found', 404);

    const isAuthor = row.userId === userId;
    const isTripOwner = role === 'owner';
    if (!isAuthor && !isTripOwner) throw new AppError('Forbidden', 403);

    await db.delete(collabNotes).where(eq(collabNotes.id, noteId));

    getWsManager().broadcast(`trip:${tripId}`, 'collab:note_deleted', { noteId });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/notes/:id/pin', authenticate, requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const noteId = req.params.id as string;

    const [row] = await db
      .select()
      .from(collabNotes)
      .where(and(eq(collabNotes.id, noteId), eq(collabNotes.tripId, tripId)))
      .limit(1);
    if (!row) throw new AppError('Note not found', 404);

    await db
      .update(collabNotes)
      .set({ isPinned: !row.isPinned, updatedAt: new Date() })
      .where(eq(collabNotes.id, noteId));

    const [updated] = await db.select().from(collabNotes).where(eq(collabNotes.id, noteId)).limit(1);
    const authorMap = await loadUsersMap([updated!.userId]);
    const author = authorMap.get(updated!.userId);
    const note = {
      id: updated!.id,
      tripId: updated!.tripId,
      userId: updated!.userId,
      username: author?.username,
      title: updated!.title,
      content: updated!.content,
      category: updated!.category ?? null,
      color: updated!.color ?? null,
      isPinned: updated!.isPinned,
      createdAt: tsIso(updated!.createdAt),
      updatedAt: tsIso(updated!.updatedAt),
    };

    getWsManager().broadcast(`trip:${tripId}`, 'collab:note_updated', note);

    res.json({ note });
  } catch (err) {
    next(err);
  }
});

// ─── Polls ─────────────────────────────────────────────────────────────────────

function formatCollabPoll(
  poll: typeof collabPolls.$inferSelect,
  votes: (typeof collabPollVotes.$inferSelect)[],
  userId: string,
): {
  id: string;
  tripId: string;
  question: string;
  options: string[];
  isMultiple: boolean;
  isClosed: boolean;
  deadline: string | null;
  votes: { optionIndex: number; count: number }[];
  myVotes: number[];
  totalVoters: number;
  createdAt: string;
} {
  const options = poll.optionsJson ?? [];
  const counts = new Map<number, number>();
  const voters = new Set<string>();
  const myVotes: number[] = [];

  for (const v of votes) {
    if (v.pollId !== poll.id) continue;
    counts.set(v.optionIndex, (counts.get(v.optionIndex) ?? 0) + 1);
    voters.add(v.userId);
    if (v.userId === userId) myVotes.push(v.optionIndex);
  }

  const voteList = options.map((_, i) => ({
    optionIndex: i,
    count: counts.get(i) ?? 0,
  }));

  return {
    id: poll.id,
    tripId: poll.tripId,
    question: poll.question,
    options,
    isMultiple: poll.isMultiple,
    isClosed: poll.isClosed,
    deadline: poll.deadline
      ? tsIso(poll.deadline instanceof Date ? poll.deadline : (poll.deadline as number))
      : null,
    votes: voteList,
    myVotes,
    totalVoters: voters.size,
    createdAt: tsIso(poll.createdAt),
  };
}

router.get('/polls', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const pollsList = await db.select().from(collabPolls).where(eq(collabPolls.tripId, tripId)).orderBy(desc(collabPolls.createdAt));

    const pollIds = pollsList.map((p) => p.id);
    let allVotes: (typeof collabPollVotes.$inferSelect)[] = [];
    if (pollIds.length) {
      allVotes = await db.select().from(collabPollVotes).where(inArray(collabPollVotes.pollId, pollIds));
    }

    const votesByPoll = new Map<string, (typeof collabPollVotes.$inferSelect)[]>();
    for (const v of allVotes) {
      const list = votesByPoll.get(v.pollId) ?? [];
      list.push(v);
      votesByPoll.set(v.pollId, list);
    }

    const polls = pollsList.map((p) => formatCollabPoll(p, votesByPoll.get(p.id) ?? [], userId));

    res.json({ polls });
  } catch (err) {
    next(err);
  }
});

router.post('/polls', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;
    const { question, options, isMultiple = false, deadline } = req.body as {
      question?: string;
      options?: string[];
      isMultiple?: boolean;
      deadline?: string;
    };

    if (!question?.trim()) throw new AppError('question is required', 400);
    if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
      throw new AppError('Between 2 and 10 options are required', 400);
    }
    const cleaned = options.map((o) => String(o).trim()).filter(Boolean);
    if (cleaned.length < 2) throw new AppError('Options must be non-empty', 400);

    const id = crypto.randomUUID();
    await db.insert(collabPolls).values({
      id,
      tripId,
      userId,
      question: question.trim(),
      optionsJson: cleaned,
      isMultiple: !!isMultiple,
      isClosed: false,
      deadline: deadline ? new Date(deadline) : null,
      createdAt: new Date(),
    });

    const [poll] = await db.select().from(collabPolls).where(eq(collabPolls.id, id)).limit(1);
    const formatted = formatCollabPoll(poll!, [], userId);

    getWsManager().broadcast(`trip:${tripId}`, 'collab:poll_new', formatted);

    res.status(201).json({ poll: formatted });
  } catch (err) {
    next(err);
  }
});

router.post('/polls/:id/vote', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const pollId = req.params.id as string;
    const userId = req.user!.id;
    const { optionIndex } = req.body as { optionIndex?: number };

    if (typeof optionIndex !== 'number' || !Number.isFinite(optionIndex) || optionIndex < 0) {
      throw new AppError('optionIndex is required', 400);
    }

    const [poll] = await db
      .select()
      .from(collabPolls)
      .where(and(eq(collabPolls.id, pollId), eq(collabPolls.tripId, tripId)))
      .limit(1);
    if (!poll) throw new AppError('Poll not found', 404);
    if (poll.isClosed) throw new AppError('Poll is closed', 400);

    const opts = poll.optionsJson ?? [];
    if (optionIndex >= opts.length) throw new AppError('Invalid option', 400);

    if (poll.deadline) {
      const d = poll.deadline instanceof Date ? poll.deadline : new Date((poll.deadline as number) * 1000);
      if (d.getTime() < Date.now()) throw new AppError('Poll deadline has passed', 400);
    }

    if (!poll.isMultiple) {
      await db.delete(collabPollVotes).where(and(eq(collabPollVotes.pollId, pollId), eq(collabPollVotes.userId, userId)));
      await db.insert(collabPollVotes).values({ pollId, userId, optionIndex });
    } else {
      const [existing] = await db
        .select()
        .from(collabPollVotes)
        .where(
          and(eq(collabPollVotes.pollId, pollId), eq(collabPollVotes.userId, userId), eq(collabPollVotes.optionIndex, optionIndex)),
        )
        .limit(1);
      if (existing) {
        await db
          .delete(collabPollVotes)
          .where(
            and(
              eq(collabPollVotes.pollId, pollId),
              eq(collabPollVotes.userId, userId),
              eq(collabPollVotes.optionIndex, optionIndex),
            ),
          );
      } else {
        await db.insert(collabPollVotes).values({ pollId, userId, optionIndex });
      }
    }

    const pollVotes = await db.select().from(collabPollVotes).where(eq(collabPollVotes.pollId, pollId));
    const formatted = formatCollabPoll(poll, pollVotes, userId);

    getWsManager().broadcast(`trip:${tripId}`, 'collab:poll_voted', {
      pollId,
      poll: formatted,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/polls/:id/close', authenticate, requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const pollId = req.params.id as string;
    const userId = req.user!.id;

    const [poll] = await db
      .select()
      .from(collabPolls)
      .where(and(eq(collabPolls.id, pollId), eq(collabPolls.tripId, tripId)))
      .limit(1);
    if (!poll) throw new AppError('Poll not found', 404);

    await db.update(collabPolls).set({ isClosed: true }).where(eq(collabPolls.id, pollId));

    const [closed] = await db.select().from(collabPolls).where(eq(collabPolls.id, pollId)).limit(1);
    const pollVotes = await db.select().from(collabPollVotes).where(eq(collabPollVotes.pollId, pollId));
    const formatted = formatCollabPoll(closed!, pollVotes, userId);

    getWsManager().broadcast(`trip:${tripId}`, 'collab:poll_closed', {
      pollId,
      poll: formatted,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
