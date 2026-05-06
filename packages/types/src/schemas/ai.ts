import { z } from 'zod';

// ─── AI Plan ───────────────────────────────────────────────────────

export const PlaceSchema = z.object({
  name: z.string(),
  time: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  cost: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  type: z.enum(['attraction', 'food', 'transport', 'hotel', 'activity']).optional().nullable(),
});

export const DayPlanSchema = z.object({
  dayNumber: z.number(),
  title: z.string(),
  places: z.array(PlaceSchema).default([]),
  totalCost: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const AIItinerarySchema = z.object({
  destination: z.string(),
  nights: z.number(),
  budgetBand: z.string().optional().nullable(),
  currency: z.string().default('INR'),
  totalEstimatedCost: z.number().optional().nullable(),
  bestTimeToVisit: z.string().optional().nullable(),
  tips: z.array(z.string()).optional().nullable(),
  days: z.array(DayPlanSchema).default([]),
});

export const AIPlanResultSchema = z.object({
  itinerary: AIItinerarySchema,
  provider: z.string(),
  cached: z.boolean().default(false),
});

export const AIPlanRequestSchema = z.object({
  prompt: z.string().default(''),
  destination: z.string().optional(),
  nights: z.number().int().min(1).max(30).default(3),
  budgetBand: z.enum(['budget', 'moderate', 'luxury']).default('moderate'),
  currency: z.string().default('INR'),
  preferences: z.array(z.string()).default([]),
});

export const RefineRequestSchema = z.object({
  previousPlan: AIItinerarySchema,
  userMessage: z.string().min(1),
  context: z.record(z.unknown()).optional(),
});

export const OptimizeBudgetSchema = z.object({
  itinerary: AIItinerarySchema,
  newBudget: z.number().positive(),
  currency: z.string().default('INR'),
});

export const CaptionRequestSchema = z.object({
  imageUrl: z.string().url(),
  context: z.record(z.unknown()).optional(),
});

export const CaptionResultSchema = z.object({
  caption: z.string(),
  provider: z.string(),
});

export const HashtagsRequestSchema = z.object({
  postContent: z.string().min(1),
  destination: z.string().optional(),
  vacationType: z.string().optional(),
});

export const HashtagsResultSchema = z.object({
  hashtags: z.array(z.string()),
  provider: z.string(),
});

// ─── Chat message (used by AI Planner UI) ──────────────────────────

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  itinerary: AIItinerarySchema.optional().nullable(),
  createdAt: z.string(),
});

// ─── Inferred types ────────────────────────────────────────────────

export type Place = z.infer<typeof PlaceSchema>;
export type DayPlan = z.infer<typeof DayPlanSchema>;
export type AIItinerary = z.infer<typeof AIItinerarySchema>;
export type AIPlanResult = z.infer<typeof AIPlanResultSchema>;
export type AIPlanRequest = z.infer<typeof AIPlanRequestSchema>;
export type RefineRequest = z.infer<typeof RefineRequestSchema>;
export type OptimizeBudget = z.infer<typeof OptimizeBudgetSchema>;
export type CaptionResult = z.infer<typeof CaptionResultSchema>;
export type HashtagsResult = z.infer<typeof HashtagsResultSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
