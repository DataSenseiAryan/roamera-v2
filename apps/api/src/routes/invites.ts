import crypto from 'crypto';

import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { inviteTokens } from '../db/schema';
import { authenticate, requireAdmin, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { env } from '../lib/env';

const router = Router();

// POST /api/v1/invites — admin creates invite token
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { maxUses, expiresInDays = 7 } = req.body;
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));

    await db.insert(inviteTokens).values({
      token,
      createdBy: req.user!.id,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt,
    });

    const inviteUrl = `${env.API_BASE_URL ?? 'http://localhost:3001'}/register?invite=${token}`;
    res.status(201).json({ token, inviteUrl, expiresAt: expiresAt.toISOString(), maxUses: maxUses ?? null });
  } catch (err) { next(err); }
});

// GET /api/v1/invites — admin list all tokens
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const rows = await db.select().from(inviteTokens).orderBy(inviteTokens.createdAt);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/v1/invites/:token — public; validate a token
router.get('/:token', async (req, res, next) => {
  try {
    const token = String(req.params.token);
    const [row] = await db.select().from(inviteTokens).where(eq(inviteTokens.token, token));
    if (!row) throw new AppError('Invalid invite token', 404);

    const now = new Date();
    if (row.expiresAt && row.expiresAt < now) throw new AppError('Invite token expired', 410);
    if (row.maxUses !== null && row.uses >= row.maxUses) throw new AppError('Invite token exhausted', 410);

    res.json({ valid: true, expiresAt: row.expiresAt?.toISOString() ?? null, usesRemaining: row.maxUses !== null ? row.maxUses - row.uses : null });
  } catch (err) { next(err); }
});

// DELETE /api/v1/invites/:token — admin revoke
router.delete('/:token', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    await db.delete(inviteTokens).where(eq(inviteTokens.token, String(req.params.token)));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
