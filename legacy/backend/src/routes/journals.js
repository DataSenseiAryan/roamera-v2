const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const upload = require('../lib/upload');

// Cloudinary returns file.path (full URL); local disk returns file.filename
function fileToUrl(file) {
  return file.path || `/uploads/${file.filename}`;
}

function parsePhotos(j) {
  if (!j) return j;
  const photos     = Array.isArray(j.photos)     ? j.photos     : JSON.parse(j.photos     || '[]');
  const itinerary  = Array.isArray(j.itinerary)  ? j.itinerary  : JSON.parse(j.itinerary  || '[]');
  return { ...j, photos, itinerary };
}

const journalSelect = {
  id: true,
  title: true,
  destination: true,
  startDate: true,
  endDate: true,
  activities: true,
  accommodation: true,
  budget: true,
  photos: true,
  itinerary: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, username: true, avatar: true } },
  _count: { select: { likes: true, comments: true } },
};

// Public feed
router.get('/feed', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const journals = await prisma.journal.findMany({
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    select: journalSelect,
  });
  res.json(journals.map(parsePhotos));
});

// Following feed
router.get('/feed/following', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;

  const follows = await prisma.follow.findMany({
    where: { followerId: req.userId },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);

  const journals = await prisma.journal.findMany({
    where: { userId: { in: followingIds } },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    select: journalSelect,
  });
  res.json(journals.map(parsePhotos));
});

// Get single journal
router.get('/:id', async (req, res) => {
  const journal = await prisma.journal.findUnique({
    where: { id: parseInt(req.params.id) },
    select: {
      ...journalSelect,
      comments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { id: true, username: true, avatar: true } },
        },
      },
    },
  });
  if (!journal) return res.status(404).json({ error: 'Not found' });
  res.json(parsePhotos(journal));
});

// Create journal
router.post('/', auth, upload.array('photos', 10), async (req, res) => {
  const { title, destination, startDate, endDate, activities, accommodation, budget, content, itinerary } = req.body;

  if (!title || !destination || !startDate || !endDate) {
    return res.status(400).json({ error: 'title, destination, startDate and endDate are required' });
  }

  const photos = (req.files || []).map(fileToUrl);

  const journal = await prisma.journal.create({
    data: {
      userId: req.userId,
      title,
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      activities: activities || null,
      accommodation: accommodation || null,
      budget: budget ? parseFloat(budget) : null,
      photos: JSON.stringify(photos),
      itinerary: itinerary || '[]',
      content: content || null,
    },
    select: journalSelect,
  });
  res.status(201).json(parsePhotos(journal));
});

// Update journal
router.put('/:id', auth, upload.array('photos', 10), async (req, res) => {
  const journal = await prisma.journal.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!journal) return res.status(404).json({ error: 'Not found' });
  if (journal.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  const { title, destination, startDate, endDate, activities, accommodation, budget, content, itinerary, keepPhotos } = req.body;
  const newPhotos = (req.files || []).map(fileToUrl);

  let existingPhotos = [];
  try {
    existingPhotos = keepPhotos ? JSON.parse(keepPhotos) : JSON.parse(journal.photos || '[]');
  } catch {
    existingPhotos = journal.photos;
  }

  const updated = await prisma.journal.update({
    where: { id: journal.id },
    data: {
      title: title ?? journal.title,
      destination: destination ?? journal.destination,
      startDate: startDate ? new Date(startDate) : journal.startDate,
      endDate: endDate ? new Date(endDate) : journal.endDate,
      activities: activities ?? journal.activities,
      accommodation: accommodation ?? journal.accommodation,
      budget: budget !== undefined ? parseFloat(budget) : journal.budget,
      photos: JSON.stringify([...existingPhotos, ...newPhotos]),
      itinerary: itinerary ?? journal.itinerary,
      content: content ?? journal.content,
    },
    select: journalSelect,
  });
  res.json(parsePhotos(updated));
});

// Delete journal
router.delete('/:id', auth, async (req, res) => {
  const journal = await prisma.journal.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!journal) return res.status(404).json({ error: 'Not found' });
  if (journal.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  await prisma.journal.delete({ where: { id: journal.id } });
  res.json({ message: 'Deleted' });
});

module.exports = router;
