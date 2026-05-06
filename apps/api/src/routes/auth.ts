import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { eq, and, isNull, gt } from 'drizzle-orm';

import {
  RegisterSchema,
  LoginSchema,
  OtpSendSchema,
  OtpVerifySchema,
  RefreshSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  PasswordChangeSchema,
} from '@roamera/types';

import { db } from '../db/client';
import { users, sessions, otpTokens, passwordResetTokens, follows, posts } from '../db/schema';
import { sendVerificationEmail, sendOtpEmail, sendPasswordResetEmail } from '../lib/email';
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  generateOtp,
  generateVerificationToken,
  getRefreshTokenExpiry,
} from '../lib/tokens';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { authRateLimit } from '../middleware/rate-limit';
import { AppError } from '../middleware/error';
import { getPublicUrl } from '../lib/storage';

const router = Router();

// In-memory ws_token store (lightweight, no DB needed)
const wsTokenStore = new Map<string, { userId: string; expiresAt: number }>();

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

// POST /register
router.post('/register', authRateLimit, async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);

    const existingEmail = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.email, body.email),
    });
    if (existingEmail) throw new AppError('Email already in use', 409, 'EMAIL_EXISTS');

    const existingUsername = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.username, body.username),
    });
    if (existingUsername) throw new AppError('Username already taken', 409, 'USERNAME_EXISTS');

    const passwordHash = await bcrypt.hash(body.password, 12);

    const [user] = await db.insert(users).values({
      username: body.username,
      email: body.email,
      passwordHash,
    }).returning();

    const token = generateVerificationToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await sendVerificationEmail(body.email, token);

    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your address.',
    });
  } catch (err) {
    next(err);
  }
});

// GET /verify-email?token=
router.get('/verify-email', async (req, res, next) => {
  try {
    const token = req.query.token as string;
    if (!token) throw new AppError('Token is required', 400);

    const tokenHash = hashToken(token);

    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: (t, { eq: e, and: a, isNull: n, gt: g }) =>
        a(e(t.tokenHash, tokenHash), n(t.usedAt), g(t.expiresAt, new Date())),
    });

    if (!resetToken) throw new AppError('Invalid or expired verification link', 400);

    await db.update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId));

    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
});

// POST /login
router.post('/login', authRateLimit, async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);

    const user = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.email, body.email),
    });
    if (!user || !user.passwordHash) throw new AppError('Invalid email or password', 401);
    if (user.role === 'deleted' as string) throw new AppError('Account has been deleted', 401);

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw new AppError('Invalid email or password', 401);

    if (!user.emailVerified) {
      throw new AppError('Please verify your email before logging in', 403, 'EMAIL_NOT_VERIFIED');
    }

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry();

    await db.insert(sessions).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const counts = await getUserCounts(user.id);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: formatUserResponse(user, counts),
    });
  } catch (err) {
    next(err);
  }
});

// POST /otp/send
router.post('/otp/send', authRateLimit, async (req, res, next) => {
  try {
    const body = OtpSendSchema.parse(req.body);
    const code = generateOtp();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(otpTokens).values({
      email: body.email,
      codeHash,
      expiresAt,
    });

    await sendOtpEmail(body.email, code);

    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    next(err);
  }
});

// POST /otp/verify
router.post('/otp/verify', async (req, res, next) => {
  try {
    const body = OtpVerifySchema.parse(req.body);

    const otpRecords = await db.select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.email, body.email),
          isNull(otpTokens.usedAt),
          gt(otpTokens.expiresAt, new Date()),
        ),
      )
      .orderBy(otpTokens.createdAt)
      .limit(5);

    let validOtp: typeof otpRecords[0] | null = null;
    for (const otp of otpRecords) {
      const match = await bcrypt.compare(body.code, otp.codeHash);
      if (match) {
        validOtp = otp;
        break;
      }
    }

    if (!validOtp) throw new AppError('Invalid or expired OTP', 401);

    await db.update(otpTokens)
      .set({ usedAt: new Date() })
      .where(eq(otpTokens.id, validOtp.id));

    let user = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.email, body.email),
    });

    if (!user) {
      const username = body.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
      const [newUser] = await db.insert(users).values({
        email: body.email,
        username: `${username}_${Date.now().toString(36)}`.slice(0, 30),
        emailVerified: true,
      }).returning();
      user = newUser;
    } else if (!user.emailVerified) {
      await db.update(users)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      user = { ...user, emailVerified: true };
    }

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry();

    await db.insert(sessions).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const counts = await getUserCounts(user.id);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: formatUserResponse(user, counts),
    });
  } catch (err) {
    next(err);
  }
});

// POST /refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const body = RefreshSchema.parse(req.body);
    const tokenHash = hashToken(body.refreshToken);

    const session = await db.query.sessions.findFirst({
      where: (t, { eq: e, and: a, gt: g }) =>
        a(e(t.tokenHash, tokenHash), g(t.expiresAt, new Date())),
    });

    if (!session) throw new AppError('Invalid or expired refresh token', 401);

    await db.delete(sessions).where(eq(sessions.id, session.id));

    const user = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.id, session.userId),
    });
    if (!user) throw new AppError('User not found', 401);

    const accessToken = signAccessToken(user.id, user.role);
    const newRefreshToken = signRefreshToken();
    const newTokenHash = hashToken(newRefreshToken);
    const expiresAt = getRefreshTokenExpiry();

    await db.insert(sessions).values({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt,
    });

    const counts = await getUserCounts(user.id);

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      user: formatUserResponse(user, counts),
    });
  } catch (err) {
    next(err);
  }
});

// POST /logout
router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) throw new AppError('Not authenticated', 401);

    await db.delete(sessions).where(eq(sessions.userId, req.user!.id));

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

// POST /password/reset-request
router.post('/password/reset-request', authRateLimit, async (req, res, next) => {
  try {
    const body = PasswordResetRequestSchema.parse(req.body);

    const user = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.email, body.email),
    });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
      return;
    }

    const token = generateVerificationToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await sendPasswordResetEmail(body.email, token);

    res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /password/reset
router.post('/password/reset', async (req, res, next) => {
  try {
    const body = PasswordResetSchema.parse(req.body);
    const tokenHash = hashToken(body.token);

    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: (t, { eq: e, and: a, isNull: n, gt: g }) =>
        a(e(t.tokenHash, tokenHash), n(t.usedAt), g(t.expiresAt, new Date())),
    });

    if (!resetToken) throw new AppError('Invalid or expired reset token', 400);

    const passwordHash = await bcrypt.hash(body.password, 12);

    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId));

    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    // Invalidate all sessions
    await db.delete(sessions).where(eq(sessions.userId, resetToken.userId));

    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
});

// POST /password/change
router.post('/password/change', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const body = PasswordChangeSchema.parse(req.body);
    const userId = req.user!.id;

    const user = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.id, userId),
    });
    if (!user || !user.passwordHash) throw new AppError('User not found', 404);

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Current password is incorrect', 401);

    const passwordHash = await bcrypt.hash(body.newPassword, 12);

    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Invalidate other sessions (keep the current one implied via access token)
    await db.delete(sessions).where(eq(sessions.userId, userId));

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
});

// GET /me
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await db.query.users.findFirst({
      where: (t, { eq: e }) => e(t.id, req.user!.id),
    });
    if (!user) throw new AppError('User not found', 404);

    const counts = await getUserCounts(user.id);

    res.json({ success: true, user: formatUserResponse(user, counts) });
  } catch (err) {
    next(err);
  }
});

// GET /ws-token
router.get('/ws-token', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const token = generateVerificationToken();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    wsTokenStore.set(token, { userId: req.user!.id, expiresAt });

    // Clean up expired tokens periodically
    for (const [key, value] of wsTokenStore) {
      if (value.expiresAt < Date.now()) wsTokenStore.delete(key);
    }

    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
});

export { wsTokenStore };
export default router;
