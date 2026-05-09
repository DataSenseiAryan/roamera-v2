import crypto from 'crypto';

import { Router } from 'express';
import { and, asc, eq, inArray } from 'drizzle-orm';
import multer from 'multer';
import sharp from 'sharp';

import { db } from '../db/client';
import {
  journeys,
  journeyEntries,
  journeyPhotos,
  journeyContributors,
  journeyTripLinks,
  users,
  trips,
} from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { generateStorageKey, uploadFile, getPublicUrl } from '../lib/storage';
import { checkAndAwardBadges } from '../lib/badges';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─── Access control helpers ───────────────────────────────────────────────────

type ContributorRole = 'owner' | 'contributor';

async function getContributorRole(
  journeyId: string,
  userId: string,
): Promise<ContributorRole | null> {
  const row = await db.query.journeyContributors.findFirst({
    where: (t, { and: a, eq: e }) => a(e(t.journeyId, journeyId), e(t.userId, userId)),
  });
  return (row?.role as ContributorRole) ?? null;
}

function requireContributorRole(minRole: ContributorRole) {
  return async (req: AuthRequest, _res: unknown, next: (err?: unknown) => void) => {
    try {
      const journeyId = req.params.journeyId as string;
      const userId = req.user!.id;
      const role = await getContributorRole(journeyId, userId);
      if (!role || (minRole === 'owner' && role !== 'owner')) {
        throw new AppError('Forbidden', 403);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

function serializeJourney(j: typeof journeys.$inferSelect, role?: string | null) {
  return { ...j, coverUrl: getPublicUrl(j.coverKey), role: role ?? null };
}

// ─── GET / — list user's journeys ─────────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const contribs = await db.query.journeyContributors.findMany({
      where: (t, { eq: e }) => e(t.userId, userId),
    });
    if (contribs.length === 0) return res.json({ journeys: [] });

    const journeyIds = contribs.map((c) => c.journeyId);
    const roleMap = new Map(contribs.map((c) => [c.journeyId, c.role]));

    const rows = await db
      .select()
      .from(journeys)
      .where(inArray(journeys.id, journeyIds))
      .orderBy(asc(journeys.createdAt));

    res.json({ journeys: rows.map((j) => serializeJourney(j, roleMap.get(j.id))) });
  } catch (err) {
    next(err);
  }
});

// ─── POST / — create journey ──────────────────────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { title, description, layoutPref } = req.body as {
      title: string;
      description?: string;
      layoutPref?: string;
    };

    if (!title?.trim()) throw new AppError('Title is required', 400);

    const id = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(journeys).values({
        id,
        userId,
        title: title.trim(),
        description: description?.trim(),
        layoutPref: layoutPref ?? 'magazine',
      });
      await tx.insert(journeyContributors).values({
        journeyId: id,
        userId,
        role: 'owner',
      });
    });

    await checkAndAwardBadges(userId);

    const journey = await db.query.journeys.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    res.status(201).json({ journey: serializeJourney(journey!, 'owner') });
  } catch (err) {
    next(err);
  }
});

// ─── GET /public/:token — public read-only view (no auth) ─────────────────────
router.get('/public/:token', async (req, res, next) => {
  try {
    const token = req.params.token as string;
    const journey = await db.query.journeys.findFirst({
      where: (t, { and: a, eq: e }) => a(e(t.shareToken, token), e(t.isPublic, true)),
    });
    if (!journey) throw new AppError('Journey not found', 404);

    const entries = await db
      .select()
      .from(journeyEntries)
      .where(eq(journeyEntries.journeyId, journey.id))
      .orderBy(asc(journeyEntries.orderIndex));

    const owner = await db
      .select({ id: users.id, username: users.username, avatarKey: users.avatarKey })
      .from(users)
      .where(eq(users.id, journey.userId))
      .limit(1)
      .then((r) => r[0] ?? null);

    res.json({
      journey: serializeJourney(journey),
      entries,
      owner: owner ? { ...owner, avatarUrl: getPublicUrl(owner.avatarKey) } : null,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:journeyId — detail ─────────────────────────────────────────────────
router.get(
  '/:journeyId',
  authenticate,
  requireContributorRole('contributor'),
  async (req: AuthRequest, res, next) => {
    try {
      const journeyId = req.params.journeyId as string;
      const userId = req.user!.id;

      const journey = await db.query.journeys.findFirst({
        where: (t, { eq: e }) => e(t.id, journeyId),
      });
      if (!journey) throw new AppError('Journey not found', 404);

      const role = await getContributorRole(journeyId, userId);

      const entries = await db
        .select()
        .from(journeyEntries)
        .where(eq(journeyEntries.journeyId, journeyId))
        .orderBy(asc(journeyEntries.orderIndex));

      const contribs = await db
        .select({ journeyId: journeyContributors.journeyId, userId: journeyContributors.userId, role: journeyContributors.role, invitedAt: journeyContributors.invitedAt })
        .from(journeyContributors)
        .where(eq(journeyContributors.journeyId, journeyId));

      const contribUserIds = contribs.map((c) => c.userId);
      const contribUsers = contribUserIds.length
        ? await db
            .select({ id: users.id, username: users.username, avatarKey: users.avatarKey })
            .from(users)
            .where(inArray(users.id, contribUserIds))
        : [];
      const userMap = new Map(contribUsers.map((u) => [u.id, u]));

      const linkedLinks = await db
        .select({ journeyId: journeyTripLinks.journeyId, tripId: journeyTripLinks.tripId })
        .from(journeyTripLinks)
        .where(eq(journeyTripLinks.journeyId, journeyId));

      const tripIds = linkedLinks.map((l) => l.tripId);
      const linkedTripsRows = tripIds.length
        ? await db
            .select({ id: trips.id, title: trips.title, description: trips.description })
            .from(trips)
            .where(inArray(trips.id, tripIds))
        : [];

      res.json({
        journey: serializeJourney(journey, role),
        entries,
        contributors: contribs.map((c) => {
          const u = userMap.get(c.userId);
          return { ...c, user: u ? { ...u, avatarUrl: getPublicUrl(u.avatarKey) } : null };
        }),
        linkedTrips: linkedTripsRows,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── PATCH /:journeyId — update ───────────────────────────────────────────────
router.patch(
  '/:journeyId',
  authenticate,
  requireContributorRole('owner'),
  async (req: AuthRequest, res, next) => {
    try {
      const journeyId = req.params.journeyId as string;
      const { title, description, layoutPref, isPublic } = req.body as {
        title?: string;
        description?: string;
        layoutPref?: string;
        isPublic?: boolean;
      };

      await db
        .update(journeys)
        .set({
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(layoutPref !== undefined && { layoutPref }),
          ...(isPublic !== undefined && { isPublic }),
          updatedAt: new Date(),
        })
        .where(eq(journeys.id, journeyId));

      const updated = await db.query.journeys.findFirst({
        where: (t, { eq: e }) => e(t.id, journeyId),
      });
      res.json({ journey: serializeJourney(updated!, 'owner') });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /:journeyId — delete ─────────────────────────────────────────────
router.delete(
  '/:journeyId',
  authenticate,
  requireContributorRole('owner'),
  async (req: AuthRequest, res, next) => {
    try {
      const journeyId = req.params.journeyId as string;
      await db.delete(journeys).where(eq(journeys.id, journeyId));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /:journeyId/share — generate share token ───────────────────────────
router.post(
  '/:journeyId/share',
  authenticate,
  requireContributorRole('owner'),
  async (req: AuthRequest, res, next) => {
    try {
      const journeyId = req.params.journeyId as string;
      const shareToken = crypto.randomBytes(16).toString('hex');

      await db
        .update(journeys)
        .set({ shareToken, isPublic: true, updatedAt: new Date() })
        .where(eq(journeys.id, journeyId));

      res.json({ shareToken });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /:journeyId/share — revoke share token ───────────────────────────
router.delete(
  '/:journeyId/share',
  authenticate,
  requireContributorRole('owner'),
  async (req: AuthRequest, res, next) => {
    try {
      const journeyId = req.params.journeyId as string;

      await db
        .update(journeys)
        .set({ shareToken: null, isPublic: false, updatedAt: new Date() })
        .where(eq(journeys.id, journeyId));

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /:journeyId/entries — list entries ───────────────────────────────────
router.get(
  '/:journeyId/entries',
  authenticate,
  requireContributorRole('contributor'),
  async (req: AuthRequest, res, next) => {
    try {
      const journeyId = req.params.journeyId as string;
      const entries = await db
        .select()
        .from(journeyEntries)
        .where(eq(journeyEntries.journeyId, journeyId))
        .orderBy(asc(journeyEntries.orderIndex));
      res.json({ entries });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /:journeyId/entries — add entry ─────────────────────────────────────
router.post(
  '/:journeyId/entries',
  authenticate,
  requireContributorRole('contributor'),
  async (req: AuthRequest, res, next) => {
    try {
      const journeyId = req.params.journeyId as string;
      const { title, contentJson, orderIndex } = req.body as {
        title?: string;
        contentJson?: unknown;
        orderIndex?: number;
      };

      const id = crypto.randomUUID();
      await db.insert(journeyEntries).values({
        id,
        journeyId,
        title,
        contentJson,
        orderIndex: orderIndex ?? 0,
      });

      const entry = await db.query.journeyEntries.findFirst({
        where: (t, { eq: e }) => e(t.id, id),
      });
      res.status(201).json({ entry });
    } catch (err) {
      next(err);
    }
  },
);

// ─── PATCH /:journeyId/entries/:id — edit entry ───────────────────────────────
router.patch(
  '/:journeyId/entries/:id',
  authenticate,
  requireContributorRole('contributor'),
  async (req: AuthRequest, res, next) => {
    try {
      const id = req.params.id as string;
      const { title, contentJson, orderIndex } = req.body as {
        title?: string;
        contentJson?: unknown;
        orderIndex?: number;
      };

      await db
        .update(journeyEntries)
        .set({
          ...(title !== undefined && { title }),
          ...(contentJson !== undefined && { contentJson }),
          ...(orderIndex !== undefined && { orderIndex }),
          updatedAt: new Date(),
        })
        .where(eq(journeyEntries.id, id));

      const entry = await db.query.journeyEntries.findFirst({
        where: (t, { eq: e }) => e(t.id, id),
      });
      res.json({ entry });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /:journeyId/entries/:id — delete entry ────────────────────────────
router.delete(
  '/:journeyId/entries/:id',
  authenticate,
  requireContributorRole('contributor'),
  async (req: AuthRequest, res, next) => {
    try {
      const id = req.params.id as string;
      await db.delete(journeyEntries).where(eq(journeyEntries.id, id));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /:journeyId/entries/:id/photos — upload photos ──────────────────────
router.post(
  '/:journeyId/entries/:id/photos',
  authenticate,
  requireContributorRole('contributor'),
  upload.array('photos', 10),
  async (req: AuthRequest, res, next) => {
    try {
      const entryId = req.params.id as string;
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) throw new AppError('No photos uploaded', 400);

      const inserted = await Promise.all(
        files.map(async (file, idx) => {
          const buffer = await sharp(file.buffer).webp({ quality: 82 }).toBuffer();
          const key = `journeys/${generateStorageKey(buffer, '.webp')}`;
          await uploadFile(buffer, key, 'image/webp');

          const photoId = crypto.randomUUID();
          await db.insert(journeyPhotos).values({
            id: photoId,
            entryId,
            storageKey: key,
            orderIndex: idx,
          });
          return { id: photoId, storageKey: key, url: getPublicUrl(key) };
        }),
      );

      res.status(201).json({ photos: inserted });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /:journeyId/contributors — invite contributor ──────────────────────
router.post(
  '/:journeyId/contributors',
  authenticate,
  requireContributorRole('owner'),
  async (req: AuthRequest, res, next) => {
    try {
      const journeyId = req.params.journeyId as string;
      const { username } = req.body as { username: string };
      if (!username) throw new AppError('username is required', 400);

      const invitees = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      if (!invitees.length) throw new AppError('User not found', 404);
      const invitee = invitees[0];

      const existing = await getContributorRole(journeyId, invitee.id);
      if (!existing) {
        await db.insert(journeyContributors).values({
          journeyId,
          userId: invitee.id,
          role: 'contributor',
        });
      }

      res.json({ contributor: { ...invitee, role: existing ?? 'contributor' } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /:journeyId/contributors/:userId — remove contributor ─────────────
router.delete(
  '/:journeyId/contributors/:userId',
  authenticate,
  requireContributorRole('owner'),
  async (req: AuthRequest, res, next) => {
    try {
      const journeyId = req.params.journeyId as string;
      const targetUserId = req.params.userId as string;
      const callerId = req.user!.id;
      if (targetUserId === callerId) throw new AppError('Cannot remove yourself (owner)', 400);

      await db
        .delete(journeyContributors)
        .where(
          and(
            eq(journeyContributors.journeyId, journeyId),
            eq(journeyContributors.userId, targetUserId),
          ),
        );
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /:journeyId/trips/:tripId — link trip ───────────────────────────────
router.post(
  '/:journeyId/trips/:tripId',
  authenticate,
  requireContributorRole('owner'),
  async (req: AuthRequest, res, next) => {
    try {
      const journeyId = req.params.journeyId as string;
      const tripId = req.params.tripId as string;
      await db.insert(journeyTripLinks).values({ journeyId, tripId }).onConflictDoNothing();
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /:journeyId/trips/:tripId — unlink trip ──────────────────────────
router.delete(
  '/:journeyId/trips/:tripId',
  authenticate,
  requireContributorRole('owner'),
  async (req: AuthRequest, res, next) => {
    try {
      const journeyId = req.params.journeyId as string;
      const tripId = req.params.tripId as string;
      await db
        .delete(journeyTripLinks)
        .where(
          and(
            eq(journeyTripLinks.journeyId, journeyId),
            eq(journeyTripLinks.tripId, tripId),
          ),
        );
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
