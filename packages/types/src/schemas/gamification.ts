import { z } from 'zod';

export const BadgeSchema = z.object({
  id: z.string(),
  badgeType: z.string(),
  name: z.string(),
  icon: z.string(),
  description: z.string(),
  earnedAt: z.union([z.number(), z.date()]).optional(),
});

export type Badge = z.infer<typeof BadgeSchema>;

export const ContinentBreakdownSchema = z.object({
  continent: z.string(),
  count: z.number(),
});

export const TravelStatsSchema = z.object({
  posts: z.number(),
  trips: z.number(),
  countries: z.number(),
  badges: z.number(),
  // Atlas fields merged in S12
  countriesVisited: z.number().optional(),
  percentOfWorld: z.number().optional(),
  continentBreakdown: z.array(ContinentBreakdownSchema).optional(),
});

export type TravelStats = z.infer<typeof TravelStatsSchema>;

export const LeaderboardEntrySchema = z.object({
  rank: z.number(),
  userId: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable().optional(),
  countriesVisited: z.number(),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
