import { Router } from 'express';
import { eq, asc, desc } from 'drizzle-orm';

import { db } from '../db/client';
import { packingTemplates, packingTemplateCats, packingTemplateItems } from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

const adminRouter = Router();
const publicRouter = Router();

function requireAdmin(req: AuthRequest, res: any, next: any) {
  if (req.user?.role !== 'admin') throw new AppError('Forbidden', 403);
  next();
}

adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

adminRouter.post('/categories/:catId/items', async (req: AuthRequest, res, next) => {
  try {
    const catId = req.params.catId as string;
    const { name, quantity = 1 } = req.body as { name: string; quantity?: number };

    const cat = await db.query.packingTemplateCats.findFirst({ where: (c, { eq: e }) => e(c.id, catId) });
    if (!cat) throw new AppError('Not found', 404);
    if (!name?.trim()) throw new AppError('Name is required', 400);

    const qty = typeof quantity === 'number' && quantity > 0 ? Math.floor(quantity) : 1;
    const id = crypto.randomUUID();
    await db.insert(packingTemplateItems).values({
      id,
      categoryId: catId,
      name: name.trim(),
      quantity: qty,
    });

    const row = await db.query.packingTemplateItems.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
    res.status(201).json({
      success: true,
      item: {
        id: row!.id,
        categoryId: row!.categoryId,
        name: row!.name,
        quantity: row!.quantity,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/:id/categories', async (req: AuthRequest, res, next) => {
  try {
    const templateId = req.params.id as string;

    const tmpl = await db.query.packingTemplates.findFirst({ where: (t, { eq: e }) => e(t.id, templateId) });
    if (!tmpl) throw new AppError('Not found', 404);

    const cats = await db.query.packingTemplateCats.findMany({
      where: (c, { eq: e }) => e(c.templateId, templateId),
      orderBy: (c) => asc(c.sortOrder),
    });

    const categories = await Promise.all(
      cats.map(async (c) => {
        const items = await db.query.packingTemplateItems.findMany({
          where: (t, { eq: e }) => e(t.categoryId, c.id),
          orderBy: (t) => asc(t.id),
        });
        return {
          id: c.id,
          name: c.name,
          sortOrder: c.sortOrder,
          items: items.map((it) => ({
            id: it.id,
            name: it.name,
            quantity: it.quantity,
          })),
        };
      }),
    );

    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/:id/categories', async (req: AuthRequest, res, next) => {
  try {
    const templateId = req.params.id as string;
    const { name, sortOrder } = req.body as { name: string; sortOrder?: number };

    const tmpl = await db.query.packingTemplates.findFirst({ where: (t, { eq: e }) => e(t.id, templateId) });
    if (!tmpl) throw new AppError('Not found', 404);
    if (!name?.trim()) throw new AppError('Name is required', 400);

    let order = sortOrder;
    if (typeof order !== 'number') {
      const last = await db.query.packingTemplateCats.findMany({
        where: (c, { eq: e }) => e(c.templateId, templateId),
        orderBy: (c) => desc(c.sortOrder),
        limit: 1,
      });
      order = (last[0]?.sortOrder ?? -1) + 1;
    }

    const id = crypto.randomUUID();
    await db.insert(packingTemplateCats).values({
      id,
      templateId,
      name: name.trim(),
      sortOrder: order,
    });

    const row = await db.query.packingTemplateCats.findFirst({ where: (c, { eq: e }) => e(c.id, id) });
    res.status(201).json({
      success: true,
      category: {
        id: row!.id,
        templateId: row!.templateId,
        name: row!.name,
        sortOrder: row!.sortOrder,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const templates = await db.query.packingTemplates.findMany({
      orderBy: (t) => desc(t.createdAt),
    });

    const out = await Promise.all(
      templates.map(async (tmpl) => {
        const cats = await db.query.packingTemplateCats.findMany({
          where: (c, { eq: e }) => e(c.templateId, tmpl.id),
        });
        let itemCount = 0;
        for (const c of cats) {
          const items = await db.query.packingTemplateItems.findMany({
            where: (it, { eq: e }) => e(it.categoryId, c.id),
          });
          itemCount += items.length;
        }
        return {
          id: tmpl.id,
          name: tmpl.name,
          description: tmpl.description,
          createdBy: tmpl.createdBy,
          createdAt: tmpl.createdAt,
          categoryCount: cats.length,
          itemCount,
        };
      }),
    );

    res.json({ success: true, templates: out });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { name, description } = req.body as { name: string; description?: string };
    if (!name?.trim()) throw new AppError('Name is required', 400);

    const id = crypto.randomUUID();
    await db.insert(packingTemplates).values({
      id,
      name: name.trim(),
      description: description?.trim() ?? null,
      createdBy: req.user!.id,
    });

    const row = await db.query.packingTemplates.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
    res.status(201).json({
      success: true,
      template: {
        id: row!.id,
        name: row!.name,
        description: row!.description,
        createdBy: row!.createdBy,
        createdAt: row!.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;
    const { name, description } = req.body as { name?: string; description?: string | null };

    const existing = await db.query.packingTemplates.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
    if (!existing) throw new AppError('Not found', 404);

    await db
      .update(packingTemplates)
      .set({
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() ?? null }),
      })
      .where(eq(packingTemplates.id, id));

    const row = await db.query.packingTemplates.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
    res.json({
      success: true,
      template: {
        id: row!.id,
        name: row!.name,
        description: row!.description,
        createdBy: row!.createdBy,
        createdAt: row!.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const id = req.params.id as string;

    const existing = await db.query.packingTemplates.findFirst({ where: (t, { eq: e }) => e(t.id, id) });
    if (!existing) throw new AppError('Not found', 404);

    await db.delete(packingTemplates).where(eq(packingTemplates.id, id));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

publicRouter.use(authenticate);

publicRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const templates = await db.query.packingTemplates.findMany({
      orderBy: (t) => asc(t.name),
    });

    const result = await Promise.all(
      templates.map(async (tmpl) => {
        const cats = await db.query.packingTemplateCats.findMany({
          where: (c, { eq: e }) => e(c.templateId, tmpl.id),
          orderBy: (c) => asc(c.sortOrder),
        });

        const categories = await Promise.all(
          cats.map(async (c) => {
            const items = await db.query.packingTemplateItems.findMany({
              where: (t, { eq: e }) => e(t.categoryId, c.id),
              orderBy: (t) => asc(t.id),
            });
            return {
              id: c.id,
              name: c.name,
              sortOrder: c.sortOrder,
              items: items.map((it) => ({
                id: it.id,
                name: it.name,
                quantity: it.quantity,
              })),
            };
          }),
        );

        return {
          id: tmpl.id,
          name: tmpl.name,
          description: tmpl.description,
          categories,
        };
      }),
    );

    res.json({ success: true, templates: result });
  } catch (err) {
    next(err);
  }
});

export { adminRouter, publicRouter };
