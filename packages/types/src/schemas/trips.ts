import { z } from 'zod';

// ─── Trip ──────────────────────────────────────────────────────────

export const CreateTripSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  currency: z.string().default('INR'),
});

export const UpdateTripSchema = CreateTripSchema.partial();

export const TripSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  dateFrom: z.string().nullable(),
  dateTo: z.string().nullable(),
  currency: z.string(),
  coverUrl: z.string().nullable(),
  isArchived: z.boolean(),
  shareToken: z.string().nullable(),
  ownerId: z.string(),
  myRole: z.enum(['owner', 'editor', 'viewer']).optional(),
  memberCount: z.number().optional(),
  dayCount: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreateTrip = z.infer<typeof CreateTripSchema>;
export type UpdateTrip = z.infer<typeof UpdateTripSchema>;
export type Trip = z.infer<typeof TripSchema>;

// ─── Day ───────────────────────────────────────────────────────────

export const CreateDaySchema = z.object({
  title: z.string().max(200).optional(),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const DaySchema = z.object({
  id: z.string(),
  tripId: z.string(),
  dayNumber: z.number(),
  date: z.string().nullable(),
  title: z.string().nullable(),
  notes: z.string().nullable(),
});

export type CreateDay = z.infer<typeof CreateDaySchema>;
export type Day = z.infer<typeof DaySchema>;

// ─── Place ─────────────────────────────────────────────────────────

export const CreatePlaceSchema = z.object({
  name: z.string().min(1).max(300),
  lat: z.number().optional(),
  lng: z.number().optional(),
  address: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  price: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export const UpdatePlaceSchema = CreatePlaceSchema.partial();

export const TripPlaceSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  name: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  address: z.string().nullable(),
  category: z.string().nullable(),
  notes: z.string().nullable(),
  price: z.string().nullable(),
  website: z.string().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.string(),
});

export type CreatePlace = z.infer<typeof CreatePlaceSchema>;
export type UpdatePlace = z.infer<typeof UpdatePlaceSchema>;
export type TripPlace = z.infer<typeof TripPlaceSchema>;

// ─── Assignment ────────────────────────────────────────────────────

export const CreateAssignmentSchema = z.object({
  dayId: z.string(),
  placeId: z.string(),
  orderIndex: z.number().int().default(0),
  placeTime: z.string().optional(),
  durationMinutes: z.number().int().optional(),
  notes: z.string().optional(),
});

export const MoveAssignmentSchema = z.object({
  targetDayId: z.string(),
  orderIndex: z.number().int().default(0),
});

export const AssignmentSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  dayId: z.string(),
  placeId: z.string(),
  orderIndex: z.number(),
  placeTime: z.string().nullable(),
  endTime: z.string().nullable(),
  durationMinutes: z.number().nullable(),
  notes: z.string().nullable(),
});

export type CreateAssignment = z.infer<typeof CreateAssignmentSchema>;
export type MoveAssignment = z.infer<typeof MoveAssignmentSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;

// ─── Day Note ──────────────────────────────────────────────────────

export const DayNoteSchema = z.object({
  id: z.string(),
  dayId: z.string(),
  text: z.string(),
  time: z.string().nullable(),
  icon: z.string().nullable(),
  sortOrder: z.number(),
});

export type DayNote = z.infer<typeof DayNoteSchema>;

// ─── Trip Member ───────────────────────────────────────────────────

export const TripMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['owner', 'editor', 'viewer']),
  username: z.string().optional(),
  avatarUrl: z.string().nullable(),
  joinedAt: z.string(),
});

export type TripMember = z.infer<typeof TripMemberSchema>;

// ─── Weather ───────────────────────────────────────────────────────

export const WeatherCurrentSchema = z.object({
  temperature: z.number(),
  windspeed: z.number(),
  weathercode: z.number(),
  description: z.string(),
  isDay: z.boolean(),
  time: z.string(),
  humidity: z.number().nullable(),
  feelsLike: z.number().nullable(),
});

export const WeatherForecastDaySchema = z.object({
  date: z.string(),
  weathercode: z.number(),
  description: z.string(),
  tempMax: z.number(),
  tempMin: z.number(),
  precipitationProbability: z.number().nullable(),
  windspeedMax: z.number().nullable(),
});

export type WeatherCurrent = z.infer<typeof WeatherCurrentSchema>;
export type WeatherForecastDay = z.infer<typeof WeatherForecastDaySchema>;

// ─── Map ───────────────────────────────────────────────────────────

export const MapSearchResultSchema = z.object({
  placeId: z.union([z.string(), z.number()]),
  displayName: z.string(),
  shortName: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  type: z.string().optional(),
  category: z.string().optional(),
  address: z.record(z.string()).optional(),
  boundingBox: z.array(z.string()).optional(),
});

export const OverpassResultSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  type: z.string(),
  tags: z.record(z.unknown()).optional(),
});

export type MapSearchResult = z.infer<typeof MapSearchResultSchema>;
export type OverpassResult = z.infer<typeof OverpassResultSchema>;
