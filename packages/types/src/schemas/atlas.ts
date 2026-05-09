import { z } from 'zod';

export const VisitedCountrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  countryCode: z.string().length(2),
  countryName: z.string().optional(),
  continent: z.string().optional(),
  visitedAt: z.union([z.number(), z.date()]).optional(),
});

export type VisitedCountry = z.infer<typeof VisitedCountrySchema>;

export const VisitedRegionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  countryCode: z.string(),
  regionCode: z.string(),
  visitedAt: z.union([z.number(), z.date()]).optional(),
});

export type VisitedRegion = z.infer<typeof VisitedRegionSchema>;

export const ContinentBreakdownSchema = z.object({
  continent: z.string(),
  count: z.number(),
});

export type ContinentBreakdown = z.infer<typeof ContinentBreakdownSchema>;

export const AtlasStatsSchema = z.object({
  totalCountries: z.number(),
  totalPossible: z.number(),
  percentage: z.number(),
  continentBreakdown: z.array(ContinentBreakdownSchema),
});

export type AtlasStats = z.infer<typeof AtlasStatsSchema>;
