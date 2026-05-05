const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const upload = require('../lib/upload');
const { uploadDocs } = require('../lib/upload');

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseMeetway(m) {
  if (!m) return m;
  const tags      = Array.isArray(m.tags)      ? m.tags      : JSON.parse(m.tags      || '[]');
  const itinerary = Array.isArray(m.itinerary) ? m.itinerary : JSON.parse(m.itinerary || '[]');
  const documents = Array.isArray(m.documents) ? m.documents : JSON.parse(m.documents || '[]');
  return { ...m, tags, itinerary, documents };
}
// keep parseTags as an alias for backward compat
const parseTags = parseMeetway;

// Count approved participants
function spotsInfo(meetway) {
  const taken = meetway.participants
    ? meetway.participants.filter((p) => p.status === 'approved').length
    : meetway._count?.participants ?? 0;
  return { spotsTaken: taken, spotsLeft: Math.max(0, meetway.maxPeople - taken) };
}

const meetwaySelect = {
  id: true,
  title: true,
  destination: true,
  country: true,
  startDate: true,
  endDate: true,
  description: true,
  maxPeople: true,
  budgetMin: true,
  budgetMax: true,
  tags: true,
  privacy: true,
  coverTheme: true,
  coverPhoto: true,
  itinerary:  true,
  documents:  true,
  status: true,
  createdAt: true,
  host: { select: { id: true, username: true, avatar: true } },
  participants: {
    where: { status: 'approved' },
    select: {
      id: true,
      role: true,
      status: true,
      joinedAt: true,
      user: { select: { id: true, username: true, avatar: true } },
    },
  },
  _count: { select: { messages: true } },
};

// ── GET /api/meetways — Discover (public) ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { tag, budget, search, page = 1 } = req.query;
    const limit = 20;

    const where = { status: { not: 'closed' } };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { destination: { contains: search } },
      ];
    }
    if (tag && tag !== 'All') {
      where.tags = { contains: tag.toLowerCase() };
    }
    if (budget === 'budget') where.budgetMax = { lte: 500 };
    if (budget === 'mid') { where.budgetMin = { gte: 200 }; where.budgetMax = { lte: 1200 }; }
    if (budget === 'luxury') where.budgetMin = { gte: 1000 };

    const meetways = await prisma.meetway.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * limit,
      take: limit,
      select: meetwaySelect,
    });

    res.json(
      meetways.map((m) => ({ ...parseTags(m), ...spotsInfo(m) }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/meetways/:id — Detail ───────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const meetway = await prisma.meetway.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        ...meetwaySelect,
        participants: {
          select: {
            id: true, role: true, status: true, joinedAt: true,
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true, content: true, createdAt: true,
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    if (!meetway) return res.status(404).json({ error: 'Not found' });
    res.json({ ...parseTags(meetway), ...spotsInfo(meetway) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/meetways — Create ───────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const {
      title, destination, country, startDate, endDate,
      description, maxPeople, budgetMin, budgetMax,
      tags, privacy, coverTheme, itinerary,
    } = req.body;

    if (!title || !destination || !startDate || !endDate) {
      return res.status(400).json({ error: 'title, destination, startDate, endDate are required' });
    }

    const meetway = await prisma.meetway.create({
      data: {
        hostId: req.userId,
        title,
        destination,
        country: country || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description: description || null,
        maxPeople: parseInt(maxPeople) || 10,
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        privacy: privacy === 'private' ? 'private' : 'public',
        coverTheme: coverTheme || null,
        itinerary: itinerary ? JSON.stringify(Array.isArray(itinerary) ? itinerary : []) : '[]',
        // Auto-add host as approved participant
        participants: {
          create: {
            userId: req.userId,
            role: 'host',
            status: 'approved',
          },
        },
      },
      select: meetwaySelect,
    });

    res.status(201).json({ ...parseTags(meetway), ...spotsInfo(meetway) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/meetways/:id — Update (host only) ────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const meetway = await prisma.meetway.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!meetway) return res.status(404).json({ error: 'Not found' });
    if (meetway.hostId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const {
      title, destination, country, startDate, endDate,
      description, maxPeople, budgetMin, budgetMax,
      tags, privacy, coverTheme, status,
    } = req.body;

    const updated = await prisma.meetway.update({
      where: { id: meetway.id },
      data: {
        title: title ?? meetway.title,
        destination: destination ?? meetway.destination,
        country: country ?? meetway.country,
        startDate: startDate ? new Date(startDate) : meetway.startDate,
        endDate: endDate ? new Date(endDate) : meetway.endDate,
        description: description ?? meetway.description,
        maxPeople: maxPeople ? parseInt(maxPeople) : meetway.maxPeople,
        budgetMin: budgetMin !== undefined ? parseFloat(budgetMin) : meetway.budgetMin,
        budgetMax: budgetMax !== undefined ? parseFloat(budgetMax) : meetway.budgetMax,
        tags: tags ? JSON.stringify(Array.isArray(tags) ? tags : []) : meetway.tags,
        privacy: privacy ?? meetway.privacy,
        coverTheme: coverTheme ?? meetway.coverTheme,
        status: status ?? meetway.status,
      },
      select: meetwaySelect,
    });

    res.json({ ...parseTags(updated), ...spotsInfo(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/meetways/:id — Delete (host only) ─────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const meetway = await prisma.meetway.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!meetway) return res.status(404).json({ error: 'Not found' });
    if (meetway.hostId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    await prisma.meetway.delete({ where: { id: meetway.id } });
    res.json({ message: 'Meetway deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/meetways/:id/join — Join or Request ─────────────────────────────
router.post('/:id/join', auth, async (req, res) => {
  try {
    const meetway = await prisma.meetway.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        participants: { where: { status: 'approved' } },
      },
    });
    if (!meetway) return res.status(404).json({ error: 'Not found' });
    if (meetway.hostId === req.userId) {
      return res.status(400).json({ error: 'You are the host' });
    }

    // Check spot availability
    if (meetway.participants.length >= meetway.maxPeople) {
      return res.status(400).json({ error: 'No spots left' });
    }

    const existing = await prisma.meetwayParticipant.findUnique({
      where: { meetwayId_userId: { meetwayId: meetway.id, userId: req.userId } },
    });
    if (existing) {
      return res.status(400).json({
        error: 'Already joined or requested',
        status: existing.status,
      });
    }

    const isPublic = meetway.privacy === 'public';
    const participant = await prisma.meetwayParticipant.create({
      data: {
        meetwayId: meetway.id,
        userId: req.userId,
        role: 'member',
        status: isPublic ? 'approved' : 'pending',
      },
      select: {
        id: true, role: true, status: true,
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    res.json({ participant, message: isPublic ? 'Joined!' : 'Request sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/meetways/:id/leave — Leave ────────────────────────────────────
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    const existing = await prisma.meetwayParticipant.findUnique({
      where: {
        meetwayId_userId: {
          meetwayId: parseInt(req.params.id),
          userId: req.userId,
        },
      },
    });
    if (!existing) return res.status(404).json({ error: 'Not a participant' });

    await prisma.meetwayParticipant.delete({ where: { id: existing.id } });
    res.json({ message: 'Left meetway' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/meetways/:id/participants/:userId — Approve/Decline (host) ─────
router.patch('/:id/participants/:userId', auth, async (req, res) => {
  try {
    const meetway = await prisma.meetway.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!meetway) return res.status(404).json({ error: 'Not found' });
    if (meetway.hostId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const { status } = req.body; // "approved" | "declined"
    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or declined' });
    }

    const updated = await prisma.meetwayParticipant.update({
      where: {
        meetwayId_userId: {
          meetwayId: meetway.id,
          userId: parseInt(req.params.userId),
        },
      },
      data: { status },
      select: {
        id: true, role: true, status: true,
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/meetways/:id/messages — Chat ─────────────────────────────────────
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const meetwayId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = 30;

    // Only participants can read chat
    const membership = await prisma.meetwayParticipant.findUnique({
      where: { meetwayId_userId: { meetwayId, userId: req.userId } },
    });
    const isHost = (await prisma.meetway.findUnique({ where: { id: meetwayId }, select: { hostId: true } }))?.hostId === req.userId;

    if (!membership && !isHost) {
      return res.status(403).json({ error: 'Join the meetway to view chat' });
    }

    const messages = await prisma.meetwayMessage.findMany({
      where: { meetwayId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, content: true, createdAt: true,
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/meetways/:id/messages — Post message ───────────────────────────
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const meetwayId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message is empty' });

    const meetway = await prisma.meetway.findUnique({
      where: { id: meetwayId },
      select: { hostId: true },
    });
    if (!meetway) return res.status(404).json({ error: 'Not found' });

    const membership = await prisma.meetwayParticipant.findUnique({
      where: { meetwayId_userId: { meetwayId, userId: req.userId } },
    });
    if (!membership && meetway.hostId !== req.userId) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const message = await prisma.meetwayMessage.create({
      data: { meetwayId, userId: req.userId, content: content.trim() },
      select: {
        id: true, content: true, createdAt: true,
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/meetways/my/hosted — My hosted meetways ─────────────────────────
router.get('/my/hosted', auth, async (req, res) => {
  try {
    const meetways = await prisma.meetway.findMany({
      where: { hostId: req.userId },
      orderBy: { createdAt: 'desc' },
      select: meetwaySelect,
    });
    res.json(meetways.map((m) => ({ ...parseTags(m), ...spotsInfo(m) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/meetways/my/joined — My joined meetways ─────────────────────────
router.get('/my/joined', auth, async (req, res) => {
  try {
    const participants = await prisma.meetwayParticipant.findMany({
      where: { userId: req.userId, status: 'approved', role: 'member' },
      include: {
        meetway: { select: meetwaySelect },
      },
    });
    const meetways = participants.map((p) => ({
      ...parseTags(p.meetway),
      ...spotsInfo(p.meetway),
      myStatus: p.status,
    }));
    res.json(meetways);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/meetways/:id/cover — Upload cover photo (host only) ─────────────
router.post('/:id/cover', auth, upload.single('cover'), async (req, res) => {
  try {
    const meetway = await prisma.meetway.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!meetway) return res.status(404).json({ error: 'Not found' });
    if (meetway.hostId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const url = (req.file.path && req.file.path.startsWith('http'))
      ? req.file.path
      : `/uploads/${req.file.filename}`;
    const updated = await prisma.meetway.update({
      where: { id: meetway.id },
      data: { coverPhoto: url },
      select: meetwaySelect,
    });
    res.json(parseMeetway({ ...updated, ...spotsInfo(updated) }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/meetways/:id/documents — Upload documents (host only) ───────────
router.post('/:id/documents', auth, uploadDocs.array('documents', 10), async (req, res) => {
  try {
    const meetway = await prisma.meetway.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!meetway) return res.status(404).json({ error: 'Not found' });
    if (meetway.hostId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const existing = JSON.parse(meetway.documents || '[]');
    const newDocs  = req.files.map(f => ({
      name: f.originalname,
      url:  (f.path && f.path.startsWith('http')) ? f.path : `/uploads/${f.filename}`,
      type: f.mimetype,
      size: f.size,
    }));
    const merged = [...existing, ...newDocs];

    const updated = await prisma.meetway.update({
      where: { id: meetway.id },
      data:  { documents: JSON.stringify(merged) },
      select: meetwaySelect,
    });
    res.json(parseMeetway({ ...updated, ...spotsInfo(updated) }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
