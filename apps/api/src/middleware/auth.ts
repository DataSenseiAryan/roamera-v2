import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../lib/env';

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
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
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
