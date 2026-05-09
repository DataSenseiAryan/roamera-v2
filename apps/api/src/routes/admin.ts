import { Router } from 'express';
import { and, asc, count, desc, eq, gte, like, lte, or, sql } from 'drizzle-orm';
import crypto from 'crypto';

import { db } from '../db/client';
import {
  users,
  posts,
  trips,
  circles,
  auditLog,
  systemNotices,
  userNoticeDismissals,
} from '../db/schema';
import { authenticate, requireAdmin, type AuthRequest } from '../middleware/auth';
import { getWsManager } from '../lib/ws';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ─── GET /stats ────────────────────────────────────────────────────────────

router.get('/stats', async (_req, res, next) => {
  try {
    const [[usersRow], [postsRow], [tripsRow], [circlesRow]] = await Promise.all([
      db.select({ c: count() }).from(users),
      db.select({ c: count() }).from(posts),
      db.select({ c: count() }).from(trips),
      db.select({ c: count() }).from(circles),
    ]);

    // DAU: users who logged in within last 24h (approximated by recent sessions)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [dauRow] = await db
      .select({ c: count() })
      .from(users)
      .where(gte(users.updatedAt, oneDayAgo));

    res.json({
      users: usersRow?.c ?? 0,
      posts: postsRow?.c ?? 0,
      trips: tripsRow?.c ?? 0,
      circles: circlesRow?.c ?? 0,
      dau: dauRow?.c ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /users ────────────────────────────────────────────────────────────

router.get('/users', async (req: AuthRequest, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const q = (req.query.q as string) ?? '';
    const role = req.query.role as string | undefined;
    const suspended = req.query.suspended as string | undefined;

    const offset = (page - 1) * limit;

    // Build where clause
    const conditions: ReturnType<typeof eq>[] = [];
    if (q) {
      conditions.push(
        or(
          like(users.username, `%${q}%`),
          like(users.email, `%${q}%`),
        ) as unknown as ReturnType<typeof eq>,
      );
    }
    if (role) conditions.push(eq(users.role, role as 'user' | 'admin' | 'deleted') as unknown as ReturnType<typeof eq>);
    if (suspended !== undefined) {
      conditions.push(eq(users.isSuspended, suspended === 'true') as unknown as ReturnType<typeof eq>);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          isSuspended: users.isSuspended,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ c: count() }).from(users).where(where),
    ]);

    res.json({
      users: rows,
      total: totalRow?.c ?? 0,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /users/:id ────────────────────────────────────────────────────────

router.get('/users/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const [[postCount], [tripCount]] = await Promise.all([
      db.select({ c: count() }).from(posts).where(eq(posts.userId, id)),
      db.select({ c: count() }).from(trips).where(eq(trips.ownerId, id)),
    ]);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSuspended: user.isSuspended,
        emailVerified: user.emailVerified,
        bio: user.bio,
        createdAt: user.createdAt,
        stats: { posts: postCount?.c ?? 0, trips: tripCount?.c ?? 0 },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /users/:id ──────────────────────────────────────────────────────

router.patch('/users/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const { role, isSuspended } = req.body as { role?: string; isSuspended?: boolean };

    const updates: Partial<typeof users.$inferInsert> = {};
    if (role !== undefined) updates.role = role as 'user' | 'admin' | 'deleted';
    if (isSuspended !== undefined) updates.isSuspended = isSuspended;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ success: false, error: 'No fields to update' });
      return;
    }

    await db.update(users).set(updates).where(eq(users.id, id));

    // Log admin action
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      action: 'admin.update_user',
      userId: req.user!.id,
      resourceType: 'user',
      resourceId: id,
      details: JSON.stringify(updates),
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /users/:id ─────────────────────────────────────────────────────

router.delete('/users/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;

    // Soft-delete by setting role to 'deleted'
    await db.update(users).set({ role: 'deleted', isSuspended: true }).where(eq(users.id, id));

    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      action: 'admin.delete_user',
      userId: req.user!.id,
      resourceType: 'user',
      resourceId: id,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── GET /audit-log ────────────────────────────────────────────────────────

router.get('/audit-log', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const userId = req.query.userId as string | undefined;
    const action = req.query.action as string | undefined;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;

    const conditions: ReturnType<typeof eq>[] = [];
    if (userId) conditions.push(eq(auditLog.userId, userId) as unknown as ReturnType<typeof eq>);
    if (action) conditions.push(like(auditLog.action, `%${action}%`) as unknown as ReturnType<typeof eq>);
    if (from) conditions.push(gte(auditLog.createdAt, from) as unknown as ReturnType<typeof eq>);
    if (to) conditions.push(lte(auditLog.createdAt, to) as unknown as ReturnType<typeof eq>);

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [totalRow]] = await Promise.all([
      db.select().from(auditLog).where(where).orderBy(desc(auditLog.createdAt)).limit(limit).offset(offset),
      db.select({ c: count() }).from(auditLog).where(where),
    ]);

    res.json({ entries: rows, total: totalRow?.c ?? 0, page, limit });
  } catch (err) {
    next(err);
  }
});

// ─── GET /notices ──────────────────────────────────────────────────────────

router.get('/notices', async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const rows = await db
      .select()
      .from(systemNotices)
      .where(activeOnly ? eq(systemNotices.isActive, true) : undefined)
      .orderBy(desc(systemNotices.createdAt));

    res.json({ notices: rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /notices (public — active only) — also mounted publicly in index ──

export async function getActiveNotices(_req: unknown, res: { json: (d: unknown) => void }, next: (e?: unknown) => void): Promise<void> {
  try {
    const rows = await db
      .select()
      .from(systemNotices)
      .where(eq(systemNotices.isActive, true))
      .orderBy(desc(systemNotices.createdAt));
    res.json({ notices: rows });
  } catch (err) {
    next(err);
  }
}

// ─── POST /notices ─────────────────────────────────────────────────────────

router.post('/notices', async (req: AuthRequest, res, next) => {
  try {
    const { title, body, type } = req.body as { title: string; body?: string; type?: string };
    if (!title) {
      res.status(400).json({ success: false, error: 'title is required' });
      return;
    }

    const [notice] = await db
      .insert(systemNotices)
      .values({
        id: crypto.randomUUID(),
        title,
        body: body ?? null,
        type: type ?? 'info',
        isActive: true,
        createdBy: req.user!.id,
      })
      .returning();

    // Broadcast system notice to all connected users
    try {
      getWsManager().broadcast('system', 'system:notice', notice);
    } catch { /* WS not ready */ }

    res.status(201).json({ success: true, notice });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /notices/:id ────────────────────────────────────────────────────

router.patch('/notices/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { title, body, type, isActive } = req.body as {
      title?: string;
      body?: string;
      type?: string;
      isActive?: boolean;
    };

    const updates: Partial<typeof systemNotices.$inferInsert> = {};
    if (title !== undefined) updates.title = title;
    if (body !== undefined) updates.body = body;
    if (type !== undefined) updates.type = type;
    if (isActive !== undefined) updates.isActive = isActive;

    await db.update(systemNotices).set(updates).where(eq(systemNotices.id, id));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /notices/:id ───────────────────────────────────────────────────

router.delete('/notices/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await db.delete(systemNotices).where(eq(systemNotices.id, id));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
