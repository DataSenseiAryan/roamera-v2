import { Router } from 'express';
import { randomBytes } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { pushTokens } from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// Register Expo push token for authenticated user
router.post('/register', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { token, platform } = req.body as { token?: string; platform?: string };
    if (!token) throw new AppError('token is required', 400);

    const userId = req.user!.id;
    const validPlatforms = ['ios', 'android', 'web'];
    const normalizedPlatform = validPlatforms.includes(platform ?? '') ? platform! : 'unknown';

    // Upsert: ignore if already exists
    const [existing] = await db.select().from(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));

    if (existing) {
      return res.json({ success: true, id: existing.id, message: 'Already registered' });
    }

    const [row] = await db.insert(pushTokens).values({
      id: randomBytes(8).toString('hex'),
      userId,
      token,
      platform: normalizedPlatform,
    }).returning();

    res.status(201).json({ success: true, id: row.id });
  } catch (err) { next(err); }
});

// Unregister push token
router.delete('/unregister', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { token } = req.body as { token?: string };
    if (!token) throw new AppError('token is required', 400);

    await db.delete(pushTokens)
      .where(and(eq(pushTokens.userId, req.user!.id), eq(pushTokens.token, token)));

    res.status(204).end();
  } catch (err) { next(err); }
});

// List push tokens for current user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const rows = await db.select({
      id: pushTokens.id,
      platform: pushTokens.platform,
      createdAt: pushTokens.createdAt,
    }).from(pushTokens).where(eq(pushTokens.userId, req.user!.id));

    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
