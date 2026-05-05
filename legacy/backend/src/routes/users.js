const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const upload = require('../lib/upload');

// These /me routes MUST be defined before /:id or Express matches 'me' as an ID

// Get current authenticated user
router.get('/me', auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      bio: true,
      createdAt: true,
      _count: { select: { journals: true, followers: true, following: true } },
    },
  });
  res.json(user);
});

// Update own profile
router.put('/me', auth, upload.single('avatar'), async (req, res) => {
  const { username, bio } = req.body;
  const data = {};
  if (username) data.username = username;
  if (bio !== undefined) data.bio = bio;
  if (req.file) data.avatar = req.file.path || `/uploads/${req.file.filename}`;

  const user = await prisma.user.update({
    where: { id: req.userId },
    data,
    select: { id: true, username: true, avatar: true, bio: true, createdAt: true },
  });
  res.json(user);
});

// Get user profile
router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id) },
    select: {
      id: true,
      username: true,
      avatar: true,
      bio: true,
      createdAt: true,
      _count: { select: { journals: true, followers: true, following: true } },
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Get user's journals
router.get('/:id/journals', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const journals = await prisma.journal.findMany({
    where: { userId: parseInt(req.params.id) },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      title: true,
      destination: true,
      startDate: true,
      endDate: true,
      photos: true,
      createdAt: true,
      _count: { select: { likes: true, comments: true } },
    },
  });
  res.json(journals.map((j) => ({ ...j, photos: JSON.parse(j.photos || '[]') })));
});

// Get user's followers
router.get('/:id/followers', async (req, res) => {
  const follows = await prisma.follow.findMany({
    where: { followingId: parseInt(req.params.id) },
    select: { follower: { select: { id: true, username: true, avatar: true } } },
  });
  res.json(follows.map((f) => f.follower));
});

// Get users that this user follows
router.get('/:id/following', async (req, res) => {
  const follows = await prisma.follow.findMany({
    where: { followerId: parseInt(req.params.id) },
    select: { following: { select: { id: true, username: true, avatar: true } } },
  });
  res.json(follows.map((f) => f.following));
});

module.exports = router;
