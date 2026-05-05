import crypto from 'crypto';

import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';

import { db } from '../db/client';
import { idempotencyKeys } from '../db/schema';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function idempotencyMiddleware(
  req: Request & { user?: { id: string } },
  res: Response,
  next: NextFunction,
): Promise<void> {
  const key = req.headers['idempotency-key'] as string | undefined;
  if (!key || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  const userId = req.user?.id ?? 'anonymous';

  try {
    const existing = await db.query.idempotencyKeys.findFirst({
      where: (t, { eq: eqFn, and }) =>
        and(eqFn(t.key, key), eqFn(t.userId, userId)),
    });

    if (existing?.responseBody) {
      res.status(existing.responseStatus ?? 200).json(JSON.parse(existing.responseBody));
      return;
    }

    const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS);
    const id = crypto.randomUUID();

    await db.insert(idempotencyKeys).values({
      id,
      key,
      userId,
      method: req.method,
      path: req.path,
      expiresAt,
    });

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const result = originalJson(body);
      void db
        .update(idempotencyKeys)
        .set({ responseStatus: res.statusCode, responseBody: JSON.stringify(body) })
        .where(eq(idempotencyKeys.id, id))
        .catch(() => {});
      return result;
    };

    next();
  } catch {
    next();
  }
}
