import { z } from 'zod';

// ─── Content Blocks ───────────────────────────────────────────────────────────

export const ContentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('heading'), text: z.string() }),
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({
    type: z.literal('photo'),
    storageKey: z.string(),
    caption: z.string().optional(),
    url: z.string().optional(),
  }),
  z.object({ type: z.literal('quote'), text: z.string(), author: z.string().optional() }),
  z.object({ type: z.literal('divider') }),
]);

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

// ─── Journey Schemas ──────────────────────────────────────────────────────────

export const JourneySchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  coverKey: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  layoutPref: z.string().default('magazine'),
  isPublic: z.boolean(),
  shareToken: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  createdAt: z.union([z.number(), z.date()]).optional(),
  updatedAt: z.union([z.number(), z.date()]).optional(),
});

export type Journey = z.infer<typeof JourneySchema>;

export const CreateJourneySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  layoutPref: z.enum(['magazine', 'timeline', 'grid']).optional(),
});

export type CreateJourney = z.infer<typeof CreateJourneySchema>;

// ─── Journey Entry Schemas ────────────────────────────────────────────────────

export const JourneyEntrySchema = z.object({
  id: z.string(),
  journeyId: z.string(),
  title: z.string().nullable().optional(),
  contentJson: z.array(ContentBlockSchema).nullable().optional(),
  orderIndex: z.number(),
  createdAt: z.union([z.number(), z.date()]).optional(),
  updatedAt: z.union([z.number(), z.date()]).optional(),
});

export type JourneyEntry = z.infer<typeof JourneyEntrySchema>;

export const CreateEntrySchema = z.object({
  title: z.string().max(200).optional(),
  contentJson: z.array(ContentBlockSchema).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export type CreateEntry = z.infer<typeof CreateEntrySchema>;

// ─── Journey Photo Schemas ────────────────────────────────────────────────────

export const JourneyPhotoSchema = z.object({
  id: z.string(),
  entryId: z.string(),
  storageKey: z.string(),
  url: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  orderIndex: z.number(),
});

export type JourneyPhoto = z.infer<typeof JourneyPhotoSchema>;

// ─── Contributor Schemas ──────────────────────────────────────────────────────

export const JourneyContributorSchema = z.object({
  journeyId: z.string(),
  userId: z.string(),
  role: z.enum(['owner', 'contributor']),
  invitedAt: z.union([z.number(), z.date()]).optional(),
  user: z
    .object({
      id: z.string(),
      username: z.string(),
      avatarUrl: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type JourneyContributor = z.infer<typeof JourneyContributorSchema>;
