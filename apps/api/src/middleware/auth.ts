import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

import { env } from '../lib/env';
import { db } from '../db/client';
import { users } from '../db/schema';

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.slice(7);
  let payload: { sub: string; role: string };
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }

  // Set user immediately from JWT (role is embedded)
  req.user = { id: payload.sub, role: payload.role };

  // Check suspension (async, but we await before calling next)
  db.select({ isSuspended: users.isSuspended })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1)
    .then(([row]) => {
      if (row?.isSuspended) {
        res.status(403).json({ success: false, error: 'Account suspended. Contact support.' });
        return;
      }
      next();
    })
    .catch(() => next()); // on DB error, let through
}

export function optionalAuthenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // ignore — optional auth, proceed as anonymous
    }
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
}
