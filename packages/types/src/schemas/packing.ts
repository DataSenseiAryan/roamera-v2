import { z } from 'zod';

export const CreatePackingItemSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().nullable().optional(),
  quantity: z.number().int().min(1).default(1),
  assignedToUserId: z.string().nullable().optional(),
});
export type CreatePackingItem = z.infer<typeof CreatePackingItemSchema>;

export const UpdatePackingItemSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().nullable().optional(),
  quantity: z.number().int().min(1).optional(),
  isPacked: z.boolean().optional(),
  assignedToUserId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});
export type UpdatePackingItem = z.infer<typeof UpdatePackingItemSchema>;

export const PackingItemSchema = z.object({
  id: z.string(),
  listId: z.string(),
  categoryId: z.string().nullable(),
  name: z.string(),
  quantity: z.number(),
  isPacked: z.boolean(),
  assignedToUserId: z.string().nullable(),
  sortOrder: z.number(),
});
export type PackingItem = z.infer<typeof PackingItemSchema>;

export const CreatePackingCategorySchema = z.object({
  name: z.string().min(1),
  assigneeUserId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreatePackingCategory = z.infer<typeof CreatePackingCategorySchema>;

export const PackingCategorySchema = z.object({
  id: z.string(),
  listId: z.string(),
  name: z.string(),
  assigneeUserId: z.string().nullable(),
  sortOrder: z.number(),
  items: z.array(PackingItemSchema).optional(),
});
export type PackingCategory = z.infer<typeof PackingCategorySchema>;

export const CreatePackingBagSchema = z.object({
  name: z.string().min(1),
  color: z.string().nullable().optional(),
  weightLimitKg: z.string().nullable().optional(),
});
export type CreatePackingBag = z.infer<typeof CreatePackingBagSchema>;

export const PackingBagSchema = z.object({
  id: z.string(),
  listId: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  weightLimitKg: z.string().nullable(),
  itemIds: z.array(z.string()).optional(),
  itemCount: z.number().optional(),
});
export type PackingBag = z.infer<typeof PackingBagSchema>;

export const PackingTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    sortOrder: z.number(),
    items: z.array(z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
    })),
  })).optional(),
  createdAt: z.string().optional(),
});
export type PackingTemplate = z.infer<typeof PackingTemplateSchema>;

export const PackingProgressSchema = z.object({
  total: z.number(),
  packed: z.number(),
  percentage: z.number(),
});
export type PackingProgress = z.infer<typeof PackingProgressSchema>;

export const PackingListSchema = z.object({
  listId: z.string(),
  categories: z.array(PackingCategorySchema),
  uncategorized: z.array(PackingItemSchema),
  bags: z.array(PackingBagSchema),
  progress: PackingProgressSchema,
});
export type PackingList = z.infer<typeof PackingListSchema>;
