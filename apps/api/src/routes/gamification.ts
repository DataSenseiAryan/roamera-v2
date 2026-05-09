import { Router } from 'express';
import { count, desc, eq } from 'drizzle-orm';

import { db } from '../db/client';
import { userBadges, users, posts, trips, visitedCountries } from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { getPublicUrl } from '../lib/storage';
import { BADGE_DEFINITIONS } from '../lib/badges';

const router = Router();

// ─── GET /badges — user's earned badges ──────────────────────────────────────
router.get('/badges', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const rows = await db.query.userBadges.findMany({
      where: (t, { eq: e }) => e(t.userId, userId),
      orderBy: (t, { asc: a }) => a(t.earnedAt),
    });

    const badgeDefMap = new Map(BADGE_DEFINITIONS.map((b) => [b.type, b]));

    const badges = rows.map((r) => {
      const def = badgeDefMap.get(r.badgeType as Parameters<typeof badgeDefMap.get>[0]);
      return {
        id: r.id,
        badgeType: r.badgeType,
        earnedAt: r.earnedAt,
        name: def?.name ?? r.badgeType,
        icon: def?.icon ?? '🏅',
        description: def?.description ?? '',
      };
    });

    res.json({ badges });
  } catch (err) {
    next(err);
  }
});

// ─── GET /stats — travel stats for user ──────────────────────────────────────
router.get('/stats', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const [[postCount], [tripCount], [countryCount], [badgeCount]] = await Promise.all([
      db.select({ c: count() }).from(posts).where(eq(posts.userId, userId)),
      db.select({ c: count() }).from(trips).where(eq(trips.ownerId, userId)),
      db.select({ c: count() }).from(visitedCountries).where(eq(visitedCountries.userId, userId)),
      db.select({ c: count() }).from(userBadges).where(eq(userBadges.userId, userId)),
    ]);

    res.json({
      stats: {
        posts: postCount?.c ?? 0,
        trips: tripCount?.c ?? 0,
        countries: countryCount?.c ?? 0,
        badges: badgeCount?.c ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /leaderboard — top travelers by countries visited ────────────────────
router.get('/leaderboard', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const rows = await db
      .select({
        userId: visitedCountries.userId,
        countryCount: count(),
      })
      .from(visitedCountries)
      .groupBy(visitedCountries.userId)
      .orderBy(desc(count()))
      .limit(20);

    const userIds = rows.map((r) => r.userId);
    const userRows = userIds.length
      ? await db
          .select({ id: users.id, username: users.username, avatarKey: users.avatarKey })
          .from(users)
      : [];

    const userMap = new Map(userRows.map((u) => [u.id, u]));

    const leaderboard = rows.map((r, idx) => {
      const u = userMap.get(r.userId);
      return {
        rank: idx + 1,
        userId: r.userId,
        username: u?.username ?? '',
        avatarUrl: getPublicUrl(u?.avatarKey ?? null),
        countriesVisited: r.countryCount,
      };
    });

    res.json({ leaderboard });
  } catch (err) {
    next(err);
  }
});

export default router;
