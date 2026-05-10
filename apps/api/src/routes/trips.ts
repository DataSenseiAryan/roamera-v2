import { Router } from 'express';
import multer from 'multer';
import { eq, and, desc, asc } from 'drizzle-orm';
import ical from 'ical-generator';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmakeLib = require('pdfmake');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const helveticaFonts = require('pdfmake/standard-fonts/Helvetica');
pdfmakeLib.setLocalAccessPolicy(() => true);
pdfmakeLib.setUrlAccessPolicy(() => true);
pdfmakeLib.setFonts(helveticaFonts);

import { db } from '../db/client';
import {
  trips,
  tripMembers,
  days,
  places,
  dayAssignments,
  dayNotes,
  users,
  reservations,
  accommodations,
} from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { uploadFile, generateStorageKey, getPublicUrl } from '../lib/storage';
import { getWsManager } from '../lib/ws';
import { createNotification } from '../lib/notifications';
import budgetRouter from './budget';
import collabRouter from './collab';
import packingRouter from './packing';
import tripFilesRouter from './trip-files';
import tripJournalRouter from './trip-journal';

const router = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 }, storage: multer.memoryStorage() });

// ─── Helpers ───────────────────────────────────────────────────────

type TripRole = 'owner' | 'editor' | 'viewer';
const ROLE_LEVEL: Record<TripRole, number> = { owner: 3, editor: 2, viewer: 1 };

async function getMemberRole(tripId: string, userId: string): Promise<TripRole | null> {
  const member = await db.query.tripMembers.findFirst({
    where: (t, { and: a, eq: e }) => a(e(t.tripId, tripId), e(t.userId, userId)),
  });
  return (member?.role as TripRole) ?? null;
}

function requireTripRole(minRole: TripRole) {
  return async (req: AuthRequest, res: Parameters<typeof authenticate>[1], next: Parameters<typeof authenticate>[2]) => {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;
    const role = await getMemberRole(tripId, userId);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL[minRole]) {
      throw new AppError('Forbidden', 403);
    }
    next();
  };
}

function formatTrip(trip: typeof trips.$inferSelect) {
  return {
    id: trip.id,
    title: trip.title,
    description: trip.description,
    dateFrom: trip.dateFrom ? (trip.dateFrom instanceof Date ? trip.dateFrom.toISOString() : new Date(trip.dateFrom * 1000).toISOString()) : null,
    dateTo: trip.dateTo ? (trip.dateTo instanceof Date ? trip.dateTo.toISOString() : new Date(trip.dateTo * 1000).toISOString()) : null,
    currency: trip.currency,
    coverUrl: getPublicUrl(trip.coverKey),
    isArchived: trip.isArchived,
    shareToken: trip.shareToken,
    ownerId: trip.ownerId,
    createdAt: trip.createdAt instanceof Date ? trip.createdAt.toISOString() : new Date((trip.createdAt as number) * 1000).toISOString(),
    updatedAt: trip.updatedAt instanceof Date ? trip.updatedAt.toISOString() : new Date((trip.updatedAt as number) * 1000).toISOString(),
  };
}

function formatPlace(place: typeof places.$inferSelect) {
  return {
    id: place.id,
    tripId: place.tripId,
    name: place.name,
    lat: place.lat ? parseFloat(place.lat) : null,
    lng: place.lng ? parseFloat(place.lng) : null,
    address: place.address,
    category: place.categoryId,
    price: place.price,
    website: place.website,
    phone: place.phone,
    imageUrl: place.imageUrl,
    notes: place.notes,
    createdAt: place.createdAt instanceof Date ? place.createdAt.toISOString() : new Date((place.createdAt as number) * 1000).toISOString(),
  };
}

// ─── TRIPS CRUD ────────────────────────────────────────────────────

// GET /api/v1/trips — list user's trips
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const memberships = await db.query.tripMembers.findMany({
      where: (t, { eq: e }) => e(t.userId, userId),
    });

    const result = await Promise.all(
      memberships.map(async (m) => {
        const trip = await db.query.trips.findFirst({ where: (t, { eq: e }) => e(t.id, m.tripId) });
        if (!trip || trip.isArchived) return null;
        return { ...formatTrip(trip), myRole: m.role };
      }),
    );

    res.json({ success: true, trips: result.filter(Boolean) });
  } catch (err) { next(err); }
});

// POST /api/v1/trips — create trip
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { title, description, dateFrom, dateTo, currency = 'INR' } = req.body as {
      title: string;
      description?: string;
      dateFrom?: string;
      dateTo?: string;
      currency?: string;
    };

    if (!title?.trim()) throw new AppError('Trip title is required', 400);

    const tripId = crypto.randomUUID();

    await db.insert(trips).values({
      id: tripId,
      ownerId: userId,
      title: title.trim(),
      description: description?.trim() ?? null,
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      currency,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Owner is automatically a member with 'owner' role
    await db.insert(tripMembers).values({
      tripId,
      userId,
      role: 'owner',
      createdAt: new Date(),
    });

    const trip = await db.query.trips.findFirst({ where: (t, { eq: e }) => e(t.id, tripId) });
    res.status(201).json({ success: true, trip: { ...formatTrip(trip!), myRole: 'owner' } });
  } catch (err) { next(err); }
});

router.use('/:tripId/budget', budgetRouter);
router.use('/:tripId/packing', packingRouter);
router.use('/:tripId/collab', collabRouter);
router.use('/:tripId/files', tripFilesRouter);
router.use('/:tripId/journal', tripJournalRouter);

// GET /api/v1/trips/:tripId — trip detail
router.get('/:tripId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role) throw new AppError('Trip not found', 404);

    const trip = await db.query.trips.findFirst({ where: (t, { eq: e }) => e(t.id, tripId) });
    if (!trip) throw new AppError('Trip not found', 404);

    const memberCount = await db.query.tripMembers.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
    });

    const daysList = await db.query.days.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
      orderBy: (t) => asc(t.dayNumber),
    });

    res.json({
      success: true,
      trip: { ...formatTrip(trip), myRole: role },
      memberCount: memberCount.length,
      dayCount: daysList.length,
    });
  } catch (err) { next(err); }
});

// PATCH /api/v1/trips/:tripId — update metadata
router.patch('/:tripId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    const { title, description, dateFrom, dateTo, currency } = req.body as Record<string, string | undefined>;

    await db.update(trips)
      .set({
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() ?? null }),
        ...(dateFrom !== undefined && { dateFrom: dateFrom ? new Date(dateFrom) : null }),
        ...(dateTo !== undefined && { dateTo: dateTo ? new Date(dateTo) : null }),
        ...(currency !== undefined && { currency }),
        updatedAt: new Date(),
      })
      .where(eq(trips.id, tripId));

    const trip = await db.query.trips.findFirst({ where: (t, { eq: e }) => e(t.id, tripId) });
    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'trip:updated', formatTrip(trip!));

    res.json({ success: true, trip: formatTrip(trip!) });
  } catch (err) { next(err); }
});

// DELETE /api/v1/trips/:tripId — owner only
router.delete('/:tripId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (role !== 'owner') throw new AppError('Forbidden', 403);

    await db.delete(trips).where(eq(trips.id, tripId));
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/v1/trips/:tripId/cover — upload cover image
router.post('/:tripId/cover', authenticate, upload.single('cover'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    if (!req.file) throw new AppError('No file uploaded', 400);

    const ext = req.file.mimetype.includes('png') ? '.png' : '.jpg';
    const key = generateStorageKey(req.file.buffer, ext);
    await uploadFile(req.file.buffer, key, req.file.mimetype);
    await db.update(trips).set({ coverKey: key, updatedAt: new Date() }).where(eq(trips.id, tripId));

    res.json({ success: true, coverUrl: getPublicUrl(key) });
  } catch (err) { next(err); }
});

// POST /api/v1/trips/:tripId/copy — duplicate trip
router.post('/:tripId/copy', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role) throw new AppError('Trip not found', 404);

    const original = await db.query.trips.findFirst({ where: (t, { eq: e }) => e(t.id, tripId) });
    if (!original) throw new AppError('Trip not found', 404);

    const newTripId = crypto.randomUUID();
    await db.insert(trips).values({
      id: newTripId,
      ownerId: userId,
      title: `${original.title} (copy)`,
      description: original.description,
      dateFrom: original.dateFrom,
      dateTo: original.dateTo,
      currency: original.currency,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(tripMembers).values({ tripId: newTripId, userId, role: 'owner', createdAt: new Date() });

    // Copy days and places
    const originalDays = await db.query.days.findMany({ where: (t, { eq: e }) => e(t.tripId, tripId) });
    const dayIdMap = new Map<string, string>();

    for (const day of originalDays) {
      const newDayId = crypto.randomUUID();
      dayIdMap.set(day.id, newDayId);
      await db.insert(days).values({ id: newDayId, tripId: newTripId, dayNumber: day.dayNumber, date: day.date, title: day.title, notes: day.notes });
    }

    const originalPlaces = await db.query.places.findMany({ where: (t, { eq: e }) => e(t.tripId, tripId) });
    const placeIdMap = new Map<string, string>();

    for (const place of originalPlaces) {
      const newPlaceId = crypto.randomUUID();
      placeIdMap.set(place.id, newPlaceId);
      await db.insert(places).values({ ...place, id: newPlaceId, tripId: newTripId, createdAt: new Date() });
    }

    const originalAssignments = await db.query.dayAssignments.findMany({ where: (t, { eq: e }) => e(t.tripId, tripId) });
    for (const assignment of originalAssignments) {
      const newDayId = dayIdMap.get(assignment.dayId);
      const newPlaceId = placeIdMap.get(assignment.placeId);
      if (newDayId && newPlaceId) {
        await db.insert(dayAssignments).values({ id: crypto.randomUUID(), tripId: newTripId, dayId: newDayId, placeId: newPlaceId, orderIndex: assignment.orderIndex, placeTime: assignment.placeTime, endTime: assignment.endTime, durationMinutes: assignment.durationMinutes, notes: assignment.notes });
      }
    }

    const newTrip = await db.query.trips.findFirst({ where: (t, { eq: e }) => e(t.id, newTripId) });
    res.status(201).json({ success: true, trip: { ...formatTrip(newTrip!), myRole: 'owner' } });
  } catch (err) { next(err); }
});

// ─── TRIP MEMBERS ──────────────────────────────────────────────────

// GET /:tripId/members
router.get('/:tripId/members', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role) throw new AppError('Trip not found', 404);

    const members = await db.query.tripMembers.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
    });

    const enriched = await Promise.all(
      members.map(async (m) => {
        const user = await db.query.users.findFirst({ where: (t, { eq: e }) => e(t.id, m.userId) });
        return {
          userId: m.userId,
          role: m.role,
          username: user?.username,
          avatarUrl: getPublicUrl(user?.avatarKey ?? null),
          joinedAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : new Date((m.createdAt as number) * 1000).toISOString(),
        };
      }),
    );

    res.json({ success: true, members: enriched });
  } catch (err) { next(err); }
});

// POST /:tripId/members — add by username
router.post('/:tripId/members', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (role !== 'owner' && role !== 'editor') throw new AppError('Forbidden', 403);

    const { username, memberRole = 'viewer' } = req.body as { username: string; memberRole?: TripRole };

    const targetUser = await db.query.users.findFirst({ where: (t, { eq: e }) => e(t.username, username) });
    if (!targetUser) throw new AppError('User not found', 404);

    const existing = await getMemberRole(tripId, targetUser.id);
    if (existing) throw new AppError('User is already a member', 409);

    await db.insert(tripMembers).values({
      tripId,
      userId: targetUser.id,
      role: memberRole as TripRole,
      invitedBy: userId,
      createdAt: new Date(),
    });

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'member:added', { userId: targetUser.id, username: targetUser.username, role: memberRole });

    // Notify invited user
    const [trip] = await db.select({ title: trips.title }).from(trips).where(eq(trips.id, tripId)).limit(1);
    const [actor] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId)).limit(1);
    createNotification({
      userId: targetUser.id,
      actorId: userId,
      type: 'trip_invite',
      title: `${actor?.username ?? 'Someone'} added you to trip "${trip?.title ?? 'a trip'}"`,
      resourceType: 'trip',
      resourceId: tripId,
    }).catch(() => {});

    res.status(201).json({ success: true, userId: targetUser.id, role: memberRole });
  } catch (err) { next(err); }
});

// PATCH /:tripId/members/:targetUserId — change role
router.patch('/:tripId/members/:targetUserId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const targetUserId = req.params.targetUserId as string;
    const userId = req.user!.id;

    if (userId === targetUserId) throw new AppError('Cannot change your own role', 400);

    const role = await getMemberRole(tripId, userId);
    if (role !== 'owner') throw new AppError('Forbidden', 403);

    const { memberRole } = req.body as { memberRole: TripRole };
    if (memberRole === 'owner') throw new AppError('Cannot promote to owner via this endpoint', 400);

    await db.update(tripMembers)
      .set({ role: memberRole })
      .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, targetUserId)));

    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /:tripId/members/:targetUserId — remove member
router.delete('/:tripId/members/:targetUserId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const targetUserId = req.params.targetUserId as string;
    const userId = req.user!.id;

    const myRole = await getMemberRole(tripId, userId);
    // Owner can remove anyone; members can remove themselves
    if (myRole !== 'owner' && userId !== targetUserId) throw new AppError('Forbidden', 403);

    const targetRole = await getMemberRole(tripId, targetUserId);
    if (targetRole === 'owner') throw new AppError('Cannot remove the trip owner', 400);

    await db.delete(tripMembers)
      .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, targetUserId)));

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'member:removed', { userId: targetUserId });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── DAYS ──────────────────────────────────────────────────────────

// GET /:tripId/days
router.get('/:tripId/days', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role) throw new AppError('Trip not found', 404);

    const daysList = await db.query.days.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
      orderBy: (t) => asc(t.dayNumber),
    });

    const formatted = daysList.map((d) => ({
      id: d.id,
      tripId: d.tripId,
      dayNumber: d.dayNumber,
      date: d.date ? (d.date instanceof Date ? d.date.toISOString() : new Date((d.date as number) * 1000).toISOString()) : null,
      title: d.title,
      notes: d.notes,
    }));

    res.json({ success: true, days: formatted });
  } catch (err) { next(err); }
});

// POST /:tripId/days
router.post('/:tripId/days', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    const existingDays = await db.query.days.findMany({ where: (t, { eq: e }) => e(t.tripId, tripId) });
    const nextDayNumber = existingDays.length + 1;

    const { title, date, notes } = req.body as { title?: string; date?: string; notes?: string };
    const dayId = crypto.randomUUID();

    await db.insert(days).values({
      id: dayId,
      tripId,
      dayNumber: nextDayNumber,
      date: date ? new Date(date) : null,
      title: title?.trim() ?? `Day ${nextDayNumber}`,
      notes: notes?.trim() ?? null,
    });

    const day = await db.query.days.findFirst({ where: (t, { eq: e }) => e(t.id, dayId) });
    const formatted = {
      id: day!.id, tripId: day!.tripId, dayNumber: day!.dayNumber,
      date: day!.date ? (day!.date instanceof Date ? day!.date.toISOString() : new Date((day!.date as number) * 1000).toISOString()) : null,
      title: day!.title, notes: day!.notes,
    };

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'day:created', formatted);

    res.status(201).json({ success: true, day: formatted });
  } catch (err) { next(err); }
});

// PATCH /:tripId/days/:dayId
router.patch('/:tripId/days/:dayId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const dayId = req.params.dayId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    const { title, date, notes } = req.body as Record<string, string | undefined>;

    await db.update(days)
      .set({
        ...(title !== undefined && { title: title?.trim() }),
        ...(date !== undefined && { date: date ? new Date(date) : null }),
        ...(notes !== undefined && { notes: notes?.trim() ?? null }),
      })
      .where(and(eq(days.id, dayId), eq(days.tripId, tripId)));

    const day = await db.query.days.findFirst({ where: (t, { eq: e }) => e(t.id, dayId) });
    const formatted = {
      id: day!.id, tripId: day!.tripId, dayNumber: day!.dayNumber,
      date: day!.date ? (day!.date instanceof Date ? day!.date.toISOString() : new Date((day!.date as number) * 1000).toISOString()) : null,
      title: day!.title, notes: day!.notes,
    };

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'day:updated', formatted);

    res.json({ success: true, day: formatted });
  } catch (err) { next(err); }
});

// DELETE /:tripId/days/:dayId
router.delete('/:tripId/days/:dayId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const dayId = req.params.dayId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    await db.delete(dayAssignments).where(and(eq(dayAssignments.dayId, dayId), eq(dayAssignments.tripId, tripId)));
    await db.delete(dayNotes).where(eq(dayNotes.dayId, dayId));
    await db.delete(days).where(and(eq(days.id, dayId), eq(days.tripId, tripId)));

    // Renumber remaining days
    const remaining = await db.query.days.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
      orderBy: (t) => asc(t.dayNumber),
    });
    for (let i = 0; i < remaining.length; i++) {
      await db.update(days).set({ dayNumber: i + 1 }).where(eq(days.id, remaining[i].id));
    }

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'day:deleted', { dayId });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── PLACES ────────────────────────────────────────────────────────

// GET /:tripId/places
router.get('/:tripId/places', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role) throw new AppError('Trip not found', 404);

    const placesList = await db.query.places.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
      orderBy: (t) => desc(t.createdAt),
    });

    res.json({ success: true, places: placesList.map(formatPlace) });
  } catch (err) { next(err); }
});

// POST /:tripId/places
router.post('/:tripId/places', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    const { name, lat, lng, address, category, notes, price, website } = req.body as {
      name: string;
      lat?: number;
      lng?: number;
      address?: string;
      category?: string;
      notes?: string;
      price?: string;
      website?: string;
    };

    if (!name?.trim()) throw new AppError('Place name is required', 400);

    const placeId = crypto.randomUUID();
    await db.insert(places).values({
      id: placeId,
      tripId,
      name: name.trim(),
      lat: lat != null ? String(lat) : null,
      lng: lng != null ? String(lng) : null,
      address: address ?? null,
      categoryId: category ?? null,
      notes: notes ?? null,
      price: price ?? null,
      website: website ?? null,
      createdAt: new Date(),
    });

    const place = await db.query.places.findFirst({ where: (t, { eq: e }) => e(t.id, placeId) });
    const formatted = formatPlace(place!);

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'place:created', formatted);

    res.status(201).json({ success: true, place: formatted });
  } catch (err) { next(err); }
});

// PATCH /:tripId/places/:placeId
router.patch('/:tripId/places/:placeId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const placeId = req.params.placeId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    const updates = req.body as Record<string, unknown>;
    const setData: Partial<typeof places.$inferInsert> = {};

    if (updates.name !== undefined) setData.name = String(updates.name).trim();
    if (updates.lat !== undefined) setData.lat = updates.lat != null ? String(updates.lat) : null;
    if (updates.lng !== undefined) setData.lng = updates.lng != null ? String(updates.lng) : null;
    if (updates.address !== undefined) setData.address = updates.address as string | null;
    if (updates.notes !== undefined) setData.notes = updates.notes as string | null;
    if (updates.category !== undefined) setData.categoryId = updates.category as string | null;

    await db.update(places).set(setData).where(and(eq(places.id, placeId), eq(places.tripId, tripId)));

    const place = await db.query.places.findFirst({ where: (t, { eq: e }) => e(t.id, placeId) });
    const formatted = formatPlace(place!);

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'place:updated', formatted);

    res.json({ success: true, place: formatted });
  } catch (err) { next(err); }
});

// DELETE /:tripId/places/:placeId
router.delete('/:tripId/places/:placeId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const placeId = req.params.placeId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    await db.delete(dayAssignments).where(and(eq(dayAssignments.placeId, placeId), eq(dayAssignments.tripId, tripId)));
    await db.delete(places).where(and(eq(places.id, placeId), eq(places.tripId, tripId)));

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'place:deleted', { placeId });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── ASSIGNMENTS ───────────────────────────────────────────────────

// GET /:tripId/assignments
router.get('/:tripId/assignments', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role) throw new AppError('Trip not found', 404);

    const assignments = await db.query.dayAssignments.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
      orderBy: (t) => [asc(t.dayId), asc(t.orderIndex)],
    });

    res.json({ success: true, assignments });
  } catch (err) { next(err); }
});

// POST /:tripId/assignments
router.post('/:tripId/assignments', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    const { dayId, placeId, orderIndex = 0, placeTime, durationMinutes, notes } = req.body as {
      dayId: string;
      placeId: string;
      orderIndex?: number;
      placeTime?: string;
      durationMinutes?: number;
      notes?: string;
    };

    if (!dayId || !placeId) throw new AppError('dayId and placeId are required', 400);

    const assignId = crypto.randomUUID();
    await db.insert(dayAssignments).values({
      id: assignId,
      tripId,
      dayId,
      placeId,
      orderIndex,
      placeTime: placeTime ?? null,
      durationMinutes: durationMinutes ?? null,
      notes: notes ?? null,
    });

    const assignment = await db.query.dayAssignments.findFirst({ where: (t, { eq: e }) => e(t.id, assignId) });

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'assignment:created', assignment);

    res.status(201).json({ success: true, assignment });
  } catch (err) { next(err); }
});

// PATCH /:tripId/assignments/:assignId
router.patch('/:tripId/assignments/:assignId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const assignId = req.params.assignId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    const updates = req.body as Record<string, unknown>;
    const setData: Partial<typeof dayAssignments.$inferInsert> = {};

    if (updates.orderIndex !== undefined) setData.orderIndex = Number(updates.orderIndex);
    if (updates.placeTime !== undefined) setData.placeTime = updates.placeTime as string | null;
    if (updates.endTime !== undefined) setData.endTime = updates.endTime as string | null;
    if (updates.durationMinutes !== undefined) setData.durationMinutes = updates.durationMinutes != null ? Number(updates.durationMinutes) : null;
    if (updates.notes !== undefined) setData.notes = updates.notes as string | null;

    await db.update(dayAssignments).set(setData).where(and(eq(dayAssignments.id, assignId), eq(dayAssignments.tripId, tripId)));

    const assignment = await db.query.dayAssignments.findFirst({ where: (t, { eq: e }) => e(t.id, assignId) });

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'assignment:updated', assignment);

    res.json({ success: true, assignment });
  } catch (err) { next(err); }
});

// PATCH /:tripId/assignments/:assignId/move — move to different day
router.patch('/:tripId/assignments/:assignId/move', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const assignId = req.params.assignId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    const { targetDayId, orderIndex = 0 } = req.body as { targetDayId: string; orderIndex?: number };
    if (!targetDayId) throw new AppError('targetDayId is required', 400);

    await db.update(dayAssignments)
      .set({ dayId: targetDayId, orderIndex })
      .where(and(eq(dayAssignments.id, assignId), eq(dayAssignments.tripId, tripId)));

    const assignment = await db.query.dayAssignments.findFirst({ where: (t, { eq: e }) => e(t.id, assignId) });

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'assignment:updated', assignment);

    res.json({ success: true, assignment });
  } catch (err) { next(err); }
});

// DELETE /:tripId/assignments/:assignId
router.delete('/:tripId/assignments/:assignId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const assignId = req.params.assignId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    await db.delete(dayAssignments).where(and(eq(dayAssignments.id, assignId), eq(dayAssignments.tripId, tripId)));

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'assignment:deleted', { assignmentId: assignId });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── DAY NOTES ─────────────────────────────────────────────────────

// GET /:tripId/days/:dayId/notes
router.get('/:tripId/days/:dayId/notes', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const dayId = req.params.dayId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role) throw new AppError('Trip not found', 404);

    const notes = await db.query.dayNotes.findMany({
      where: (t, { eq: e }) => e(t.dayId, dayId),
      orderBy: (t) => asc(t.sortOrder),
    });

    res.json({ success: true, notes });
  } catch (err) { next(err); }
});

// POST /:tripId/days/:dayId/notes
router.post('/:tripId/days/:dayId/notes', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const dayId = req.params.dayId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    const { text, time, icon } = req.body as { text: string; time?: string; icon?: string };
    if (!text?.trim()) throw new AppError('Note text is required', 400);

    const existing = await db.query.dayNotes.findMany({ where: (t, { eq: e }) => e(t.dayId, dayId) });
    const noteId = crypto.randomUUID();

    await db.insert(dayNotes).values({
      id: noteId,
      dayId,
      text: text.trim(),
      time: time ?? null,
      icon: icon ?? null,
      sortOrder: existing.length,
    });

    const note = await db.query.dayNotes.findFirst({ where: (t, { eq: e }) => e(t.id, noteId) });

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'note:created', note);

    res.status(201).json({ success: true, note });
  } catch (err) { next(err); }
});

// PATCH /:tripId/days/:dayId/notes/:noteId
router.patch('/:tripId/days/:dayId/notes/:noteId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const dayId = req.params.dayId as string;
    const noteId = req.params.noteId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    const { text, time, icon } = req.body as Record<string, string | undefined>;

    await db.update(dayNotes)
      .set({
        ...(text !== undefined && { text: text.trim() }),
        ...(time !== undefined && { time }),
        ...(icon !== undefined && { icon }),
      })
      .where(and(eq(dayNotes.id, noteId), eq(dayNotes.dayId, dayId)));

    const note = await db.query.dayNotes.findFirst({ where: (t, { eq: e }) => e(t.id, noteId) });

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'note:updated', note);

    res.json({ success: true, note });
  } catch (err) { next(err); }
});

// DELETE /:tripId/days/:dayId/notes/:noteId
router.delete('/:tripId/days/:dayId/notes/:noteId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const dayId = req.params.dayId as string;
    const noteId = req.params.noteId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role || role === 'viewer') throw new AppError('Forbidden', 403);

    await db.delete(dayNotes).where(and(eq(dayNotes.id, noteId), eq(dayNotes.dayId, dayId)));

    const wsManager = getWsManager();
    wsManager.broadcast(`trip:${tripId}`, 'note:deleted', { noteId });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── SHARE ─────────────────────────────────────────────────────────

// POST /:tripId/share — generate share token
router.post('/:tripId/share', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;

    const role = await getMemberRole(tripId, userId);
    if (!role) throw new AppError('Trip not found', 404);

    const shareToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.update(trips)
      .set({ shareToken, shareTokenExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(trips.id, tripId));

    res.json({ success: true, shareToken, expiresAt: expiresAt.toISOString() });
  } catch (err) { next(err); }
});

// GET /shared/:token — public read-only view
router.get('/shared/:token', async (req, res, next) => {
  try {
    const { token } = req.params as { token: string };

    const trip = await db.query.trips.findFirst({
      where: (t, { eq: e }) => e(t.shareToken, token),
    });

    if (!trip || !trip.shareToken) throw new AppError('Share link not found', 404);

    if (trip.shareTokenExpiresAt && new Date(trip.shareTokenExpiresAt) < new Date()) {
      throw new AppError('Share link has expired', 410);
    }

    const daysList = await db.query.days.findMany({
      where: (t, { eq: e }) => e(t.tripId, trip.id),
      orderBy: (t) => asc(t.dayNumber),
    });

    const placesList = await db.query.places.findMany({
      where: (t, { eq: e }) => e(t.tripId, trip.id),
    });

    const assignments = await db.query.dayAssignments.findMany({
      where: (t, { eq: e }) => e(t.tripId, trip.id),
      orderBy: (t) => [asc(t.dayId), asc(t.orderIndex)],
    });

    res.json({
      success: true,
      trip: formatTrip(trip),
      days: daysList.map((d) => ({
        id: d.id, dayNumber: d.dayNumber, title: d.title, notes: d.notes,
        date: d.date ? (d.date instanceof Date ? d.date.toISOString() : new Date((d.date as number) * 1000).toISOString()) : null,
      })),
      places: placesList.map(formatPlace),
      assignments,
    });
  } catch (err) { next(err); }
});

// ─── ICS EXPORT ────────────────────────────────────────────────────

router.get('/:tripId/export/ics', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role) throw new AppError('Trip not found', 404);

    const trip = await db.query.trips.findFirst({ where: (t, { eq: e }) => e(t.id, tripId) });
    if (!trip) throw new AppError('Trip not found', 404);

    const daysList = await db.query.days.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
      orderBy: (t) => asc(t.dayNumber),
    });
    const assignments = await db.query.dayAssignments.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
    });
    const placesList = await db.query.places.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
    });
    const resRows = await db.select().from(reservations).where(eq(reservations.tripId, String(tripId)));

    const placeMap = new Map(placesList.map((p) => [p.id, p]));

    const cal = ical({ name: trip.title, prodId: '//Roamera//Trip Planner//EN' });

    for (const assign of assignments) {
      const day = daysList.find((d) => d.id === assign.dayId);
      const place = placeMap.get(assign.placeId);
      if (!day || !place) continue;

      const baseDate = day.date
        ? (day.date instanceof Date ? day.date : new Date((day.date as number) * 1000))
        : (trip.dateFrom ? (trip.dateFrom instanceof Date ? trip.dateFrom : new Date((trip.dateFrom as number) * 1000)) : new Date());

      const [startHH = '10', startMM = '00'] = (assign.placeTime ?? '10:00').split(':');
      const dtStart = new Date(baseDate);
      dtStart.setHours(parseInt(startHH, 10), parseInt(startMM, 10), 0, 0);
      const dtEnd = new Date(dtStart.getTime() + (assign.durationMinutes ?? 60) * 60 * 1000);

      cal.createEvent({
        id: `${assign.id}@roamera.in`,
        start: dtStart,
        end: dtEnd,
        summary: place.name,
        description: assign.notes ?? undefined,
        location: place.address ?? undefined,
        status: 'CONFIRMED' as any,
      });
    }

    for (const res_ of resRows) {
      if (!res_.startTime) continue;
      const day = daysList.find((d) => d.id === res_.dayId);
      if (!day) continue;
      const baseDate = day.date
        ? (day.date instanceof Date ? day.date : new Date((day.date as number) * 1000))
        : new Date();
      const [sh = '09', sm = '00'] = res_.startTime.split(':');
      const start = new Date(baseDate);
      start.setHours(parseInt(sh, 10), parseInt(sm, 10), 0, 0);
      const end = res_.endTime ? (() => {
        const [eh = '10', em = '00'] = res_.endTime!.split(':');
        const d = new Date(baseDate);
        d.setHours(parseInt(eh, 10), parseInt(em, 10), 0, 0);
        return d;
      })() : new Date(start.getTime() + 60 * 60 * 1000);

      cal.createEvent({
        id: `res-${res_.id}@roamera.in`,
        start,
        end,
        summary: `[${res_.type.toUpperCase()}] ${res_.name ?? res_.type}`,
        description: res_.notes ?? undefined,
        status: 'CONFIRMED' as any,
      });
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${trip.title.replace(/[^\w]/g, '_')}.ics"`);
    res.send(cal.toString());
  } catch (err) { next(err); }
});

// ─── PDF EXPORT ────────────────────────────────────────────────────

router.get('/:tripId/export/pdf', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role) throw new AppError('Trip not found', 404);

    const trip = await db.query.trips.findFirst({ where: (t, { eq: e }) => e(t.id, tripId) });
    if (!trip) throw new AppError('Trip not found', 404);

    const daysList = await db.query.days.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
      orderBy: (t) => asc(t.dayNumber),
    });
    const placesList = await db.query.places.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
    });
    const resRows = await db.select().from(reservations).where(eq(reservations.tripId, String(tripId)));
    const assignments = await db.query.dayAssignments.findMany({
      where: (t, { eq: e }) => e(t.tripId, tripId),
    });

    const placeMap = new Map(placesList.map((p) => [p.id, p]));
    const assignByDay = new Map<string, typeof assignments>();
    for (const a of assignments) {
      if (!assignByDay.has(a.dayId)) assignByDay.set(a.dayId, []);
      assignByDay.get(a.dayId)!.push(a);
    }
    const resByDay = new Map<string, typeof resRows>();
    for (const r of resRows) {
      if (!r.dayId) continue;
      if (!resByDay.has(r.dayId)) resByDay.set(r.dayId, []);
      resByDay.get(r.dayId)!.push(r);
    }

    const formatDate = (d: Date | number | null): string => {
      if (!d) return '';
      const date = d instanceof Date ? d : new Date((d as number) * 1000);
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const content: any[] = [
      { text: trip.title, style: 'header' },
      {
        text: [
          trip.dateFrom ? formatDate(trip.dateFrom as any) : '',
          trip.dateTo ? ` → ${formatDate(trip.dateTo as any)}` : '',
        ].join(''),
        style: 'subheader',
        margin: [0, 4, 0, 16],
      },
    ];

    for (const day of daysList) {
      const dayAssigns = (assignByDay.get(day.id) ?? []).sort((a, b) => a.orderIndex - b.orderIndex);
      const dayRes = resByDay.get(day.id) ?? [];

      content.push({ text: `Day ${day.dayNumber}${day.title ? ` — ${day.title}` : ''}`, style: 'dayHeader', margin: [0, 12, 0, 4] });

      if (dayAssigns.length > 0) {
        content.push({ text: 'Places', style: 'sectionLabel', margin: [0, 4, 0, 2] });
        for (const a of dayAssigns) {
          const place = placeMap.get(a.placeId);
          if (!place) continue;
          content.push({
            text: `• ${place.name}${a.placeTime ? ` (${a.placeTime})` : ''}${place.address ? ` — ${place.address}` : ''}`,
            margin: [8, 2, 0, 0],
          });
          if (a.notes) content.push({ text: `  ${a.notes}`, style: 'note', margin: [16, 0, 0, 4] });
        }
      }

      if (dayRes.length > 0) {
        content.push({ text: 'Reservations', style: 'sectionLabel', margin: [0, 4, 0, 2] });
        for (const r of dayRes) {
          content.push({
            text: `• [${r.type.toUpperCase()}] ${r.name ?? r.type}${r.startTime ? ` at ${r.startTime}` : ''}${r.confirmation ? ` (Ref: ${r.confirmation})` : ''}`,
            margin: [8, 2, 0, 0],
          });
          if (r.notes) content.push({ text: `  ${r.notes}`, style: 'note', margin: [16, 0, 0, 4] });
        }
      }
    }

    const docDefinition = {
      content,
      defaultStyle: { fontSize: 11, font: 'Helvetica' },
      styles: {
        header: { fontSize: 22, bold: true, color: '#0D9488' },
        subheader: { fontSize: 13, color: '#555' },
        dayHeader: { fontSize: 15, bold: true, color: '#0D9488' },
        sectionLabel: { fontSize: 12, bold: true, color: '#333' },
        note: { fontSize: 10, color: '#666', italics: true },
      },
    };

    const pdfDoc = pdfmakeLib.createPdf(docDefinition as any);
    const buffer: Buffer = await pdfDoc.getBuffer();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${trip.title.replace(/[^\w]/g, '_')}.pdf"`);
    res.send(buffer);
  } catch (err) { next(err); }
});

// ─── Reservations ──────────────────────────────────────────────────────────

router.get('/:tripId/reservations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = String(req.params.tripId);
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role) throw new AppError('Not a trip member', 403);
    const rows = await db.select().from(reservations)
      .where(eq(reservations.tripId, tripId))
      .orderBy(asc(reservations.startTime));
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/:tripId/reservations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = String(req.params.tripId);
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['editor']) throw new AppError('Forbidden', 403);
    const { type, name, dayId, placeId, startTime, endTime, confirmation, notes, status } = req.body;
    if (!type) throw new AppError('type is required', 400);
    const id = crypto.randomUUID();
    await db.insert(reservations).values({
      id, tripId: String(tripId), type, name: name ?? null, dayId: dayId ?? null, placeId: placeId ?? null,
      startTime: startTime ?? null, endTime: endTime ?? null,
      confirmation: confirmation ?? null, notes: notes ?? null,
      status: status ?? 'confirmed',
    } as any);
    const row = await db.select().from(reservations).where(eq(reservations.id, id));
    res.status(201).json(row[0]);
  } catch (err) { next(err); }
});

router.patch('/:tripId/reservations/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = String(req.params.tripId);
    const { id } = req.params;
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['editor']) throw new AppError('Forbidden', 403);
    const { type, name, dayId, placeId, startTime, endTime, confirmation, notes, status } = req.body;
    await db.update(reservations).set({
      ...(type !== undefined && { type }),
      ...(name !== undefined && { name }),
      ...(dayId !== undefined && { dayId }),
      ...(placeId !== undefined && { placeId }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(confirmation !== undefined && { confirmation }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status }),
    }).where(and(eq(reservations.id, String(id)), eq(reservations.tripId, tripId)));
    const row = await db.select().from(reservations).where(eq(reservations.id, String(id)));
    res.json(row[0] ?? null);
  } catch (err) { next(err); }
});

router.delete('/:tripId/reservations/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = String(req.params.tripId);
    const id = String(req.params.id);
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['editor']) throw new AppError('Forbidden', 403);
    await db.delete(reservations).where(and(eq(reservations.id, id), eq(reservations.tripId, tripId)));
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Accommodations ────────────────────────────────────────────────────────

router.get('/:tripId/accommodations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = String(req.params.tripId);
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role) throw new AppError('Not a trip member', 403);
    const rows = await db.select().from(accommodations).where(eq(accommodations.tripId, tripId));
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/:tripId/accommodations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = String(req.params.tripId);
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['editor']) throw new AppError('Forbidden', 403);
    const { placeId, checkinDayId, checkoutDayId, checkinTime, checkoutTime, confirmation, notes } = req.body;
    const id = crypto.randomUUID();
    await db.insert(accommodations).values({
      id, tripId: String(tripId),
      placeId: placeId ?? null,
      checkinDayId: checkinDayId ?? null,
      checkoutDayId: checkoutDayId ?? null,
      checkinTime: checkinTime ?? null,
      checkoutTime: checkoutTime ?? null,
      confirmation: confirmation ?? null,
      notes: notes ?? null,
    } as any);
    const row = await db.select().from(accommodations).where(eq(accommodations.id, id));
    res.status(201).json(row[0]);
  } catch (err) { next(err); }
});

router.patch('/:tripId/accommodations/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = String(req.params.tripId);
    const { id } = req.params;
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['editor']) throw new AppError('Forbidden', 403);
    const { placeId, checkinDayId, checkoutDayId, checkinTime, checkoutTime, confirmation, notes } = req.body;
    await db.update(accommodations).set({
      ...(placeId !== undefined && { placeId }),
      ...(checkinDayId !== undefined && { checkinDayId }),
      ...(checkoutDayId !== undefined && { checkoutDayId }),
      ...(checkinTime !== undefined && { checkinTime }),
      ...(checkoutTime !== undefined && { checkoutTime }),
      ...(confirmation !== undefined && { confirmation }),
      ...(notes !== undefined && { notes }),
    }).where(and(eq(accommodations.id, String(id)), eq(accommodations.tripId, tripId)));
    const row = await db.select().from(accommodations).where(eq(accommodations.id, String(id)));
    res.json(row[0] ?? null);
  } catch (err) { next(err); }
});

router.delete('/:tripId/accommodations/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = String(req.params.tripId);
    const id = String(req.params.id);
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['editor']) throw new AppError('Forbidden', 403);
    await db.delete(accommodations).where(and(eq(accommodations.id, id), eq(accommodations.tripId, tripId)));
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Offline Bundle ────────────────────────────────────────────────────────

router.get('/:tripId/bundle', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tripId = String(req.params.tripId);
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role) throw new AppError('Not a trip member', 403);

    const [tripRow] = await db.select().from(trips).where(eq(trips.id, tripId));
    if (!tripRow) throw new AppError('Trip not found', 404);

    const [daysRows, placesRows, membersRows, resRows, accomRows] = await Promise.all([
      db.select().from(days).where(eq(days.tripId, tripId)).orderBy(asc(days.dayNumber)),
      db.select().from(places).where(eq(places.tripId, tripId)),
      db.select().from(tripMembers).where(eq(tripMembers.tripId, tripId)),
      db.select().from(reservations).where(eq(reservations.tripId, tripId)),
      db.select().from(accommodations).where(eq(accommodations.tripId, tripId)),
    ]);

    res.json({
      trip: tripRow,
      days: daysRows,
      places: placesRows,
      members: membersRows,
      reservations: resRows,
      accommodations: accomRows,
      bundledAt: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

export default router;
