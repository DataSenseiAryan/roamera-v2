const router = require('express').Router();
const prisma = require('../lib/prisma');

router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ journals: [], users: [] });

  const [journals, users] = await Promise.all([
    prisma.journal.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { destination: { contains: q } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        destination: true,
        startDate: true,
        endDate: true,
        photos: true,
        _count: { select: { likes: true, comments: true } },
        user: { select: { id: true, username: true, avatar: true } },
      },
    }),
    prisma.user.findMany({
      where: { username: { contains: q } },
      take: 10,
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        _count: { select: { journals: true, followers: true } },
      },
    }),
  ]);

  res.json({
    journals: journals.map((j) => ({ ...j, photos: JSON.parse(j.photos || '[]') })),
    users,
  });
});

module.exports = router;
