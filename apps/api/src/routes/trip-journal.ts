import crypto from 'crypto';

import { Router } from 'express';
import { asc, eq, and } from 'drizzle-orm';
import multer from 'multer';
import sharp from 'sharp';

import { db } from '../db/client';
import {
  journeys,
  journeyEntries,
  journeyPhotos,
  trips,
} from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { generateStorageKey, uploadFile, getPublicUrl } from '../lib/storage';

const router = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

type TripRole = 'owner' | 'editor' | 'viewer';
const ROLE_LEVEL: Record<TripRole, number> = { owner: 3, editor: 2, viewer: 1 };

async function getMemberRole(tripId: string, userId: string): Promise<TripRole | null> {
  const member = await db.query.tripMembers.findFirst({
    where: (t, { and: a, eq: e }) => a(e(t.tripId, tripId), e(t.userId, userId)),
  });
  return (member?.role as TripRole) ?? null;
}

function requireTripRole(minRole: TripRole) {
  return async (req: AuthRequest, _res: unknown, next: (err?: unknown) => void) => {
    try {
      const tripId = req.params.tripId as string;
      const userId = req.user!.id;
      const role = await getMemberRole(tripId, userId);
      if (!role || ROLE_LEVEL[role] < ROLE_LEVEL[minRole]) {
        throw new AppError('Forbidden', 403);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Get or lazy-create the journal for a trip
async function getOrCreateJournal(tripId: string, userId: string) {
  const existing = await db.query.journeys.findFirst({
    where: (t, { and: a, eq: e }) => a(e(t.tripId, tripId)),
  });
  if (existing) return existing;

  // Lazy creation: create a journal for this trip
  const trip = await db.query.trips.findFirst({ where: (t, { eq: e }) => e(t.id, tripId) });
  if (!trip) throw new AppError('Trip not found', 404);

  const id = crypto.randomUUID();
  await db.insert(journeys).values({
    id,
    userId,
    tripId,
    title: trip.title,
    description: trip.description ?? null,
  });

  return db.query.journeys.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
}

// ─── GET / — list entries ──────────────────────────────────────────────────────
router.get('/', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const journal = await getOrCreateJournal(tripId, userId);
    if (!journal) throw new AppError('Journal not found', 404);

    const entries = await db
      .select()
      .from(journeyEntries)
      .where(eq(journeyEntries.journeyId, journal.id))
      .orderBy(asc(journeyEntries.orderIndex));

    const entriesWithPhotos = await Promise.all(
      entries.map(async (entry) => {
        const photos = await db.query.journeyPhotos.findMany({
          where: (t, { eq: e }) => e(t.entryId, entry.id),
          orderBy: (t, { asc: a }) => a(t.orderIndex),
        });
        return {
          ...entry,
          photos: photos.map((p) => ({ ...p, url: getPublicUrl(p.storageKey) })),
        };
      }),
    );

    res.json({
      journal: {
        ...journal,
        coverUrl: journal.coverKey ? getPublicUrl(journal.coverKey) : null,
      },
      entries: entriesWithPhotos,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST / — create entry ─────────────────────────────────────────────────────
router.post('/', authenticate, requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;
    const { title, contentJson, orderIndex } = req.body as {
      title?: string;
      contentJson?: unknown;
      orderIndex?: number;
    };

    const journal = await getOrCreateJournal(tripId, userId);
    if (!journal) throw new AppError('Journal not found', 404);

    const id = crypto.randomUUID();
    await db.insert(journeyEntries).values({
      id,
      journeyId: journal.id,
      title: title ?? null,
      contentJson: contentJson ?? null,
      orderIndex: orderIndex ?? 0,
    });

    const entry = await db.query.journeyEntries.findFirst({
      where: (t, { eq: e }) => e(t.id, id),
    });
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /:entryId — update entry ────────────────────────────────────────────
router.patch('/:entryId', authenticate, requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const entryId = req.params.entryId as string;
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
      .where(eq(journeyEntries.id, entryId));

    const entry = await db.query.journeyEntries.findFirst({
      where: (t, { eq: e }) => e(t.id, entryId),
    });
    res.json({ entry });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:entryId — delete entry ───────────────────────────────────────────
router.delete('/:entryId', authenticate, requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const entryId = req.params.entryId as string;
    await db.delete(journeyEntries).where(eq(journeyEntries.id, entryId));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── POST /:entryId/photos — upload photos ─────────────────────────────────────
router.post(
  '/:entryId/photos',
  authenticate,
  requireTripRole('editor'),
  upload.array('photos', 10),
  async (req: AuthRequest, res, next) => {
    try {
      const entryId = req.params.entryId as string;
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

// ─── GET /share — get share token ──────────────────────────────────────────────
router.get('/share', authenticate, requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;
    const journal = await getOrCreateJournal(tripId, userId);
    if (!journal) throw new AppError('Journal not found', 404);
    res.json({ shareToken: journal.shareToken, isPublic: journal.isPublic });
  } catch (err) {
    next(err);
  }
});

// ─── POST /share — generate share token ────────────────────────────────────────
router.post('/share', authenticate, requireTripRole('owner'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;
    const journal = await getOrCreateJournal(tripId, userId);
    if (!journal) throw new AppError('Journal not found', 404);

    const shareToken = crypto.randomBytes(16).toString('hex');
    await db
      .update(journeys)
      .set({ shareToken, isPublic: true, updatedAt: new Date() })
      .where(eq(journeys.id, journal.id));

    res.json({ shareToken });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /share — revoke share token ────────────────────────────────────────
router.delete('/share', authenticate, requireTripRole('owner'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;
    const journal = await getOrCreateJournal(tripId, userId);
    if (!journal) throw new AppError('Journal not found', 404);

    await db
      .update(journeys)
      .set({ shareToken: null, isPublic: false, updatedAt: new Date() })
      .where(eq(journeys.id, journal.id));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── GET /public/:token — public read-only view ────────────────────────────────
router.get('/public/:token', async (req, res, next) => {
  try {
    const token = req.params.token as string;
    const journal = await db.query.journeys.findFirst({
      where: (t, { and: a, eq: e }) => a(e(t.shareToken, token), e(t.isPublic, true)),
    });
    if (!journal) throw new AppError('Journal not found or not public', 404);

    const entries = await db
      .select()
      .from(journeyEntries)
      .where(eq(journeyEntries.journeyId, journal.id))
      .orderBy(asc(journeyEntries.orderIndex));

    const trip = journal.tripId
      ? await db.query.trips.findFirst({ where: (t, { eq: e }) => e(t.id, journal.tripId!) })
      : null;

    res.json({
      journal: { ...journal, coverUrl: journal.coverKey ? getPublicUrl(journal.coverKey) : null },
      entries,
      trip: trip ? { id: trip.id, title: trip.title } : null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
