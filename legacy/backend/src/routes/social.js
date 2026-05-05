const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// ── Helpers ────────────────────────────────────────────────

async function createNotif({ userId, actorId, type, journalId }) {
  // Don't notify yourself
  if (userId === actorId) return;
  await prisma.notification.create({ data: { userId, actorId, type, journalId: journalId ?? null } });
}

// ── Reactions ──────────────────────────────────────────────

router.post('/journals/:id/like', auth, async (req, res) => {
  const journalId = parseInt(req.params.id);
  const type = req.body.type || 'love';

  const existing = await prisma.like.findUnique({
    where: { userId_journalId_type: { userId: req.userId, journalId, type } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    // Remove from bucket list if un-reacting wanna_go
    if (type === 'wanna_go') {
      await prisma.bucketList.deleteMany({ where: { userId: req.userId, journalId } });
    }
    return res.json({ liked: false, type });
  }

  const journal = await prisma.journal.findUnique({ where: { id: journalId }, select: { userId: true, destination: true } });
  await prisma.like.create({ data: { userId: req.userId, journalId, type } });

  // Add to bucket list on wanna_go
  if (type === 'wanna_go' && journal) {
    await prisma.bucketList.upsert({
      where: { userId_journalId: { userId: req.userId, journalId } },
      create: { userId: req.userId, journalId, destination: journal.destination },
      update: {},
    });
  }

  if (journal) await createNotif({ userId: journal.userId, actorId: req.userId, type: `reaction_${type}`, journalId });

  res.json({ liked: true, type });
});

// ── Bucket List ────────────────────────────────────────────

router.get('/bucket-list', auth, async (req, res) => {
  const items = await prisma.bucketList.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      destination: true,
      createdAt: true,
      journal: {
        select: {
          id: true,
          title: true,
          photos: true,
          user: { select: { id: true, username: true, avatar: true } },
        },
      },
    },
  });
  res.json(items);
});

router.get('/journals/:id/likes', async (req, res) => {
  const journalId = parseInt(req.params.id);
  const likes = await prisma.like.findMany({
    where: { journalId },
    select: { user: { select: { id: true, username: true, avatar: true } }, type: true, createdAt: true },
  });
  res.json(likes);
});

// ── Comments ───────────────────────────────────────────────

router.post('/journals/:id/comments', auth, async (req, res) => {
  const journalId = parseInt(req.params.id);
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment cannot be empty' });
  }

  const journal = await prisma.journal.findUnique({ where: { id: journalId } });
  if (!journal) return res.status(404).json({ error: 'Journal not found' });

  const comment = await prisma.comment.create({
    data: { userId: req.userId, journalId, content: content.trim() },
    select: {
      id: true, content: true, createdAt: true,
      user: { select: { id: true, username: true, avatar: true } },
    },
  });

  await createNotif({ userId: journal.userId, actorId: req.userId, type: 'comment', journalId });

  res.status(201).json(comment);
});

router.delete('/comments/:id', auth, async (req, res) => {
  const comment = await prisma.comment.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!comment) return res.status(404).json({ error: 'Not found' });
  if (comment.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  await prisma.comment.delete({ where: { id: comment.id } });
  res.json({ message: 'Deleted' });
});

// ── Follow ─────────────────────────────────────────────────

router.post('/users/:id/follow', auth, async (req, res) => {
  const followingId = parseInt(req.params.id);

  if (followingId === req.userId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) return res.status(404).json({ error: 'User not found' });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.userId, followingId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return res.json({ following: false });
  }

  await prisma.follow.create({ data: { followerId: req.userId, followingId } });
  await createNotif({ userId: followingId, actorId: req.userId, type: 'follow' });

  res.json({ following: true });
});

// ── Notifications ──────────────────────────────────────────

router.get('/notifications', auth, async (req, res) => {
  const notifs = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true, type: true, read: true, createdAt: true,
      journalId: true, justsplitGroupId: true,
      actor: { select: { id: true, username: true, avatar: true } },
      journal: { select: { id: true, title: true, destination: true } },
      justsplitGroup: { select: { id: true, name: true } },
    },
  });
  res.json(notifs);
});

router.get('/notifications/unread-count', auth, async (req, res) => {
  const count = await prisma.notification.count({ where: { userId: req.userId, read: false } });
  res.json({ count });
});

router.put('/notifications/read', auth, async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.userId, read: false }, data: { read: true } });
  res.json({ ok: true });
});

module.exports = router;
