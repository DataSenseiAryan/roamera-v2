import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { eq, and, like, or, sql, desc, count } from 'drizzle-orm';

import { UpdateProfileSchema, UserSearchParamsSchema } from '@roamera/types';

import { db } from '../db/client';
import { users, follows, posts, postPhotos, reactions, savedPosts, userSettings } from '../db/schema';
import { authenticate, optionalAuthenticate, type AuthRequest } from '../middleware/auth';
import { uploadRateLimit } from '../middleware/rate-limit';
import { AppError } from '../middleware/error';
import { uploadFile, generateStorageKey, getPublicUrl } from '../lib/storage';
import { createNotification } from '../lib/notifications';

function formatTimestamp(ts: Date | number | null): string | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts.toISOString();
  return new Date(ts as number).toISOString();
}

const router = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 }, storage: multer.memoryStorage() });

function formatUserResponse(user: typeof users.$inferSelect, extra?: {
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    homeCity: user.homeCity,
    avatarUrl: getPublicUrl(user.avatarKey),
    budgetBand: user.budgetBand,
    interests: user.interests,
    role: user.role,
    emailVerified: user.emailVerified,
    followersCount: extra?.followersCount ?? 0,
    followingCount: extra?.followingCount ?? 0,
    postsCount: extra?.postsCount ?? 0,
    isFollowing: extra?.isFollowing,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date(user.createdAt as unknown as number).toISOString(),
  };
}

async function getUserCounts(userId: string) {
  const followersRows = await db.select().from(follows).where(eq(follows.followingId, userId));
  const followingRows = await db.select().from(follows).where(eq(follows.followerId, userId));
  const postsRows = await db.select().from(posts).where(eq(posts.userId, userId));
  return {
    followersCount: followersRows.length,
    followingCount: followingRows.length,
    postsCount: postsRows.length,
  };
}

// GET /search — must be before /:username to avoid conflict
router.get('/search', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const params = UserSearchParamsSchema.parse(req.query);
    const pattern = `%${params.q}%`;

    const results = await db.select()
      .from(users)
      .where(or(
        like(users.username, pattern),
        like(users.bio, pattern),
      ))
      .limit(params.limit);

    const formatted = await Promise.all(results.map(async (u) => {
      const counts = await getUserCounts(u.id);
      return formatUserResponse(u, counts);
    }));

    res.json({ success: true, users: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /me/settings
router.get('/me/settings', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const settings = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, req.user!.id));

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    res.json({ success: true, settings: result });
  } catch (err) {
    next(err);
  }
});

// PUT /me/settings
router.put('/me/settings', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as Record<string, string>;
    const userId = req.user!.id;

    for (const [key, value] of Object.entries(body)) {
      if (typeof key !== 'string' || typeof value !== 'string') continue;
      await db.insert(userSettings)
        .values({ userId, key, value })
        .onConflictDoUpdate({
          target: [userSettings.userId, userSettings.key],
          set: { value, updatedAt: new Date() },
        });
    }

    res.json({ success: true, message: 'Settings updated.' });
  } catch (err) {
    next(err);
  }
});

// PATCH /me
router.patch('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const body = UpdateProfileSchema.parse(req.body);
    const userId = req.user!.id;

    if (body.username) {
      const existing = await db.query.users.findFirst({
        where: (t, { eq: e, and: a, not }) =>
          a(e(t.username, body.username!), sql`${t.id} != ${userId}`),
      });
      if (existing) throw new AppError('Username already taken', 409);
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.username !== undefined) updateData.username = body.username;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.homeCity !== undefined) updateData.homeCity = body.homeCity;
    if (body.budgetBand !== undefined) updateData.budgetBand = body.budgetBand;
    if (body.interests !== undefined) updateData.interests = body.interests;

    await db.update(users).set(updateData).where(eq(users.id, userId));

    const user = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.id, userId),
    });
    if (!user) throw new AppError('User not found', 404);

    const counts = await getUserCounts(userId);
    res.json({ success: true, user: formatUserResponse(user, counts) });
  } catch (err) {
    next(err);
  }
});

// POST /me/avatar
router.post('/me/avatar', authenticate, uploadRateLimit, upload.single('avatar'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);

    const buffer = await sharp(req.file.buffer)
      .resize(256, 256, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const key = generateStorageKey(buffer, '.webp');
    await uploadFile(buffer, key, 'image/webp');

    await db.update(users)
      .set({ avatarKey: key, updatedAt: new Date() })
      .where(eq(users.id, req.user!.id));

    const user = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.id, req.user!.id),
    });

    const counts = await getUserCounts(req.user!.id);
    res.json({ success: true, user: formatUserResponse(user!, counts) });
  } catch (err) {
    next(err);
  }
});

// DELETE /me
router.delete('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // Soft delete: mark role as 'deleted' and anonymize PII
    await db.update(users)
      .set({
        role: 'deleted',
        email: `deleted_${Date.now()}_${req.user!.id}@deleted.roamera.in`,
        username: `deleted_${Date.now().toString(36)}`,
        passwordHash: null,
        bio: null,
        avatarKey: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.id));

    // Invalidate all sessions
    const { sessions } = await import('../db/schema');
    await db.delete(sessions).where(eq(sessions.userId, req.user!.id));

    res.json({ success: true, message: 'Account deleted. You have 30 days to contact support to restore.' });
  } catch (err) {
    next(err);
  }
});

// GET /:userId/followers
router.get('/:userId/followers', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.userId as string;

    const followerRows = await db.select()
      .from(follows)
      .where(eq(follows.followingId, userId))
      .limit(50);

    const followerUsers = await Promise.all(followerRows.map(async (f) => {
      const user = await db.query.users.findFirst({
        where: (t, { eq: e }) => e(t.id, f.followerId),
      });
      if (!user) return null;
      const counts = await getUserCounts(user.id);
      return formatUserResponse(user, counts);
    }));

    res.json({ success: true, users: followerUsers.filter(Boolean) });
  } catch (err) {
    next(err);
  }
});

// GET /:userId/following
router.get('/:userId/following', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.userId as string;

    const followingRows = await db.select()
      .from(follows)
      .where(eq(follows.followerId, userId))
      .limit(50);

    const followingUsers = await Promise.all(followingRows.map(async (f) => {
      const user = await db.query.users.findFirst({
        where: (t, { eq: e }) => e(t.id, f.followingId),
      });
      if (!user) return null;
      const counts = await getUserCounts(user.id);
      return formatUserResponse(user, counts);
    }));

    res.json({ success: true, users: followingUsers.filter(Boolean) });
  } catch (err) {
    next(err);
  }
});

// POST /:userId/follow
router.post('/:userId/follow', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.userId as string;
    const followerId = req.user!.id;

    if (userId === followerId) throw new AppError('Cannot follow yourself', 400);

    const target = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.id, userId),
    });
    if (!target) throw new AppError('User not found', 404);

    await db.insert(follows)
      .values({ followerId, followingId: userId })
      .onConflictDoNothing();

    // Notify the followed user
    const [actor] = await db.select({ username: users.username }).from(users).where(eq(users.id, followerId)).limit(1);
    createNotification({
      userId,
      actorId: followerId,
      type: 'follow',
      title: `${actor?.username ?? 'Someone'} started following you`,
      resourceType: 'user',
      resourceId: followerId,
    }).catch(() => {});

    res.json({ success: true, message: 'Followed successfully.' });
  } catch (err) {
    next(err);
  }
});

// DELETE /:userId/follow
router.delete('/:userId/follow', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.userId as string;
    const followerId = req.user!.id;

    await db.delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, userId)));

    res.json({ success: true, message: 'Unfollowed successfully.' });
  } catch (err) {
    next(err);
  }
});

// GET /:userId/posts — paginated posts by a user
router.get('/:userId/posts', optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.params.userId as string;
    const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 50);
    const cursor = req.query.cursor as string | undefined;
    const viewerId = req.user?.id ?? '';

    const user = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.id, userId),
    });
    if (!user) throw new AppError('User not found', 404);

    let cursorCondition;
    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString()) as { createdAt: number; id: string };
        cursorCondition = sql`(${posts.createdAt}, ${posts.id}) < (${decoded.createdAt}, ${decoded.id})`;
      } catch {
        cursorCondition = undefined;
      }
    }

    const userPosts = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.userId, userId),
          eq(posts.isPublished, true),
          cursorCondition,
        ),
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit + 1);

    const hasMore = userPosts.length > limit;
    const items = hasMore ? userPosts.slice(0, limit) : userPosts;

    const formatted = await Promise.all(
      items.map(async (post) => {
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

        const viewerReaction = viewerId
          ? await db.query.reactions.findFirst({
              where: (t, { eq: e, and: a }) =>
                a(e(t.postId, post.id), e(t.userId, viewerId)),
            })
          : null;

        const saved = viewerId
          ? await db
              .select()
              .from(savedPosts)
              .where(and(eq(savedPosts.userId, viewerId), eq(savedPosts.postId, post.id)))
              .limit(1)
          : [];

        return {
          id: post.id,
          userId: post.userId,
          title: post.title,
          content: post.content,
          destinations: post.destinations ?? [],
          coverUrl: getPublicUrl(post.coverKey),
          photos: photos.map((p) => ({
            id: p.id,
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
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          isSaved: saved.length > 0,
          viewerReaction: viewerReaction?.type ?? null,
          reactionCounts,
          author: {
            id: user.id,
            username: user.username,
            displayName: user.username,
            avatarUrl: getPublicUrl(user.avatarKey),
          },
          createdAt: formatTimestamp(post.createdAt) ?? '',
          updatedAt: formatTimestamp(post.updatedAt) ?? '',
        };
      }),
    );

    const lastItem = items[items.length - 1];
    const nextCursor = hasMore && lastItem
      ? Buffer.from(JSON.stringify({
          createdAt: lastItem.createdAt instanceof Date
            ? Math.floor(lastItem.createdAt.getTime() / 1000)
            : lastItem.createdAt,
          id: lastItem.id,
        })).toString('base64')
      : null;

    res.json({ success: true, posts: formatted, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
});

// GET /:username — profile by username (optionally authenticated for isFollowing context)
router.get('/:username', optionalAuthenticate, async (req: AuthRequest, res, next) => {
  try {
    const username = req.params.username as string;

    const user = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.username, username),
    });
    if (!user) throw new AppError('User not found', 404);

    const counts = await getUserCounts(user.id);

    let isFollowing = false;
    if (req.user && req.user.id !== user.id) {
      const follow = await db.query.follows.findFirst({
        where: (t, { eq: e, and: a }) =>
          a(e(t.followerId, req.user!.id), e(t.followingId, user.id)),
      });
      isFollowing = !!follow;
    }

    res.json({ success: true, user: formatUserResponse(user, { ...counts, isFollowing }) });
  } catch (err) {
    next(err);
  }
});

export default router;
