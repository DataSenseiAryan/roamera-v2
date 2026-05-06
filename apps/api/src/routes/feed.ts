import { Router } from 'express';
import { eq, and, like, or, sql, desc, count, inArray } from 'drizzle-orm';

import { FeedParamsSchema, AddBucketListSchema } from '@roamera/types';

import { db } from '../db/client';
import {
  posts,
  postPhotos,
  reactions,
  savedPosts,
  bucketList,
  destinations,
  users,
  follows,
} from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { getPublicUrl } from '../lib/storage';

const router = Router();

function param(req: AuthRequest, name: string): string {
  return req.params[name] as string;
}

// ─── Helpers ───────────────────────────────────────────────────────

function formatTimestamp(ts: Date | number | null): string | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts.toISOString();
  return new Date(ts as number).toISOString();
}

function encodeCursor(row: { createdAt: Date | number | null; id: string }): string {
  const ts =
    row.createdAt instanceof Date
      ? Math.floor(row.createdAt.getTime() / 1000)
      : row.createdAt;
  return Buffer.from(JSON.stringify({ createdAt: ts, id: row.id })).toString('base64');
}

function decodeCursor(cursor: string): { createdAt: number; id: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString());
  } catch {
    return null;
  }
}

async function formatPostForFeed(
  post: typeof posts.$inferSelect,
  viewerId: string,
) {
  const author = await db.query.users.findFirst({
    where: (t, { eq: e }) => e(t.id, post.userId),
  });

  const photos = await db
    .select()
    .from(postPhotos)
    .where(eq(postPhotos.postId, post.id))
    .orderBy(postPhotos.orderIndex);

  const reactionRows = await db
    .select({ type: reactions.type, cnt: count() })
    .from(reactions)
    .where(eq(reactions.postId, post.id))
    .groupBy(reactions.type);
  const reactionCounts: Record<string, number> = {};
  for (const r of reactionRows) reactionCounts[r.type] = r.cnt;

  const viewerReaction = await db.query.reactions.findFirst({
    where: (t, { eq: e, and: a }) =>
      a(e(t.postId, post.id), e(t.userId, viewerId)),
  });

  const saved = await db
    .select()
    .from(savedPosts)
    .where(and(eq(savedPosts.userId, viewerId), eq(savedPosts.postId, post.id)))
    .limit(1);

  return {
    id: post.id,
    userId: post.userId,
    title: post.title,
    content: post.content,
    destinations: post.destinations ?? [],
    coverUrl: getPublicUrl(post.coverKey),
    photos: photos.map((p) => ({
      id: p.id,
      storageKey: p.storageKey,
      url: getPublicUrl(p.storageKey) ?? '',
      orderIndex: p.orderIndex,
      caption: p.caption,
    })),
    dateFrom: formatTimestamp(post.dateFrom),
    dateTo: formatTimestamp(post.dateTo),
    activities: post.activities ?? [],
    hashtags: post.hashtags ?? [],
    budgetInr: post.budgetInr,
    vacationType: post.vacationType,
    transportMode: post.transportMode,
    isPublished: post.isPublished,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    isSaved: saved.length > 0,
    viewerReaction: viewerReaction?.type ?? null,
    reactionCounts,
    author: {
      id: author?.id ?? '',
      username: author?.username ?? '',
      avatarUrl: getPublicUrl(author?.avatarKey ?? null),
    },
    createdAt: formatTimestamp(post.createdAt) ?? new Date().toISOString(),
  };
}

// ─── GET /compass — main feed ─────────────────────────────────────

router.get('/compass', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const params = FeedParamsSchema.parse(req.query);
    const userId = req.user!.id;
    const limit = params.limit;

    let baseConditions = eq(posts.isPublished, true);

    if (params.feed === 'following') {
      const followingRows = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));
      const followingIds = followingRows.map((f) => f.followingId);

      if (followingIds.length === 0) {
        return res.json({ success: true, posts: [], nextCursor: null, hasMore: false });
      }

      baseConditions = and(
        eq(posts.isPublished, true),
        inArray(posts.userId, followingIds),
      )!;
    }

    let rows;
    if (params.cursor) {
      const decoded = decodeCursor(params.cursor);
      if (decoded) {
        rows = await db
          .select()
          .from(posts)
          .where(
            and(
              baseConditions,
              sql`(${posts.createdAt} < ${decoded.createdAt} OR (${posts.createdAt} = ${decoded.createdAt} AND ${posts.id} < ${decoded.id}))`,
            ),
          )
          .orderBy(desc(posts.createdAt), desc(posts.id))
          .limit(limit + 1);
      } else {
        rows = await db
          .select()
          .from(posts)
          .where(baseConditions)
          .orderBy(desc(posts.createdAt), desc(posts.id))
          .limit(limit + 1);
      }
    } else {
      rows = await db
        .select()
        .from(posts)
        .where(baseConditions)
        .orderBy(desc(posts.createdAt), desc(posts.id))
        .limit(limit + 1);
    }

    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    const formatted = await Promise.all(
      rows.map((p) => formatPostForFeed(p, userId)),
    );

    const nextCursor =
      hasMore && rows.length > 0 ? encodeCursor(rows[rows.length - 1]) : null;

    res.json({ success: true, posts: formatted, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
});

// ─── GET /trending ────────────────────────────────────────────────

router.get('/trending', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;

    const allPosts = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.isPublished, true),
          sql`${posts.createdAt} > ${oneWeekAgo}`,
        ),
      );

    // Count destinations from post destinations JSON
    const destCounts: Record<string, number> = {};
    const hashtagCounts: Record<string, number> = {};

    for (const p of allPosts) {
      const dests = (p.destinations ?? []) as Array<{ name: string }>;
      for (const d of dests) {
        destCounts[d.name] = (destCounts[d.name] ?? 0) + 1;
      }
      const tags = (p.hashtags ?? []) as string[];
      for (const t of tags) {
        hashtagCounts[t] = (hashtagCounts[t] ?? 0) + 1;
      }
    }

    const topDestNames = Object.entries(destCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const topDests = [];
    for (const name of topDestNames) {
      const dest = await db.query.destinations.findFirst({
        where: (t, { eq: e }) => e(t.name, name),
      });
      if (dest) {
        topDests.push({
          id: dest.id,
          name: dest.name,
          country: dest.country,
          description: dest.description,
          category: dest.category,
          coverUrl: getPublicUrl(dest.coverKey),
          lat: dest.lat,
          lng: dest.lng,
          isFeatured: dest.isFeatured,
          createdAt: formatTimestamp(dest.createdAt) ?? '',
        });
      }
    }

    const topHashtags = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, cnt]) => ({ tag, count: cnt }));

    res.json({ success: true, destinations: topDests, hashtags: topHashtags });
  } catch (err) {
    next(err);
  }
});

// ─── GET /destinations — all destinations ─────────────────────────

router.get('/destinations', async (req, res, next) => {
  try {
    const category = req.query.category as string | undefined;
    const country = req.query.country as string | undefined;

    let conditions = sql`1=1`;
    if (category) {
      conditions = sql`${destinations.category} = ${category}`;
    }
    if (country) {
      conditions = category
        ? sql`${destinations.category} = ${category} AND ${destinations.country} = ${country}`
        : sql`${destinations.country} = ${country}`;
    }

    const rows = await db
      .select()
      .from(destinations)
      .where(conditions)
      .orderBy(destinations.name);

    const formatted = rows.map((d) => ({
      id: d.id,
      name: d.name,
      country: d.country,
      description: d.description,
      category: d.category,
      coverUrl: getPublicUrl(d.coverKey),
      lat: d.lat,
      lng: d.lng,
      isFeatured: d.isFeatured,
      createdAt: formatTimestamp(d.createdAt) ?? '',
    }));

    res.json({ success: true, destinations: formatted });
  } catch (err) {
    next(err);
  }
});

// ─── GET /destinations/:id ────────────────────────────────────────

router.get('/destinations/:id', async (req, res, next) => {
  try {
    const destId = req.params.id as string;
    const dest = await db.query.destinations.findFirst({
      where: (t, { eq: e }) => e(t.id, destId),
    });
    if (!dest) throw new AppError('Destination not found', 404);

    const recentPosts = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.isPublished, true),
          sql`json_extract(${posts.destinations}, '$') LIKE ${'%' + dest.name + '%'}`,
        ),
      )
      .orderBy(desc(posts.createdAt))
      .limit(10);

    const formatted = {
      id: dest.id,
      name: dest.name,
      country: dest.country,
      description: dest.description,
      category: dest.category,
      coverUrl: getPublicUrl(dest.coverKey),
      lat: dest.lat,
      lng: dest.lng,
      isFeatured: dest.isFeatured,
      createdAt: formatTimestamp(dest.createdAt) ?? '',
    };

    res.json({ success: true, destination: formatted, recentPosts });
  } catch (err) {
    next(err);
  }
});

// ─── GET /search — unified search ────────────────────────────────

router.get('/search', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      return res.json({ success: true, posts: [], users: [], destinations: [] });
    }

    const pattern = `%${q}%`;

    const postResults = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.isPublished, true),
          or(like(posts.title, pattern), like(posts.content, pattern)),
        ),
      )
      .orderBy(desc(posts.createdAt))
      .limit(10);

    const userResults = await db
      .select()
      .from(users)
      .where(or(like(users.username, pattern), like(users.bio, pattern)))
      .limit(10);

    const destResults = await db
      .select()
      .from(destinations)
      .where(or(like(destinations.name, pattern), like(destinations.country, pattern)))
      .limit(10);

    const formattedPosts = await Promise.all(
      postResults.map((p) => formatPostForFeed(p, req.user!.id)),
    );

    res.json({
      success: true,
      posts: formattedPosts,
      users: userResults.map((u) => ({
        id: u.id,
        username: u.username,
        avatarUrl: getPublicUrl(u.avatarKey),
      })),
      destinations: destResults.map((d) => ({
        id: d.id,
        name: d.name,
        country: d.country,
        description: d.description,
        category: d.category,
        coverUrl: getPublicUrl(d.coverKey),
        lat: d.lat,
        lng: d.lng,
        isFeatured: d.isFeatured,
        createdAt: formatTimestamp(d.createdAt) ?? '',
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /saved — saved posts ─────────────────────────────────────

router.get('/saved', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const savedRows = await db
      .select({ postId: savedPosts.postId })
      .from(savedPosts)
      .where(eq(savedPosts.userId, req.user!.id))
      .orderBy(desc(savedPosts.createdAt));

    if (savedRows.length === 0) {
      return res.json({ success: true, posts: [] });
    }

    const postIds = savedRows.map((r) => r.postId);
    const postRows = await db
      .select()
      .from(posts)
      .where(inArray(posts.id, postIds));

    const formatted = await Promise.all(
      postRows.map((p) => formatPostForFeed(p, req.user!.id)),
    );

    res.json({ success: true, posts: formatted });
  } catch (err) {
    next(err);
  }
});

// ─── GET /bucket-list ─────────────────────────────────────────────

router.get('/bucket-list', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const items = await db
      .select()
      .from(bucketList)
      .where(eq(bucketList.userId, req.user!.id))
      .orderBy(desc(bucketList.createdAt));

    const formatted = items.map((item) => ({
      id: item.id,
      placeName: item.placeName,
      lat: item.lat,
      lng: item.lng,
      country: item.country,
      note: item.note,
      postId: item.postId,
      createdAt: formatTimestamp(item.createdAt) ?? '',
    }));

    res.json({ success: true, items: formatted });
  } catch (err) {
    next(err);
  }
});

// ─── POST /bucket-list ────────────────────────────────────────────

router.post('/bucket-list', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const body = AddBucketListSchema.parse(req.body);

    const [item] = await db
      .insert(bucketList)
      .values({
        userId: req.user!.id,
        placeName: body.placeName,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        country: body.country ?? null,
        note: body.note ?? null,
      })
      .returning();

    res.status(201).json({
      success: true,
      item: {
        id: item.id,
        placeName: item.placeName,
        lat: item.lat,
        lng: item.lng,
        country: item.country,
        note: item.note,
        postId: item.postId,
        createdAt: formatTimestamp(item.createdAt) ?? '',
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /bucket-list/:id ──────────────────────────────────────

router.delete('/bucket-list/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const itemId = param(req, 'id');
    const item = await db.query.bucketList.findFirst({
      where: (t, { eq: e, and: a }) =>
        a(e(t.id, itemId), e(t.userId, req.user!.id)),
    });
    if (!item) throw new AppError('Bucket list item not found', 404);

    await db.delete(bucketList).where(eq(bucketList.id, item.id));
    res.json({ success: true, message: 'Removed from bucket list.' });
  } catch (err) {
    next(err);
  }
});

export default router;
