const router = require('express').Router({ mergeParams: true });
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const TEMPLATES = {
  beach: [
    { name: 'Sunscreen SPF 50+', category: 'toiletries', essential: true },
    { name: 'Swimsuit (x2)', category: 'clothing', essential: true },
    { name: 'Beach Towel', category: 'general', essential: true },
    { name: 'Flip Flops', category: 'clothing', essential: true },
    { name: 'Sunglasses', category: 'general', essential: true },
    { name: 'Hat / Sun Cap', category: 'clothing', essential: false },
    { name: 'Snorkel Mask', category: 'general', essential: false },
    { name: 'Waterproof Phone Case', category: 'electronics', essential: false },
    { name: 'Aloe Vera Gel', category: 'toiletries', essential: false },
    { name: 'Light Summer Dress/Shorts', category: 'clothing', essential: true },
  ],
  mountain: [
    { name: 'Waterproof Hiking Boots', category: 'clothing', essential: true },
    { name: 'Thermal Underwear', category: 'clothing', essential: true },
    { name: 'Fleece Jacket', category: 'clothing', essential: true },
    { name: 'Rain Jacket', category: 'clothing', essential: true },
    { name: 'Trekking Poles', category: 'general', essential: false },
    { name: 'First Aid Kit', category: 'health', essential: true },
    { name: 'Headlamp + Batteries', category: 'electronics', essential: true },
    { name: 'Trail Map / GPS', category: 'electronics', essential: true },
    { name: 'Energy Bars', category: 'general', essential: true },
    { name: 'Altitude Sickness Pills', category: 'health', essential: false },
  ],
  city: [
    { name: 'Comfortable Walking Shoes', category: 'clothing', essential: true },
    { name: 'City Map / Offline Maps', category: 'electronics', essential: true },
    { name: 'Day Backpack', category: 'general', essential: true },
    { name: 'Umbrella', category: 'general', essential: false },
    { name: 'Smart Casual Outfit', category: 'clothing', essential: true },
    { name: 'Power Bank', category: 'electronics', essential: true },
    { name: 'Travel Card / Wallet', category: 'documents', essential: true },
    { name: 'Guidebook / Travel App', category: 'electronics', essential: false },
    { name: 'Noise-Cancelling Headphones', category: 'electronics', essential: false },
    { name: 'Universal Adapter', category: 'electronics', essential: true },
  ],
  general: [
    { name: 'Passport', category: 'documents', essential: true },
    { name: 'Travel Insurance Documents', category: 'documents', essential: true },
    { name: 'Phone Charger', category: 'electronics', essential: true },
    { name: 'Medications (prescription)', category: 'health', essential: true },
    { name: 'Toothbrush & Toothpaste', category: 'toiletries', essential: true },
    { name: 'Deodorant', category: 'toiletries', essential: true },
    { name: 'T-Shirts (x3)', category: 'clothing', essential: true },
    { name: 'Underwear (x5)', category: 'clothing', essential: true },
    { name: 'Socks (x5)', category: 'clothing', essential: true },
    { name: 'Pants / Jeans (x2)', category: 'clothing', essential: true },
    { name: 'Credit Card / Cash', category: 'documents', essential: true },
    { name: 'Hand Sanitizer', category: 'health', essential: false },
  ],
};

async function checkAccess(journalId, userId) {
  return prisma.journal.findUnique({ where: { id: journalId, userId } });
}

// GET /api/journals/:journalId/packing/templates
router.get('/templates', auth, (req, res) => {
  res.json(Object.entries(TEMPLATES).map(([type, items]) => ({ type, items })));
});

// GET /api/journals/:journalId/packing
router.get('/', auth, async (req, res) => {
  const journalId = parseInt(req.params.journalId);
  try {
    const journal = await prisma.journal.findUnique({ where: { id: journalId } });
    if (!journal) return res.status(404).json({ error: 'Journal not found' });

    const lists = await prisma.packingList.findMany({
      where: { journalId },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });
    res.json(lists);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/journals/:journalId/packing
router.post('/', auth, async (req, res) => {
  const journalId = parseInt(req.params.journalId);
  try {
    const access = await checkAccess(journalId, req.userId);
    if (!access) return res.status(403).json({ error: 'No edit access' });

    const { name, template } = req.body;
    const list = await prisma.packingList.create({
      data: { journalId, name: name || 'Packing List' },
    });

    if (template && TEMPLATES[template]) {
      await prisma.packingItem.createMany({
        data: TEMPLATES[template].map((item, i) => ({ ...item, packingListId: list.id, orderIndex: i })),
      });
    }

    const full = await prisma.packingList.findUnique({
      where: { id: list.id },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });
    res.status(201).json(full);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/journals/:journalId/packing/:listId/items
router.post('/:listId/items', auth, async (req, res) => {
  const journalId = parseInt(req.params.journalId);
  try {
    const access = await checkAccess(journalId, req.userId);
    if (!access) return res.status(403).json({ error: 'No edit access' });

    const { name, category, quantity, essential, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    const count = await prisma.packingItem.count({ where: { packingListId: parseInt(req.params.listId) } });
    const item = await prisma.packingItem.create({
      data: {
        packingListId: parseInt(req.params.listId),
        name,
        category: category || 'general',
        quantity: quantity ? parseInt(quantity) : 1,
        essential: !!essential,
        notes,
        orderIndex: count,
      },
    });
    res.status(201).json(item);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/journals/:journalId/packing/:listId/items/:itemId/toggle
router.patch('/:listId/items/:itemId/toggle', auth, async (req, res) => {
  try {
    const current = await prisma.packingItem.findUnique({ where: { id: parseInt(req.params.itemId) } });
    const item = await prisma.packingItem.update({
      where: { id: parseInt(req.params.itemId) },
      data: { packed: !current.packed },
    });
    res.json(item);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/journals/:journalId/packing/:listId/items/:itemId
router.delete('/:listId/items/:itemId', auth, async (req, res) => {
  const journalId = parseInt(req.params.journalId);
  try {
    const access = await checkAccess(journalId, req.userId);
    if (!access) return res.status(403).json({ error: 'No edit access' });

    await prisma.packingItem.delete({ where: { id: parseInt(req.params.itemId) } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/journals/:journalId/packing/:listId
router.delete('/:listId', auth, async (req, res) => {
  const journalId = parseInt(req.params.journalId);
  try {
    const access = await checkAccess(journalId, req.userId);
    if (!access) return res.status(403).json({ error: 'No edit access' });

    await prisma.packingList.delete({ where: { id: parseInt(req.params.listId) } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
