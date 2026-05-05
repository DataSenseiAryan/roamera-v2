import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { env } from './env';

export function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
}

export function signRefreshToken(): string {
  return crypto.randomUUID();
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function generateVerificationToken(): string {
  return crypto.randomUUID();
}

export function getRefreshTokenExpiry(): Date {
  const ms = parseDuration(env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + ms);
}

function parseDuration(dur: string): number {
  const match = dur.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const val = parseInt(match[1], 10);
  switch (match[2]) {
    case 's': return val * 1000;
    case 'm': return val * 60 * 1000;
    case 'h': return val * 60 * 60 * 1000;
    case 'd': return val * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}
