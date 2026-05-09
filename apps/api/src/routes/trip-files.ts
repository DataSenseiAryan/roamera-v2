import crypto from 'crypto';
import path from 'path';

import { Router } from 'express';
import multer from 'multer';
import { eq, and, isNull } from 'drizzle-orm';

import { db } from '../db/client';
import { tripFiles, tripMembers } from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { uploadFile, generateStorageKey, getPublicUrl, deleteFile } from '../lib/storage';
import { env } from '../lib/env';

const router = Router({ mergeParams: true });
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 }, storage: multer.memoryStorage() });

type TripRole = 'owner' | 'editor' | 'viewer';
const ROLE_LEVEL: Record<TripRole, number> = { owner: 3, editor: 2, viewer: 1 };

async function getMemberRole(tripId: string, userId: string): Promise<TripRole | null> {
  const member = await db.query.tripMembers.findFirst({
    where: (t, { and: a, eq: e }) => a(e(t.tripId, tripId), e(t.userId, userId)),
  });
  return (member?.role as TripRole) ?? null;
}

// GET /files — list non-trashed files for a trip
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { tripId } = req.params as { tripId: string };
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role) throw new AppError('Not a trip member', 403);

    const rows = await db.select().from(tripFiles)
      .where(and(eq(tripFiles.tripId, tripId), eq(tripFiles.isTrashed, false)));

    res.json(rows.map(f => ({
      ...f,
      downloadUrl: getPublicUrl(f.storageKey),
    })));
  } catch (err) { next(err); }
});

// POST /files — upload a file
router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    const { tripId } = req.params as { tripId: string };
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['editor']) throw new AppError('Forbidden', 403);
    if (!req.file) throw new AppError('No file uploaded', 400);

    const ext = path.extname(req.file.originalname).toLowerCase() || '.bin';
    const key = generateStorageKey(req.file.buffer, ext);
    await uploadFile(req.file.buffer, key, req.file.mimetype);

    const id = crypto.randomUUID();
    const { reservationId, placeId } = req.body;

    await db.insert(tripFiles).values({
      id,
      tripId,
      filename: req.file.originalname,
      storageKey: key,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      placeId: placeId ?? null,
      reservationId: reservationId ?? null,
      isStarred: false,
      isTrashed: false,
      createdBy: req.user!.id,
    });

    const [row] = await db.select().from(tripFiles).where(eq(tripFiles.id, id));
    res.status(201).json({ ...row, downloadUrl: getPublicUrl(key) });
  } catch (err) { next(err); }
});

// PATCH /files/:id — update (star toggle, rename)
router.patch('/:fileId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { tripId, fileId } = req.params as { tripId: string; fileId: string };
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['editor']) throw new AppError('Forbidden', 403);

    const { isStarred, filename } = req.body;
    await db.update(tripFiles).set({
      ...(isStarred !== undefined && { isStarred: Boolean(isStarred) }),
      ...(filename !== undefined && { filename }),
    }).where(and(eq(tripFiles.id, fileId), eq(tripFiles.tripId, tripId)));

    const [row] = await db.select().from(tripFiles).where(eq(tripFiles.id, fileId));
    res.json(row ?? null);
  } catch (err) { next(err); }
});

// DELETE /files/:id — soft trash
router.delete('/:fileId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { tripId, fileId } = req.params as { tripId: string; fileId: string };
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['editor']) throw new AppError('Forbidden', 403);

    await db.update(tripFiles).set({ isTrashed: true })
      .where(and(eq(tripFiles.id, fileId), eq(tripFiles.tripId, tripId)));
    res.status(204).end();
  } catch (err) { next(err); }
});

// DELETE /files/:id/permanent — hard delete
router.delete('/:fileId/permanent', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { tripId, fileId } = req.params as { tripId: string; fileId: string };
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['owner']) throw new AppError('Owner only', 403);

    const [file] = await db.select().from(tripFiles)
      .where(and(eq(tripFiles.id, fileId), eq(tripFiles.tripId, tripId)));
    if (!file) throw new AppError('File not found', 404);

    await deleteFile(file.storageKey);
    await db.delete(tripFiles).where(eq(tripFiles.id, fileId));
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /files/:id/download — presigned / local download URL
router.get('/:fileId/download', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { tripId, fileId } = req.params as { tripId: string; fileId: string };
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role) throw new AppError('Not a trip member', 403);

    const [file] = await db.select().from(tripFiles)
      .where(and(eq(tripFiles.id, fileId), eq(tripFiles.tripId, tripId)));
    if (!file) throw new AppError('File not found', 404);

    const url = getPublicUrl(file.storageKey);
    res.json({ url, filename: file.filename, mimeType: file.mimeType });
  } catch (err) { next(err); }
});

// POST /files/:id/share — generate / regenerate share token
router.post('/:fileId/share', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { tripId, fileId } = req.params as { tripId: string; fileId: string };
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['editor']) throw new AppError('Forbidden', 403);

    const shareToken = crypto.randomBytes(24).toString('hex');
    await db.update(tripFiles).set({ shareToken })
      .where(and(eq(tripFiles.id, fileId), eq(tripFiles.tripId, tripId)));

    const [file] = await db.select().from(tripFiles).where(eq(tripFiles.id, fileId));
    if (!file) throw new AppError('File not found', 404);

    const shareUrl = `${env.API_BASE_URL ?? 'http://localhost:3000'}/api/v1/files/shared/${shareToken}`;
    res.json({ shareToken, shareUrl, filename: file.filename });
  } catch (err) { next(err); }
});

// GET /files/shared/:token — public download by share token (no auth)
router.get('/shared/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const [file] = await db.select().from(tripFiles).where(eq(tripFiles.shareToken, token));
    if (!file || file.isTrashed) throw new AppError('File not found', 404);

    const url = getPublicUrl(file.storageKey);
    res.json({ url, filename: file.filename, mimeType: file.mimeType });
  } catch (err) { next(err); }
});

export default router;
