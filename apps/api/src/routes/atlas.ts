import crypto from 'crypto';

import { Router } from 'express';
import { and, count, eq } from 'drizzle-orm';

import { db } from '../db/client';
import { visitedCountries, visitedRegions } from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { checkAndAwardBadges } from '../lib/badges';
import COUNTRIES from '../lib/countries.json';

const router = Router();

const TOTAL_COUNTRIES = 195;
const codeToCountry = new Map(COUNTRIES.map((c) => [c.code, c]));

// ─── GET /countries — user's visited countries ────────────────────────────────
router.get('/countries', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const rows = await db.query.visitedCountries.findMany({
      where: (t, { eq: e }) => e(t.userId, userId),
    });

    const result = rows.map((r) => ({
      ...r,
      countryName: codeToCountry.get(r.countryCode)?.name ?? r.countryCode,
      continent: codeToCountry.get(r.countryCode)?.continent ?? 'Unknown',
    }));

    res.json({ countries: result });
  } catch (err) {
    next(err);
  }
});

// ─── POST /countries/:code — mark visited ─────────────────────────────────────
router.post('/countries/:code', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const code = (req.params.code as string).toUpperCase();

    if (!codeToCountry.has(code)) throw new AppError('Unknown country code', 400);

    const id = crypto.randomUUID();
    await db
      .insert(visitedCountries)
      .values({ id, userId, countryCode: code })
      .onConflictDoNothing();

    await checkAndAwardBadges(userId);

    const row = await db.query.visitedCountries.findFirst({
      where: (t, { and: a, eq: e }) => a(e(t.userId, userId), e(t.countryCode, code)),
    });

    res.status(201).json({
      country: {
        ...row,
        countryName: codeToCountry.get(code)?.name,
        continent: codeToCountry.get(code)?.continent,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /countries/:code — unmark visited ──────────────────────────────────
router.delete('/countries/:code', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const code = (req.params.code as string).toUpperCase();

    await db
      .delete(visitedCountries)
      .where(and(eq(visitedCountries.userId, userId), eq(visitedCountries.countryCode, code)));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── GET /stats — aggregated atlas stats ──────────────────────────────────────
router.get('/stats', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const rows = await db.query.visitedCountries.findMany({
      where: (t, { eq: e }) => e(t.userId, userId),
    });

    const totalVisited = rows.length;
    const percentage = Math.round((totalVisited / TOTAL_COUNTRIES) * 100 * 10) / 10;

    const continentMap = new Map<string, number>();
    for (const r of rows) {
      const continent = codeToCountry.get(r.countryCode)?.continent ?? 'Unknown';
      continentMap.set(continent, (continentMap.get(continent) ?? 0) + 1);
    }

    const continentBreakdown = Array.from(continentMap.entries()).map(([continent, c]) => ({
      continent,
      count: c,
    }));

    res.json({
      stats: {
        totalCountries: totalVisited,
        totalPossible: TOTAL_COUNTRIES,
        percentage,
        continentBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /regions/:countryCode — visited regions in a country ─────────────────
router.get('/regions/:countryCode', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const countryCode = (req.params.countryCode as string).toUpperCase();

    const rows = await db.query.visitedRegions.findMany({
      where: (t, { and: a, eq: e }) => a(e(t.userId, userId), e(t.countryCode, countryCode)),
    });

    res.json({ regions: rows });
  } catch (err) {
    next(err);
  }
});

// ─── POST /regions/:regionCode — mark region visited ──────────────────────────
router.post('/regions/:regionCode', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const regionCode = (req.params.regionCode as string).toUpperCase();
    const { countryCode } = req.body as { countryCode: string };
    if (!countryCode) throw new AppError('countryCode is required', 400);

    const id = crypto.randomUUID();
    await db
      .insert(visitedRegions)
      .values({ id, userId, countryCode: countryCode.toUpperCase(), regionCode })
      .onConflictDoNothing();

    const row = await db.query.visitedRegions.findFirst({
      where: (t, { and: a, eq: e }) => a(e(t.userId, userId), e(t.regionCode, regionCode)),
    });

    res.status(201).json({ region: row });
  } catch (err) {
    next(err);
  }
});

export default router;
