import { z } from 'zod';

export const ReservationTypeSchema = z.enum(['flight', 'hotel', 'restaurant', 'other']);

export const ReservationSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  dayId: z.string().nullable(),
  placeId: z.string().nullable(),
  type: ReservationTypeSchema,
  status: z.string().default('confirmed'),
  confirmation: z.string().nullable(),
  name: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date().or(z.number()).nullable(),
});

export const CreateReservationSchema = z.object({
  type: ReservationTypeSchema,
  name: z.string().optional(),
  dayId: z.string().optional(),
  placeId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  confirmation: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

export const AccommodationSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  placeId: z.string().nullable(),
  checkinDayId: z.string().nullable(),
  checkoutDayId: z.string().nullable(),
  checkinTime: z.string().nullable(),
  checkoutTime: z.string().nullable(),
  confirmation: z.string().nullable(),
  notes: z.string().nullable(),
});

export const CreateAccommodationSchema = z.object({
  placeId: z.string().optional(),
  checkinDayId: z.string().optional(),
  checkoutDayId: z.string().optional(),
  checkinTime: z.string().optional(),
  checkoutTime: z.string().optional(),
  confirmation: z.string().optional(),
  notes: z.string().optional(),
});

export const TripFileSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  filename: z.string(),
  storageKey: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  placeId: z.string().nullable(),
  reservationId: z.string().nullable(),
  isStarred: z.boolean(),
  isTrashed: z.boolean(),
  shareToken: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.date().or(z.number()).nullable(),
  downloadUrl: z.string().nullable().optional(),
});

export const InviteTokenSchema = z.object({
  id: z.string(),
  token: z.string(),
  createdBy: z.string().nullable(),
  maxUses: z.number().nullable(),
  uses: z.number(),
  expiresAt: z.date().or(z.number()).nullable(),
  createdAt: z.date().or(z.number()),
});

export type Reservation = z.infer<typeof ReservationSchema>;
export type CreateReservation = z.infer<typeof CreateReservationSchema>;
export type Accommodation = z.infer<typeof AccommodationSchema>;
export type CreateAccommodation = z.infer<typeof CreateAccommodationSchema>;
export type TripFile = z.infer<typeof TripFileSchema>;
export type InviteToken = z.infer<typeof InviteTokenSchema>;
