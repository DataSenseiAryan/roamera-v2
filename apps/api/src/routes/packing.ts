import { Router } from 'express';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';

import { db } from '../db/client';
import {
  packingLists,
  packingCategories,
  packingItems,
  packingBags,
  packingBagItems,
  packingTemplates,
  packingTemplateCats,
  packingTemplateItems,
  tripMembers,
  users,
} from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { getWsManager } from '../lib/ws';

const router = Router({ mergeParams: true });

type TripRole = 'owner' | 'editor' | 'viewer';
const ROLE_LEVEL: Record<TripRole, number> = { owner: 3, editor: 2, viewer: 1 };

async function getMemberRole(tripId: string, userId: string): Promise<TripRole | null> {
  const member = await db.query.tripMembers.findFirst({
    where: (t, { and: a, eq: e }) => a(e(t.tripId, tripId), e(t.userId, userId)),
  });
  return (member?.role as TripRole) ?? null;
}

function requireTripRole(minRole: TripRole) {
  return async (req: AuthRequest, res: any, next: any) => {
    const tripId = req.params.tripId as string;
    const userId = req.user!.id;
    const role = await getMemberRole(tripId, userId);
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL[minRole]) {
      throw new AppError('Forbidden', 403);
    }
    next();
  };
}

async function getOrCreateList(tripId: string): Promise<string> {
  const existing = await db.query.packingLists.findFirst({
    where: (t, { eq: e }) => e(t.tripId, tripId),
  });
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  await db.insert(packingLists).values({ id, tripId, title: 'Packing List' });
  return id;
}

function formatItem(row: typeof packingItems.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    isPacked: row.isPacked,
    assignedToUserId: row.assignedToUserId,
    categoryId: row.categoryId,
    sortOrder: row.sortOrder,
  };
}

async function assertTripMemberIds(tripId: string, userIds: (string | null | undefined)[]): Promise<void> {
  const ids = [...new Set(userIds.filter(Boolean) as string[])];
  if (ids.length === 0) return;
  const members = await db.query.tripMembers.findMany({
    where: (t, { and: a, eq: e, inArray: inn }) => and(eq(t.tripId, tripId), inn(t.userId, ids)),
  });
  if (members.length !== ids.length) throw new AppError('Assignee must be a trip member', 400);
}

async function getItemInTripOrThrow(itemId: string, tripId: string) {
  const item = await db.query.packingItems.findFirst({ where: (t, { eq: e }) => e(t.id, itemId) });
  if (!item) throw new AppError('Not found', 404);
  const list = await db.query.packingLists.findFirst({ where: (t, { eq: e }) => e(t.id, item.listId) });
  if (!list || list.tripId !== tripId) throw new AppError('Not found', 404);
  return { item, listId: list.id };
}

async function assertCategoryInList(categoryId: string, listId: string) {
  const cat = await db.query.packingCategories.findFirst({ where: (t, { eq: e }) => e(t.id, categoryId) });
  if (!cat || cat.listId !== listId) throw new AppError('Invalid category', 400);
}

async function nextItemSortOrder(listId: string): Promise<number> {
  const last = await db.query.packingItems.findMany({
    where: (t, { eq: e }) => e(t.listId, listId),
    orderBy: (t) => desc(t.sortOrder),
    limit: 1,
  });
  return (last[0]?.sortOrder ?? -1) + 1;
}

async function nextCategorySortOrder(listId: string): Promise<number> {
  const last = await db.query.packingCategories.findMany({
    where: (t, { eq: e }) => e(t.listId, listId),
    orderBy: (t) => desc(t.sortOrder),
    limit: 1,
  });
  return (last[0]?.sortOrder ?? -1) + 1;
}

router.use(authenticate);

router.get('/', requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const listId = await getOrCreateList(tripId);

    const categoriesRows = await db.query.packingCategories.findMany({
      where: (t, { eq: e }) => e(t.listId, listId),
      orderBy: (t) => asc(t.sortOrder),
    });

    const itemsRows = await db.query.packingItems.findMany({
      where: (t, { eq: e }) => e(t.listId, listId),
      orderBy: (t) => asc(t.sortOrder),
    });

    const bagsRows = await db.query.packingBags.findMany({
      where: (t, { eq: e }) => e(t.listId, listId),
    });

    const bagIds = bagsRows.map((b) => b.id);
    const bagLinks =
      bagIds.length === 0
        ? []
        : await db.select().from(packingBagItems).where(inArray(packingBagItems.bagId, bagIds));

    const itemsByCategory = new Map<string | null, typeof itemsRows>();
    for (const item of itemsRows) {
      const key = item.categoryId;
      if (!itemsByCategory.has(key)) itemsByCategory.set(key, []);
      itemsByCategory.get(key)!.push(item);
    }

    const uncategorized = (itemsByCategory.get(null) ?? []).map(formatItem);

    const categories = categoriesRows.map((c) => ({
      id: c.id,
      name: c.name,
      assigneeUserId: c.assigneeUserId,
      sortOrder: c.sortOrder,
      items: (itemsByCategory.get(c.id) ?? []).map(formatItem),
    }));

    const bagItemIds = new Map<string, string[]>();
    for (const b of bagsRows) bagItemIds.set(b.id, []);
    for (const link of bagLinks) {
      bagItemIds.get(link.bagId)?.push(link.itemId);
    }

    const bags = bagsRows.map((b) => ({
      id: b.id,
      name: b.name,
      color: b.color,
      weightLimitKg: b.weightLimitKg,
      items: bagItemIds.get(b.id) ?? [],
    }));

    const total = itemsRows.length;
    const packed = itemsRows.filter((i) => i.isPacked).length;
    const percentage = total === 0 ? 0 : Math.round((packed / total) * 100);

    res.json({
      success: true,
      listId,
      categories,
      uncategorized,
      bags,
      progress: { total, packed, percentage },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/items/reorder', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const listId = await getOrCreateList(tripId);
    const { items: order } = req.body as { items?: { id: string; sortOrder: number }[] };
    if (!Array.isArray(order)) throw new AppError('Invalid body', 400);

    for (const row of order) {
      if (!row?.id || typeof row.sortOrder !== 'number') continue;
      const { item } = await getItemInTripOrThrow(row.id, tripId);
      if (item.listId !== listId) continue;
      await db.update(packingItems).set({ sortOrder: row.sortOrder }).where(eq(packingItems.id, row.id));
    }

    getWsManager().broadcast(`trip:${tripId}`, 'packing:item_updated', { tripId, listId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/items', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const listId = await getOrCreateList(tripId);
    const { name, categoryId, quantity = 1, assignedToUserId } = req.body as {
      name: string;
      categoryId?: string | null;
      quantity?: number;
      assignedToUserId?: string | null;
    };

    if (!name?.trim()) throw new AppError('Name is required', 400);
    const qty = typeof quantity === 'number' && quantity > 0 ? Math.floor(quantity) : 1;

    if (categoryId) await assertCategoryInList(categoryId, listId);
    await assertTripMemberIds(tripId, [assignedToUserId]);

    const id = crypto.randomUUID();
    const sortOrder = await nextItemSortOrder(listId);
    await db.insert(packingItems).values({
      id,
      listId,
      categoryId: categoryId ?? null,
      name: name.trim(),
      quantity: qty,
      assignedToUserId: assignedToUserId ?? null,
      sortOrder,
    });

    const row = await db.query.packingItems.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
    getWsManager().broadcast(`trip:${tripId}`, 'packing:item_created', { tripId, listId, item: formatItem(row!) });
    res.status(201).json({ success: true, item: formatItem(row!) });
  } catch (err) {
    next(err);
  }
});

router.patch('/items/:id', requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const itemId = req.params.id as string;
    const role = await getMemberRole(tripId, req.user!.id);
    if (!role) throw new AppError('Forbidden', 403);

    const { listId } = await getItemInTripOrThrow(itemId, tripId);

    const { name, sortOrder, assignedToUserId, isPacked } = req.body as {
      name?: string;
      sortOrder?: number;
      assignedToUserId?: string | null;
      isPacked?: boolean;
    };

    const editsEditor =
      name !== undefined || sortOrder !== undefined || assignedToUserId !== undefined;

    if (editsEditor && ROLE_LEVEL[role] < ROLE_LEVEL.editor) {
      throw new AppError('Forbidden', 403);
    }

    if (assignedToUserId !== undefined) await assertTripMemberIds(tripId, [assignedToUserId]);

    const patch: Partial<typeof packingItems.$inferInsert> = {};
    if (name !== undefined) patch.name = name.trim();
    if (sortOrder !== undefined) patch.sortOrder = sortOrder;
    if (assignedToUserId !== undefined) patch.assignedToUserId = assignedToUserId;
    if (isPacked !== undefined) patch.isPacked = isPacked;

    if (Object.keys(patch).length) {
      await db.update(packingItems).set(patch).where(eq(packingItems.id, itemId));
    }

    const row = await db.query.packingItems.findFirst({ where: (t, { eq: e }) => e(t.id, itemId) });
    getWsManager().broadcast(`trip:${tripId}`, 'packing:item_updated', {
      tripId,
      listId,
      item: formatItem(row!),
    });
    res.json({ success: true, item: formatItem(row!) });
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:id', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const itemId = req.params.id as string;
    const { listId } = await getItemInTripOrThrow(itemId, tripId);

    await db.delete(packingBagItems).where(eq(packingBagItems.itemId, itemId));
    await db.delete(packingItems).where(eq(packingItems.id, itemId));

    getWsManager().broadcast(`trip:${tripId}`, 'packing:item_deleted', { tripId, listId, itemId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/categories', requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const listId = await getOrCreateList(tripId);

    const categoriesRows = await db.query.packingCategories.findMany({
      where: (t, { eq: e }) => e(t.listId, listId),
      orderBy: (t) => asc(t.sortOrder),
    });

    const assigneeIds = [...new Set(categoriesRows.map((c) => c.assigneeUserId).filter(Boolean) as string[])];
    const assignees =
      assigneeIds.length === 0
        ? []
        : await db.query.users.findMany({ where: (u, { inArray: inn }) => inn(u.id, assigneeIds) });

    const userMap = new Map(assignees.map((u) => [u.id, u]));

    const categories = categoriesRows.map((c) => {
      const u = c.assigneeUserId ? userMap.get(c.assigneeUserId) : undefined;
      return {
        id: c.id,
        name: c.name,
        assigneeUserId: c.assigneeUserId,
        sortOrder: c.sortOrder,
        assignee: u
          ? {
              id: u.id,
              username: u.username,
              avatarKey: u.avatarKey,
            }
          : null,
      };
    });

    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

router.post('/categories', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const listId = await getOrCreateList(tripId);
    const { name, sortOrder } = req.body as { name: string; sortOrder?: number };

    if (!name?.trim()) throw new AppError('Name is required', 400);
    const order = typeof sortOrder === 'number' ? sortOrder : await nextCategorySortOrder(listId);

    const id = crypto.randomUUID();
    await db.insert(packingCategories).values({
      id,
      listId,
      name: name.trim(),
      sortOrder: order,
    });

    getWsManager().broadcast(`trip:${tripId}`, 'packing:category_updated', { tripId, listId });
    const row = await db.query.packingCategories.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
    res.status(201).json({
      success: true,
      category: {
        id: row!.id,
        name: row!.name,
        assigneeUserId: row!.assigneeUserId,
        sortOrder: row!.sortOrder,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/categories/:id', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const categoryId = req.params.id as string;
    const listId = await getOrCreateList(tripId);

    const cat = await db.query.packingCategories.findFirst({ where: (t, { eq: e }) => e(t.id, categoryId) });
    if (!cat || cat.listId !== listId) throw new AppError('Not found', 404);

    const { name, assigneeUserId, sortOrder } = req.body as {
      name?: string;
      assigneeUserId?: string | null;
      sortOrder?: number;
    };

    await assertTripMemberIds(tripId, [assigneeUserId]);

    await db
      .update(packingCategories)
      .set({
        ...(name !== undefined && { name: name.trim() }),
        ...(assigneeUserId !== undefined && { assigneeUserId }),
        ...(sortOrder !== undefined && { sortOrder }),
      })
      .where(eq(packingCategories.id, categoryId));

    getWsManager().broadcast(`trip:${tripId}`, 'packing:category_updated', { tripId, listId });
    const row = await db.query.packingCategories.findFirst({ where: (t, { eq: e }) => e(t.id, categoryId) });
    res.json({
      success: true,
      category: {
        id: row!.id,
        name: row!.name,
        assigneeUserId: row!.assigneeUserId,
        sortOrder: row!.sortOrder,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const categoryId = req.params.id as string;
    const listId = await getOrCreateList(tripId);

    const cat = await db.query.packingCategories.findFirst({ where: (t, { eq: e }) => e(t.id, categoryId) });
    if (!cat || cat.listId !== listId) throw new AppError('Not found', 404);

    const itemsInCat = await db.query.packingItems.findMany({
      where: (t, { eq: e }) => e(t.categoryId, categoryId),
    });
    for (const it of itemsInCat) {
      await db.delete(packingBagItems).where(eq(packingBagItems.itemId, it.id));
    }
    await db.delete(packingItems).where(eq(packingItems.categoryId, categoryId));
    await db.delete(packingCategories).where(eq(packingCategories.id, categoryId));

    getWsManager().broadcast(`trip:${tripId}`, 'packing:category_updated', { tripId, listId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/bags', requireTripRole('viewer'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const listId = await getOrCreateList(tripId);

    const bagsRows = await db.query.packingBags.findMany({
      where: (t, { eq: e }) => e(t.listId, listId),
    });

    const bagIds = bagsRows.map((b) => b.id);
    const counts =
      bagIds.length === 0
        ? []
        : await db.select({ bagId: packingBagItems.bagId, n: packingBagItems.itemId }).from(packingBagItems).where(inArray(packingBagItems.bagId, bagIds));

    const countMap = new Map<string, number>();
    for (const b of bagIds) countMap.set(b, 0);
    for (const row of counts) {
      countMap.set(row.bagId, (countMap.get(row.bagId) ?? 0) + 1);
    }

    const bags = bagsRows.map((b) => ({
      id: b.id,
      name: b.name,
      color: b.color,
      weightLimitKg: b.weightLimitKg,
      itemCount: countMap.get(b.id) ?? 0,
    }));

    res.json({ success: true, bags });
  } catch (err) {
    next(err);
  }
});

router.post('/bags', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const listId = await getOrCreateList(tripId);
    const { name, color, weightLimitKg } = req.body as {
      name: string;
      color?: string | null;
      weightLimitKg?: string | null;
    };

    if (!name?.trim()) throw new AppError('Name is required', 400);

    const id = crypto.randomUUID();
    await db.insert(packingBags).values({
      id,
      listId,
      name: name.trim(),
      color: color ?? null,
      weightLimitKg: weightLimitKg ?? null,
    });

    getWsManager().broadcast(`trip:${tripId}`, 'packing:bag_updated', { tripId, listId });
    const row = await db.query.packingBags.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
    res.status(201).json({
      success: true,
      bag: {
        id: row!.id,
        name: row!.name,
        color: row!.color,
        weightLimitKg: row!.weightLimitKg,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/bags/:id', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const bagId = req.params.id as string;
    const listId = await getOrCreateList(tripId);

    const bag = await db.query.packingBags.findFirst({ where: (t, { eq: e }) => e(t.id, bagId) });
    if (!bag || bag.listId !== listId) throw new AppError('Not found', 404);

    const { name, color, weightLimitKg } = req.body as {
      name?: string;
      color?: string | null;
      weightLimitKg?: string | null;
    };

    await db
      .update(packingBags)
      .set({
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
        ...(weightLimitKg !== undefined && { weightLimitKg }),
      })
      .where(eq(packingBags.id, bagId));

    getWsManager().broadcast(`trip:${tripId}`, 'packing:bag_updated', { tripId, listId });
    const row = await db.query.packingBags.findFirst({ where: (t, { eq: e }) => e(t.id, bagId) });
    res.json({
      success: true,
      bag: {
        id: row!.id,
        name: row!.name,
        color: row!.color,
        weightLimitKg: row!.weightLimitKg,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/bags/:id', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const bagId = req.params.id as string;
    const listId = await getOrCreateList(tripId);

    const bag = await db.query.packingBags.findFirst({ where: (t, { eq: e }) => e(t.id, bagId) });
    if (!bag || bag.listId !== listId) throw new AppError('Not found', 404);

    await db.delete(packingBags).where(eq(packingBags.id, bagId));

    getWsManager().broadcast(`trip:${tripId}`, 'packing:bag_updated', { tripId, listId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/bags/:id/items', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const bagId = req.params.id as string;
    const listId = await getOrCreateList(tripId);

    const bag = await db.query.packingBags.findFirst({ where: (t, { eq: e }) => e(t.id, bagId) });
    if (!bag || bag.listId !== listId) throw new AppError('Not found', 404);

    const { itemId } = req.body as { itemId: string };
    if (!itemId) throw new AppError('itemId is required', 400);

    const { item } = await getItemInTripOrThrow(itemId, tripId);
    if (item.listId !== listId) throw new AppError('Invalid item', 400);

    const [existing] = await db
      .select()
      .from(packingBagItems)
      .where(and(eq(packingBagItems.bagId, bagId), eq(packingBagItems.itemId, itemId)))
      .limit(1);
    if (!existing) {
      await db.insert(packingBagItems).values({ bagId, itemId });
    }

    getWsManager().broadcast(`trip:${tripId}`, 'packing:bag_updated', { tripId, listId });
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/bags/:id/items/:itemId', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const bagId = req.params.id as string;
    const itemId = req.params.itemId as string;
    const listId = await getOrCreateList(tripId);

    const bag = await db.query.packingBags.findFirst({ where: (t, { eq: e }) => e(t.id, bagId) });
    if (!bag || bag.listId !== listId) throw new AppError('Not found', 404);

    await getItemInTripOrThrow(itemId, tripId);

    await db
      .delete(packingBagItems)
      .where(and(eq(packingBagItems.bagId, bagId), eq(packingBagItems.itemId, itemId)));

    getWsManager().broadcast(`trip:${tripId}`, 'packing:bag_updated', { tripId, listId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/templates/apply', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const listId = await getOrCreateList(tripId);
    const { templateId } = req.body as { templateId: string };

    if (!templateId) throw new AppError('templateId is required', 400);

    const tmpl = await db.query.packingTemplates.findFirst({
      where: (t, { eq: e }) => e(t.id, templateId),
    });
    if (!tmpl) throw new AppError('Template not found', 404);

    const tmplCats = await db.query.packingTemplateCats.findMany({
      where: (t, { eq: e }) => e(t.templateId, templateId),
      orderBy: (t) => asc(t.sortOrder),
    });

    const tmplCatToListCatId = new Map<string, string>();

    for (const tc of tmplCats) {
      const existingListCat = await db.query.packingCategories.findFirst({
        where: (c, { and: a, eq: e }) => a(e(c.listId, listId), e(c.name, tc.name.trim())),
      });

      if (existingListCat) {
        tmplCatToListCatId.set(tc.id, existingListCat.id);
      } else {
        const newCatId = crypto.randomUUID();
        await db.insert(packingCategories).values({
          id: newCatId,
          listId,
          name: tc.name.trim(),
          sortOrder: tc.sortOrder,
        });
        tmplCatToListCatId.set(tc.id, newCatId);
      }

      const tmplItems = await db.query.packingTemplateItems.findMany({
        where: (t, { eq: e }) => e(t.categoryId, tc.id),
        orderBy: (t) => asc(t.id),
      });

      for (const ti of tmplItems) {
        const listCatId = tmplCatToListCatId.get(tc.id)!;
        const itemId = crypto.randomUUID();
        const sortOrder = await nextItemSortOrder(listId);
        await db.insert(packingItems).values({
          id: itemId,
          listId,
          categoryId: listCatId,
          name: ti.name.trim(),
          quantity: ti.quantity,
          sortOrder,
        });
      }
    }

    getWsManager().broadcast(`trip:${tripId}`, 'packing:template_applied', { tripId, listId, templateId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/templates/save', requireTripRole('editor'), async (req: AuthRequest, res, next) => {
  try {
    const tripId = req.params.tripId as string;
    const listId = await getOrCreateList(tripId);
    const { name, description } = req.body as { name: string; description?: string };

    if (!name?.trim()) throw new AppError('Name is required', 400);

    const templateId = crypto.randomUUID();
    await db.insert(packingTemplates).values({
      id: templateId,
      name: name.trim(),
      description: description?.trim() ?? null,
      createdBy: req.user!.id,
    });

    const categoriesRows = await db.query.packingCategories.findMany({
      where: (t, { eq: e }) => e(t.listId, listId),
      orderBy: (t) => asc(t.sortOrder),
    });

    const itemsRows = await db.query.packingItems.findMany({
      where: (t, { eq: e }) => e(t.listId, listId),
      orderBy: (t) => asc(t.sortOrder),
    });

    const uncategorized = itemsRows.filter((i) => !i.categoryId);

    if (uncategorized.length > 0) {
      const uncategorizedTemplateCatId = crypto.randomUUID();
      await db.insert(packingTemplateCats).values({
        id: uncategorizedTemplateCatId,
        templateId,
        name: 'Uncategorized',
        sortOrder: 9999,
      });
      for (const it of uncategorized) {
        await db.insert(packingTemplateItems).values({
          id: crypto.randomUUID(),
          categoryId: uncategorizedTemplateCatId,
          name: it.name,
          quantity: it.quantity,
        });
      }
    }

    const listCatToTemplateCat = new Map<string, string>();

    for (const c of categoriesRows) {
      const tcId = crypto.randomUUID();
      listCatToTemplateCat.set(c.id, tcId);
      await db.insert(packingTemplateCats).values({
        id: tcId,
        templateId,
        name: c.name,
        sortOrder: c.sortOrder,
      });
    }

    for (const it of itemsRows) {
      if (!it.categoryId) continue;
      const tcId = listCatToTemplateCat.get(it.categoryId);
      if (!tcId) continue;
      await db.insert(packingTemplateItems).values({
        id: crypto.randomUUID(),
        categoryId: tcId,
        name: it.name,
        quantity: it.quantity,
      });
    }

    const template = await db.query.packingTemplates.findFirst({
      where: (t, { eq: e }) => e(t.id, templateId),
    });

    res.status(201).json({
      success: true,
      template: {
        id: template!.id,
        name: template!.name,
        description: template!.description,
        createdBy: template!.createdBy,
        createdAt: template!.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
