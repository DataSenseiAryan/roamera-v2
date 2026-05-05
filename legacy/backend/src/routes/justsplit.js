const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeBalances(members, expenses, settlements) {
  const net = {};
  members.forEach((m) => { net[m.id] = 0; });

  expenses.forEach((exp) => {
    net[exp.paidByMemberId] += exp.amount;
    exp.splits.forEach((s) => { net[s.memberId] -= s.shareAmount; });
  });

  settlements.forEach((s) => {
    net[s.fromMemberId] += s.amount;
    net[s.toMemberId]   -= s.amount;
  });

  const debts = [];
  const creditors = members.filter((m) => net[m.id] > 0.005).map((m) => ({ ...m, amount: net[m.id] }));
  const debtors   = members.filter((m) => net[m.id] < -0.005).map((m) => ({ ...m, amount: -net[m.id] }));

  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const settle = Math.min(creditors[ci].amount, debtors[di].amount);
    debts.push({ from: debtors[di], to: creditors[ci], amount: Math.round(settle * 100) / 100 });
    creditors[ci].amount -= settle;
    debtors[di].amount   -= settle;
    if (creditors[ci].amount < 0.005) ci++;
    if (debtors[di].amount   < 0.005) di++;
  }

  return { net, debts };
}

async function assertMember(groupId, userId) {
  return prisma.justSplitMember.findFirst({ where: { groupId, userId } });
}

async function createNotif({ userId, actorId, type, justsplitGroupId }) {
  if (userId === actorId) return;
  await prisma.notification.create({
    data: { userId, actorId, type, justsplitGroupId: justsplitGroupId ?? null },
  });
}

// ── Groups ────────────────────────────────────────────────────────────────────

// GET /api/justsplit  — list groups I'm in
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await prisma.justSplitMember.findMany({
      where: { userId: req.userId },
      include: {
        group: {
          include: {
            members: true,
            _count: { select: { expenses: true } },
          },
        },
      },
    });
    res.json(memberships.map((m) => m.group));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/justsplit  — create group
router.post('/', auth, async (req, res) => {
  const { name, description, currency } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const me = await prisma.user.findUnique({ where: { id: req.userId }, select: { username: true } });
    const group = await prisma.justSplitGroup.create({
      data: {
        name, description, currency: currency || 'USD',
        createdById: req.userId,
        members: { create: { userId: req.userId, name: me.username } },
      },
      include: { members: true },
    });
    res.status(201).json(group);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/justsplit/:groupId — full detail for members, preview for non-members
router.get('/:groupId', auth, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    const member = await assertMember(groupId, req.userId);

    // Non-members get a lightweight preview so they can request to join
    if (!member) {
      const preview = await prisma.justSplitGroup.findUnique({
        where: { id: groupId },
        select: {
          id: true, name: true, description: true, currency: true, createdById: true,
          _count: { select: { members: true, expenses: true } },
          joinRequests: { where: { userId: req.userId }, select: { status: true } },
        },
      });
      if (!preview) return res.status(404).json({ error: 'Group not found' });
      return res.json({ ...preview, isMember: false });
    }

    const [group, expenses, settlements] = await Promise.all([
      prisma.justSplitGroup.findUnique({
        where: { id: groupId },
        include: {
          members: { include: { user: { select: { id: true, username: true, avatar: true } } } },
        },
      }),
      prisma.justSplitExpense.findMany({
        where: { groupId },
        include: { paidBy: true, splits: { include: { member: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.justSplitSettlement.findMany({
        where: { groupId },
        include: { fromMember: true, toMember: true },
      }),
    ]);

    // Owner also gets pending join requests
    let joinRequests = [];
    if (group.createdById === req.userId) {
      joinRequests = await prisma.justSplitJoinRequest.findMany({
        where: { groupId, status: 'pending' },
        include: { user: { select: { id: true, username: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      });
    }

    const { net, debts } = computeBalances(group.members, expenses, settlements);
    res.json({ ...group, expenses, settlements, net, debts, joinRequests, isMember: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/justsplit/:groupId
router.delete('/:groupId', auth, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    const group = await prisma.justSplitGroup.findUnique({ where: { id: groupId } });
    if (!group || group.createdById !== req.userId) return res.status(403).json({ error: 'Not owner' });
    await prisma.justSplitGroup.delete({ where: { id: groupId } });
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── Members ───────────────────────────────────────────────────────────────────

// POST /api/justsplit/:groupId/members
router.post('/:groupId/members', auth, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    const member = await assertMember(groupId, req.userId);
    if (!member) return res.status(403).json({ error: 'Not a member' });

    const { username, name } = req.body;
    let userId = null;
    let displayName = name;

    if (username) {
      const found = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true } });
      if (!found) return res.status(404).json({ error: 'User not found' });
      userId = found.id;
      displayName = found.username;
    }

    if (!displayName) return res.status(400).json({ error: 'username or name required' });

    const existing = userId
      ? await prisma.justSplitMember.findUnique({ where: { groupId_userId: { groupId, userId } } })
      : null;
    if (existing) return res.status(409).json({ error: 'Already a member' });

    const newMember = await prisma.justSplitMember.create({
      data: { groupId, userId, name: displayName },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    // Notify the added user (only if they're an app user)
    if (userId) {
      await createNotif({ userId, actorId: req.userId, type: 'justsplit_added', justsplitGroupId: groupId });
    }

    res.status(201).json(newMember);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/justsplit/:groupId/members/:memberId
router.delete('/:groupId/members/:memberId', auth, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    const group = await prisma.justSplitGroup.findUnique({ where: { id: groupId } });
    if (!group || group.createdById !== req.userId) return res.status(403).json({ error: 'Only owner can remove members' });
    await prisma.justSplitMember.delete({ where: { id: parseInt(req.params.memberId) } });
    res.json({ message: 'Removed' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── Join Requests ─────────────────────────────────────────────────────────────

// POST /api/justsplit/:groupId/request — non-member requests to join
router.post('/:groupId/request', auth, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    const alreadyMember = await assertMember(groupId, req.userId);
    if (alreadyMember) return res.status(409).json({ error: 'Already a member' });

    const group = await prisma.justSplitGroup.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, createdById: true },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const existing = await prisma.justSplitJoinRequest.findUnique({
      where: { groupId_userId: { groupId, userId: req.userId } },
    });
    if (existing) return res.status(409).json({ error: 'Request already sent', status: existing.status });

    const { message } = req.body;
    const joinRequest = await prisma.justSplitJoinRequest.create({
      data: { groupId, userId: req.userId, message },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    // Notify the group owner
    await createNotif({ userId: group.createdById, actorId: req.userId, type: 'justsplit_request', justsplitGroupId: groupId });

    res.status(201).json(joinRequest);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/justsplit/:groupId/requests/:requestId — approve or decline
router.put('/:groupId/requests/:requestId', auth, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    const group = await prisma.justSplitGroup.findUnique({ where: { id: groupId } });
    if (!group || group.createdById !== req.userId) return res.status(403).json({ error: 'Only owner can manage requests' });

    const { action } = req.body; // 'approve' | 'decline'
    const joinRequest = await prisma.justSplitJoinRequest.update({
      where: { id: parseInt(req.params.requestId) },
      data: { status: action === 'approve' ? 'approved' : 'declined' },
      include: { user: { select: { id: true, username: true } } },
    });

    if (action === 'approve') {
      // Add as member
      await prisma.justSplitMember.create({
        data: { groupId, userId: joinRequest.userId, name: joinRequest.user.username },
      });
      // Notify requester of approval
      await createNotif({ userId: joinRequest.userId, actorId: req.userId, type: 'justsplit_approved', justsplitGroupId: groupId });
    } else {
      // Notify requester of decline
      await createNotif({ userId: joinRequest.userId, actorId: req.userId, type: 'justsplit_declined', justsplitGroupId: groupId });
    }

    res.json(joinRequest);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ── Expenses ──────────────────────────────────────────────────────────────────

router.post('/:groupId/expenses', auth, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    const member = await assertMember(groupId, req.userId);
    if (!member) return res.status(403).json({ error: 'Not a member' });

    const { title, amount, category, date, notes, paidByMemberId, splitAmong } = req.body;
    if (!title || !amount || !paidByMemberId) return res.status(400).json({ error: 'title, amount, paidByMemberId required' });

    const total = parseFloat(amount);
    const participants = Array.isArray(splitAmong) && splitAmong.length > 0 ? splitAmong : null;

    let splits;
    if (!participants) {
      const members = await prisma.justSplitMember.findMany({ where: { groupId } });
      const share = Math.round((total / members.length) * 100) / 100;
      splits = members.map((m) => ({ memberId: m.id, shareAmount: share }));
    } else if (typeof participants[0] === 'object') {
      splits = participants.map((p) => ({ memberId: p.memberId, shareAmount: parseFloat(p.shareAmount) }));
    } else {
      const share = Math.round((total / participants.length) * 100) / 100;
      splits = participants.map((id) => ({ memberId: id, shareAmount: share }));
    }

    const expense = await prisma.justSplitExpense.create({
      data: {
        groupId,
        paidByMemberId: parseInt(paidByMemberId),
        title, amount: total, category: category || 'general',
        date: date ? new Date(date) : new Date(),
        notes,
        splits: { createMany: { data: splits } },
      },
      include: { paidBy: true, splits: { include: { member: true } } },
    });
    res.status(201).json(expense);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:groupId/expenses/:expenseId', auth, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    const member = await assertMember(groupId, req.userId);
    if (!member) return res.status(403).json({ error: 'Not a member' });
    await prisma.justSplitExpense.delete({ where: { id: parseInt(req.params.expenseId) } });
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── Settlements ───────────────────────────────────────────────────────────────

router.post('/:groupId/settle', auth, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    const member = await assertMember(groupId, req.userId);
    if (!member) return res.status(403).json({ error: 'Not a member' });

    const { fromMemberId, toMemberId, amount, note } = req.body;
    if (!fromMemberId || !toMemberId || !amount) return res.status(400).json({ error: 'fromMemberId, toMemberId, amount required' });

    const settlement = await prisma.justSplitSettlement.create({
      data: { groupId, fromMemberId: parseInt(fromMemberId), toMemberId: parseInt(toMemberId), amount: parseFloat(amount), note },
      include: { fromMember: true, toMember: true },
    });
    res.status(201).json(settlement);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
