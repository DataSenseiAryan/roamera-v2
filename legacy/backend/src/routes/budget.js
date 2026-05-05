const router = require('express').Router({ mergeParams: true });
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

async function checkAccess(journalId, userId) {
  return prisma.journal.findUnique({ where: { id: journalId, userId } });
}

// GET /api/journals/:journalId/budget
router.get('/', auth, async (req, res) => {
  const journalId = parseInt(req.params.journalId);
  try {
    const journal = await prisma.journal.findUnique({ where: { id: journalId }, select: { budget: true, userId: true } });
    if (!journal) return res.status(404).json({ error: 'Journal not found' });

    const entries = await prisma.budgetEntry.findMany({
      where: { journalId },
      include: { user: { select: { id: true, username: true, avatar: true } } },
      orderBy: { date: 'desc' },
    });

    const totalSpent = entries.reduce((s, e) => s + e.amount, 0);
    const byCategory = entries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    res.json({ entries, totalSpent, totalBudget: journal.budget, currency: 'INR', byCategory });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/journals/:journalId/budget
router.post('/', auth, async (req, res) => {
  const journalId = parseInt(req.params.journalId);
  try {
    const access = await checkAccess(journalId, req.userId);
    if (!access) return res.status(403).json({ error: 'No edit access' });

    const { title, amount, category, date, notes } = req.body;
    if (!title || !amount) return res.status(400).json({ error: 'title and amount required' });

    const entry = await prisma.budgetEntry.create({
      data: {
        journalId,
        userId: req.userId,
        title,
        amount: parseFloat(amount),
        category: category || 'other',
        date: date ? new Date(date) : new Date(),
        notes,
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    res.status(201).json(entry);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/journals/:journalId/budget/:entryId
router.put('/:entryId', auth, async (req, res) => {
  const journalId = parseInt(req.params.journalId);
  try {
    const access = await checkAccess(journalId, req.userId);
    if (!access) return res.status(403).json({ error: 'No edit access' });

    const { title, amount, category, date, notes } = req.body;
    const entry = await prisma.budgetEntry.update({
      where: { id: parseInt(req.params.entryId) },
      data: {
        ...(title && { title }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(category && { category }),
        ...(date && { date: new Date(date) }),
        ...(notes !== undefined && { notes }),
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    res.json(entry);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/journals/:journalId/budget/:entryId
router.delete('/:entryId', auth, async (req, res) => {
  const journalId = parseInt(req.params.journalId);
  try {
    const access = await checkAccess(journalId, req.userId);
    if (!access) return res.status(403).json({ error: 'No edit access' });

    await prisma.budgetEntry.delete({ where: { id: parseInt(req.params.entryId) } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
