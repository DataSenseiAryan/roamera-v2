import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { eq, and, sql, count } from 'drizzle-orm';

import {
  CreatePostSchema,
  UpdatePostSchema,
  ReactionSchema,
  CreateCommentSchema,
} from '@roamera/types';

import { db } from '../db/client';
import {
  posts,
  postPhotos,
  reactions,
  comments,
  savedPosts,
  bucketList,
  users,
} from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { uploadRateLimit } from '../middleware/rate-limit';
import { AppError } from '../middleware/error';
import {
  uploadFile,
  generateStorageKey,
  getPublicUrl,
  deleteFile,
} from '../lib/storage';

const router = Router();
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.memoryStorage(),
});

function param(req: AuthRequest, name: string): string {
  return req.params[name] as string;
}

// ─── Helpers ───────────────────────────────────────────────────────

function formatTimestamp(ts: Date | number | null): string | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts.toISOString();
  return new Date(ts as number).toISOString();
}

async function getPostPhotos(postId: string) {
  const photos = await db
    .select()
    .from(postPhotos)
    .where(eq(postPhotos.postId, postId))
    .orderBy(postPhotos.orderIndex);
  return photos.map((p) => ({
    id: p.id,
    storageKey: p.storageKey,
    url: getPublicUrl(p.storageKey) ?? '',
    orderIndex: p.orderIndex,
    caption: p.caption,
  }));
}

async function getReactionCounts(postId: string) {
  const rows = await db
    .select({ type: reactions.type, cnt: count() })
    .from(reactions)
    .where(eq(reactions.postId, postId))
    .groupBy(reactions.type);

  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.type] = r.cnt;
  return counts;
}

async function formatPostResponse(
  post: typeof posts.$inferSelect,
  viewerId?: string,
) {
  const author = await db.query.users.findFirst({
    where: (t, { eq: e }) => e(t.id, post.userId),
  });

  const photos = await getPostPhotos(post.id);
  const reactionCounts = await getReactionCounts(post.id);

  let viewerReaction: string | null = null;
  let isSaved = false;

  if (viewerId) {
    const reaction = await db.query.reactions.findFirst({
      where: (t, { eq: e, and: a }) =>
        a(e(t.postId, post.id), e(t.userId, viewerId)),
    });
    viewerReaction = reaction?.type ?? null;

    const saved = await db
      .select()
      .from(savedPosts)
      .where(and(eq(savedPosts.userId, viewerId), eq(savedPosts.postId, post.id)))
      .limit(1);
    isSaved = saved.length > 0;
  }

  return {
    id: post.id,
    userId: post.userId,
    title: post.title,
    content: post.content,
    destinations: post.destinations ?? [],
    coverUrl: getPublicUrl(post.coverKey),
    photos,
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
    isSaved,
    viewerReaction,
    reactionCounts,
    author: {
      id: author?.id ?? '',
      username: author?.username ?? '',
      avatarUrl: getPublicUrl(author?.avatarKey ?? null),
    },
    createdAt: formatTimestamp(post.createdAt) ?? new Date().toISOString(),
  };
}

async function assertPostOwner(postId: string, userId: string) {
  const post = await db.query.posts.findFirst({
    where: (t, { eq: e }) => e(t.id, postId),
  });
  if (!post) throw new AppError('Post not found', 404);
  if (post.userId !== userId) throw new AppError('Not authorized', 403);
  return post;
}

async function recountReactions(postId: string) {
  const [result] = await db
    .select({ cnt: count() })
    .from(reactions)
    .where(eq(reactions.postId, postId));
  await db
    .update(posts)
    .set({ likesCount: result?.cnt ?? 0 })
    .where(eq(posts.id, postId));
}

async function recountComments(postId: string) {
  const [result] = await db
    .select({ cnt: count() })
    .from(comments)
    .where(eq(comments.postId, postId));
  await db
    .update(posts)
    .set({ commentsCount: result?.cnt ?? 0 })
    .where(eq(posts.id, postId));
}

// ─── POST / — create post ─────────────────────────────────────────

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const body = CreatePostSchema.parse(req.body);
    const userId = req.user!.id;

    const [post] = await db
      .insert(posts)
      .values({
        userId,
        title: body.title,
        content: body.content ?? null,
        destinations: body.destinations,
        dateFrom: body.dateFrom ? new Date(body.dateFrom) : null,
        dateTo: body.dateTo ? new Date(body.dateTo) : null,
        activities: body.activities,
        accommodation: body.accommodation ?? null,
        budgetInr: body.budgetInr ?? null,
        vacationType: body.vacationType ?? null,
        transportMode: body.transportMode ?? null,
        hashtags: body.hashtags,
        itineraryJson: body.itineraryJson ?? null,
      })
      .returning();

    const formatted = await formatPostResponse(post, userId);
    res.status(201).json({ success: true, post: formatted });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:postId — single post ───────────────────────────────────

router.get('/:postId', async (req: AuthRequest, res, next) => {
  try {
    const post = await db.query.posts.findFirst({
      where: (t, { eq: e }) => e(t.id, param(req, 'postId')),
    });
    if (!post) throw new AppError('Post not found', 404);

    let viewerId: string | undefined;
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const { env } = await import('../lib/env');
        const payload = jwt.default.verify(header.slice(7), env.JWT_SECRET) as {
          sub: string;
        };
        viewerId = payload.sub;
      } catch {
        // public access — no viewer context
      }
    }

    const formatted = await formatPostResponse(post, viewerId);
    res.json({ success: true, post: formatted });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /:postId — update post ─────────────────────────────────

router.patch('/:postId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const post = await assertPostOwner(param(req, 'postId'), req.user!.id);
    const body = UpdatePostSchema.parse(req.body);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.destinations !== undefined) updateData.destinations = body.destinations;
    if (body.dateFrom !== undefined) updateData.dateFrom = body.dateFrom ? new Date(body.dateFrom) : null;
    if (body.dateTo !== undefined) updateData.dateTo = body.dateTo ? new Date(body.dateTo) : null;
    if (body.activities !== undefined) updateData.activities = body.activities;
    if (body.accommodation !== undefined) updateData.accommodation = body.accommodation;
    if (body.budgetInr !== undefined) updateData.budgetInr = body.budgetInr;
    if (body.vacationType !== undefined) updateData.vacationType = body.vacationType;
    if (body.transportMode !== undefined) updateData.transportMode = body.transportMode;
    if (body.hashtags !== undefined) updateData.hashtags = body.hashtags;
    if (body.itineraryJson !== undefined) updateData.itineraryJson = body.itineraryJson;

    await db.update(posts).set(updateData).where(eq(posts.id, post.id));

    const updated = await db.query.posts.findFirst({
      where: (t, { eq: e }) => e(t.id, post.id),
    });
    const formatted = await formatPostResponse(updated!, req.user!.id);
    res.json({ success: true, post: formatted });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:postId — delete post ────────────────────────────────

router.delete('/:postId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await assertPostOwner(param(req, 'postId'), req.user!.id);

    const photos = await db
      .select()
      .from(postPhotos)
      .where(eq(postPhotos.postId, param(req, 'postId')));
    for (const photo of photos) {
      await deleteFile(photo.storageKey);
    }

    await db.delete(posts).where(eq(posts.id, param(req, 'postId')));
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /:postId/photos — upload photos ─────────────────────────

router.post(
  '/:postId/photos',
  authenticate,
  uploadRateLimit,
  upload.array('photos', 5),
  async (req: AuthRequest, res, next) => {
    try {
      const post = await assertPostOwner(param(req, 'postId'), req.user!.id);
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) throw new AppError('No photos uploaded', 400);

      const existingPhotos = await db
        .select()
        .from(postPhotos)
        .where(eq(postPhotos.postId, post.id));
      if (existingPhotos.length + files.length > 5) {
        throw new AppError('Maximum 5 photos per post', 400);
      }

      let firstKey: string | null = null;
      for (let i = 0; i < files.length; i++) {
        const buffer = await sharp(files[i].buffer)
          .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const key = generateStorageKey(buffer, '.webp');
        await uploadFile(buffer, key, 'image/webp');

        await db.insert(postPhotos).values({
          postId: post.id,
          storageKey: key,
          orderIndex: existingPhotos.length + i,
        });

        if (i === 0 && !post.coverKey) firstKey = key;
      }

      if (firstKey) {
        await db.update(posts).set({ coverKey: firstKey }).where(eq(posts.id, post.id));
      }

      const updated = await db.query.posts.findFirst({
        where: (t, { eq: e }) => e(t.id, post.id),
      });
      const formatted = await formatPostResponse(updated!, req.user!.id);
      res.status(201).json({ success: true, post: formatted });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /:postId/photos/:photoId ──────────────────────────────

router.delete(
  '/:postId/photos/:photoId',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      await assertPostOwner(param(req, 'postId'), req.user!.id);

      const photo = await db.query.postPhotos.findFirst({
        where: (t, { eq: e, and: a }) =>
          a(e(t.id, param(req, 'photoId')), e(t.postId, param(req, 'postId'))),
      });
      if (!photo) throw new AppError('Photo not found', 404);

      await deleteFile(photo.storageKey);
      await db.delete(postPhotos).where(eq(postPhotos.id, photo.id));

      const post = await db.query.posts.findFirst({
        where: (t, { eq: e }) => e(t.id, param(req, 'postId')),
      });
      if (post?.coverKey === photo.storageKey) {
        const remaining = await db
          .select()
          .from(postPhotos)
          .where(eq(postPhotos.postId, param(req, 'postId')))
          .orderBy(postPhotos.orderIndex)
          .limit(1);
        await db
          .update(posts)
          .set({ coverKey: remaining[0]?.storageKey ?? null })
          .where(eq(posts.id, param(req, 'postId')));
      }

      res.json({ success: true, message: 'Photo deleted.' });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /:postId/reactions — react ──────────────────────────────

router.post('/:postId/reactions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { type } = ReactionSchema.parse(req.body);
    const userId = req.user!.id;
    const postId = param(req, 'postId');

    const post = await db.query.posts.findFirst({
      where: (t, { eq: e }) => e(t.id, postId),
    });
    if (!post) throw new AppError('Post not found', 404);

    const existing = await db.query.reactions.findFirst({
      where: (t, { eq: e, and: a }) => a(e(t.postId, postId), e(t.userId, userId)),
    });

    let action: 'added' | 'changed' | 'removed';

    if (existing && existing.type === type) {
      await db.delete(reactions).where(eq(reactions.id, existing.id));
      action = 'removed';
    } else if (existing) {
      await db
        .update(reactions)
        .set({ type })
        .where(eq(reactions.id, existing.id));
      action = 'changed';
    } else {
      await db.insert(reactions).values({ postId, userId, type });
      action = 'added';

      if (type === 'wanna_go') {
        const dest = (post.destinations as Array<{ name: string; lat?: string; lng?: string; country?: string }>)?.[0];
        if (dest) {
          await db.insert(bucketList).values({
            userId,
            placeName: dest.name,
            lat: dest.lat ?? null,
            lng: dest.lng ?? null,
            country: dest.country ?? null,
            postId,
          }).onConflictDoNothing();
        }
      }
    }

    await recountReactions(postId);

    const reactionCounts = await getReactionCounts(postId);
    const viewerReaction = action === 'removed' ? null : type;

    res.json({
      success: true,
      action,
      viewerReaction,
      reactionCounts,
      addedToBucketList: action === 'added' && type === 'wanna_go',
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:postId/reactions — remove reaction ──────────────────

router.delete('/:postId/reactions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const postId = param(req, 'postId');

    await db
      .delete(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId)));

    await recountReactions(postId);

    res.json({ success: true, message: 'Reaction removed.' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:postId/reactions — reaction counts ─────────────────────

router.get('/:postId/reactions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const postId = param(req, 'postId');
    const reactionCounts = await getReactionCounts(postId);

    const viewer = await db.query.reactions.findFirst({
      where: (t, { eq: e, and: a }) =>
        a(e(t.postId, postId), e(t.userId, req.user!.id)),
    });

    res.json({
      success: true,
      reactionCounts,
      viewerReaction: viewer?.type ?? null,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:postId/comments — paginated ────────────────────────────

router.get('/:postId/comments', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const postId = param(req, 'postId');
    const limitParam = Math.min(parseInt(req.query.limit as string) || 30, 50);
    const cursor = req.query.cursor as string | undefined;

    let query = db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt)
      .limit(limitParam + 1);

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
        query = db
          .select()
          .from(comments)
          .where(
            and(
              eq(comments.postId, postId),
              sql`(${comments.createdAt} > ${decoded.createdAt} OR (${comments.createdAt} = ${decoded.createdAt} AND ${comments.id} > ${decoded.id}))`,
            ),
          )
          .orderBy(comments.createdAt)
          .limit(limitParam + 1);
      } catch {
        // invalid cursor, ignore
      }
    }

    const rows = await query;
    const hasMore = rows.length > limitParam;
    if (hasMore) rows.pop();

    const formatted = await Promise.all(
      rows.map(async (c) => {
        const author = await db.query.users.findFirst({
          where: (t, { eq: e }) => e(t.id, c.userId),
        });
        return {
          id: c.id,
          postId: c.postId,
          userId: c.userId,
          parentId: c.parentId,
          content: c.content,
          author: {
            id: author?.id ?? '',
            username: author?.username ?? '',
            avatarUrl: getPublicUrl(author?.avatarKey ?? null),
          },
          createdAt: formatTimestamp(c.createdAt) ?? new Date().toISOString(),
        };
      }),
    );

    const nextCursor = hasMore && rows.length > 0
      ? Buffer.from(JSON.stringify({
          createdAt: rows[rows.length - 1].createdAt instanceof Date
            ? Math.floor((rows[rows.length - 1].createdAt as Date).getTime() / 1000)
            : rows[rows.length - 1].createdAt,
          id: rows[rows.length - 1].id,
        })).toString('base64')
      : null;

    res.json({ success: true, comments: formatted, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
});

// ─── POST /:postId/comments — add comment ─────────────────────────

router.post('/:postId/comments', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { content, parentId } = CreateCommentSchema.parse(req.body);
    const postId = param(req, 'postId');
    const userId = req.user!.id;

    const post = await db.query.posts.findFirst({
      where: (t, { eq: e }) => e(t.id, postId),
    });
    if (!post) throw new AppError('Post not found', 404);

    if (parentId) {
      const parent = await db.query.comments.findFirst({
        where: (t, { eq: e, and: a }) => a(e(t.id, parentId), e(t.postId, postId)),
      });
      if (!parent) throw new AppError('Parent comment not found', 404);
    }

    const [comment] = await db
      .insert(comments)
      .values({ postId, userId, parentId: parentId ?? null, content })
      .returning();

    await recountComments(postId);

    const author = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.id, userId),
    });

    res.status(201).json({
      success: true,
      comment: {
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        parentId: comment.parentId,
        content: comment.content,
        author: {
          id: author?.id ?? '',
          username: author?.username ?? '',
          avatarUrl: getPublicUrl(author?.avatarKey ?? null),
        },
        createdAt: formatTimestamp(comment.createdAt) ?? new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /:postId/comments/:commentId ───────────────────────────

router.patch(
  '/:postId/comments/:commentId',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { content } = CreateCommentSchema.pick({ content: true }).parse(req.body);

      const comment = await db.query.comments.findFirst({
        where: (t, { eq: e, and: a }) =>
          a(e(t.id, param(req, 'commentId')), e(t.postId, param(req, 'postId'))),
      });
      if (!comment) throw new AppError('Comment not found', 404);
      if (comment.userId !== req.user!.id) throw new AppError('Not authorized', 403);

      await db
        .update(comments)
        .set({ content })
        .where(eq(comments.id, comment.id));

      const updated = await db.query.comments.findFirst({
        where: (t, { eq: e }) => e(t.id, comment.id),
      });
      const author = await db.query.users.findFirst({
        where: (t, { eq: e }) => e(t.id, req.user!.id),
      });

      res.json({
        success: true,
        comment: {
          id: updated!.id,
          postId: updated!.postId,
          userId: updated!.userId,
          parentId: updated!.parentId,
          content: updated!.content,
          author: {
            id: author?.id ?? '',
            username: author?.username ?? '',
            avatarUrl: getPublicUrl(author?.avatarKey ?? null),
          },
          createdAt: formatTimestamp(updated!.createdAt) ?? new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /:postId/comments/:commentId ──────────────────────────

router.delete(
  '/:postId/comments/:commentId',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const comment = await db.query.comments.findFirst({
        where: (t, { eq: e, and: a }) =>
          a(e(t.id, param(req, 'commentId')), e(t.postId, param(req, 'postId'))),
      });
      if (!comment) throw new AppError('Comment not found', 404);
      if (comment.userId !== req.user!.id) throw new AppError('Not authorized', 403);

      await db.delete(comments).where(eq(comments.id, comment.id));
      await recountComments(param(req, 'postId'));

      res.json({ success: true, message: 'Comment deleted.' });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /:postId/save — save post ──────────────────────────────

router.post('/:postId/save', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const postId = param(req, 'postId');
    const userId = req.user!.id;

    const post = await db.query.posts.findFirst({
      where: (t, { eq: e }) => e(t.id, postId),
    });
    if (!post) throw new AppError('Post not found', 404);

    await db
      .insert(savedPosts)
      .values({ userId, postId })
      .onConflictDoNothing();

    res.json({ success: true, message: 'Post saved.' });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:postId/save — unsave post ───────────────────────────

router.delete('/:postId/save', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await db
      .delete(savedPosts)
      .where(
        and(
          eq(savedPosts.userId, req.user!.id),
          eq(savedPosts.postId, param(req, 'postId')),
        ),
      );
    res.json({ success: true, message: 'Post unsaved.' });
  } catch (err) {
    next(err);
  }
});

export default router;
