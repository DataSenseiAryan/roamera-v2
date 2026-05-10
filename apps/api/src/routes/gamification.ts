import { Router } from 'express';
import { count, desc, eq } from 'drizzle-orm';

import { db } from '../db/client';
import { userBadges, users, posts, trips, visitedCountries } from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { getPublicUrl } from '../lib/storage';
import { BADGE_DEFINITIONS } from '../lib/badges';
import COUNTRIES from '../lib/countries.json';

const TOTAL_COUNTRIES = 195;
const codeToContinent = new Map((COUNTRIES as Array<{ code: string; continent: string }>).map((c) => [c.code, c.continent]));

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

// ─── GET /stats — travel stats for user (includes atlas fields) ──────────────
router.get('/stats', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const [[postCount], [tripCount], [badgeCount], countryRows] = await Promise.all([
      db.select({ c: count() }).from(posts).where(eq(posts.userId, userId)),
      db.select({ c: count() }).from(trips).where(eq(trips.ownerId, userId)),
      db.select({ c: count() }).from(userBadges).where(eq(userBadges.userId, userId)),
      db.query.visitedCountries.findMany({ where: (t, { eq: e }) => e(t.userId, userId) }),
    ]);

    const countriesVisited = countryRows.length;
    const percentOfWorld = Math.round((countriesVisited / TOTAL_COUNTRIES) * 100 * 10) / 10;
    const continentMap = new Map<string, number>();
    for (const r of countryRows) {
      const continent = codeToContinent.get(r.countryCode) ?? 'Unknown';
      continentMap.set(continent, (continentMap.get(continent) ?? 0) + 1);
    }
    const continentBreakdown = Array.from(continentMap.entries()).map(([continent, c]) => ({ continent, count: c }));

    res.json({
      stats: {
        posts: postCount?.c ?? 0,
        trips: tripCount?.c ?? 0,
        countries: countriesVisited,
        badges: badgeCount?.c ?? 0,
        countriesVisited,
        percentOfWorld,
        continentBreakdown,
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
