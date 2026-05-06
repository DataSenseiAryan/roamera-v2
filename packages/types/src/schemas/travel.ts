import { z } from 'zod';

// ─── Airports ──────────────────────────────────────────────────────

export const AirportSchema = z.object({
  iataCode: z.string(),
  name: z.string(),
  cityName: z.string().optional().nullable(),
  countryCode: z.string().optional().nullable(),
});

// ─── Deep Links ────────────────────────────────────────────────────

export const FlightDeepLinksSchema = z.object({
  skyscanner: z.string().url(),
  googleFlights: z.string().url(),
  makemytrip: z.string().url(),
});

export const HotelDeepLinksSchema = z.object({
  booking: z.string().url(),
  makemytrip: z.string().url(),
  agoda: z.string().url(),
});

// ─── Flight Search ─────────────────────────────────────────────────

export const FlightSearchSchema = z.object({
  origin: z.string().min(3).max(3).toUpperCase(),
  destination: z.string().min(3).max(3).toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(9).default(1),
  maxResults: z.number().int().min(1).max(50).default(10),
});

export const FlightResultSchema = z.object({
  id: z.string(),
  airline: z.string(),
  flightNumber: z.string(),
  departure: z.object({
    airport: z.string(),
    at: z.string().optional().nullable(),
  }),
  arrival: z.object({
    airport: z.string(),
    at: z.string().optional().nullable(),
  }),
  stops: z.number(),
  duration: z.string().optional().nullable(),
  price: z.object({
    total: z.number(),
    currency: z.string(),
  }),
  deepLinks: FlightDeepLinksSchema,
});

// ─── Hotel Search ──────────────────────────────────────────────────

export const HotelSearchSchema = z.object({
  cityCode: z.string().optional(),
  city: z.string().optional(),
  checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adults: z.number().int().min(1).max(9).default(2),
  maxResults: z.number().int().min(1).max(50).default(10),
});

export const HotelResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: z.number().optional().nullable(),
  price: z.object({
    total: z.number(),
    currency: z.string(),
  }).optional().nullable(),
  deepLinks: HotelDeepLinksSchema,
});

// ─── Inferred types ────────────────────────────────────────────────

export type Airport = z.infer<typeof AirportSchema>;
export type FlightSearch = z.infer<typeof FlightSearchSchema>;
export type FlightResult = z.infer<typeof FlightResultSchema>;
export type FlightDeepLinks = z.infer<typeof FlightDeepLinksSchema>;
export type HotelSearch = z.infer<typeof HotelSearchSchema>;
export type HotelResult = z.infer<typeof HotelResultSchema>;
export type HotelDeepLinks = z.infer<typeof HotelDeepLinksSchema>;
