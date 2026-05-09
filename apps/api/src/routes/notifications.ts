import { Router } from 'express';
import { and, asc, desc, eq, isNull, lt } from 'drizzle-orm';

import { db } from '../db/client';
import { notifications, notificationPrefs } from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { getWsManager } from '../lib/ws';

const router = Router();

const NOTIFICATION_TYPES = [
  'follow',
  'comment',
  'reaction',
  'trip_invite',
  'trip_update',
  'circle_invite',
  'journey_contributor',
  'system',
] as const;

function serializeNotification(n: typeof notifications.$inferSelect) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.dataJson,
    actorId: n.actorId,
    resourceType: n.resourceType,
    resourceId: n.resourceId,
    readAt: n.readAt ? new Date(n.readAt).toISOString() : null,
    createdAt: new Date(n.createdAt as unknown as number * 1000).toISOString(),
  };
}

// GET / — paginated notification feed
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor ? new Date(req.query.cursor as string) : null;

    let q = db
      .select()
      .from(notifications)
      .where(
        cursor
          ? and(eq(notifications.userId, userId), lt(notifications.createdAt, cursor))
          : eq(notifications.userId, userId),
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1);

    const rows = await q;
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);

    res.json({
      notifications: items.map(serializeNotification),
      hasMore,
      nextCursor: hasMore ? items[items.length - 1].createdAt : null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /unread-count
router.get('/unread-count', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const rows = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    res.json({ count: rows.length });
  } catch (err) {
    next(err);
  }
});

// GET /preferences
router.get('/preferences', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const prefs = await db
      .select()
      .from(notificationPrefs)
      .where(eq(notificationPrefs.userId, userId));

    // Return defaults for types with no explicit preference
    const prefMap = new Map(prefs.map((p) => [p.eventType, p]));
    const result = NOTIFICATION_TYPES.map((type) => {
      const p = prefMap.get(type);
      return { eventType: type, inApp: p?.inApp ?? true, email: p?.email ?? true, push: p?.push ?? false };
    });

    res.json({ preferences: result });
  } catch (err) {
    next(err);
  }
});

// PATCH /preferences
router.patch('/preferences', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const updates = req.body as Array<{ eventType: string; inApp?: boolean; email?: boolean; push?: boolean }>;
    if (!Array.isArray(updates)) {
      res.status(400).json({ success: false, error: 'Body must be an array of preference updates' });
      return;
    }

    for (const update of updates) {
      await db
        .insert(notificationPrefs)
        .values({
          userId,
          eventType: update.eventType,
          inApp: update.inApp ?? true,
          email: update.email ?? true,
          push: update.push ?? false,
        })
        .onConflictDoUpdate({
          target: [notificationPrefs.userId, notificationPrefs.eventType],
          set: {
            inApp: update.inApp ?? true,
            email: update.email ?? true,
            push: update.push ?? false,
          },
        });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /:id/read — mark single as read
router.post('/:id/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /read-all — mark all as read
router.post('/read-all', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    // Broadcast updated unread count
    try {
      getWsManager().broadcast(`user:${userId}`, 'notification:updated', { unreadCount: 0 });
    } catch { /* WS not ready */ }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /:id/respond — accept/decline interactive notification
router.post('/:id/respond', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { action } = req.body as { action: 'accept' | 'decline' };

    if (!['accept', 'decline'].includes(action)) {
      res.status(400).json({ success: false, error: 'action must be accept or decline' });
      return;
    }

    const [notif] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);

    if (!notif) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    // Mark as read after responding
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, id));

    res.json({
      success: true,
      action,
      notificationType: notif.type,
      resourceId: notif.resourceId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
