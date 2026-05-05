import { z } from 'zod';

export const BudgetBandSchema = z.enum(['backpacker', 'mid_range', 'luxury']);

export const TravelInterestSchema = z.enum([
  'treks',
  'cafes',
  'culture',
  'beaches',
  'food',
  'adventure',
  'wildlife',
  'photography',
  'history',
  'nightlife',
  'wellness',
  'workation',
]);

export const UserRoleSchema = z.enum(['user', 'admin']);

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  bio: z.string().nullable(),
  homeCity: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  budgetBand: BudgetBandSchema.nullable(),
  interests: z.array(TravelInterestSchema),
  role: UserRoleSchema,
  emailVerified: z.boolean(),
  followersCount: z.number().int(),
  followingCount: z.number().int(),
  postsCount: z.number().int(),
  isFollowing: z.boolean().optional(),
  createdAt: z.string().datetime(),
});

export const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  bio: z.string().max(300).nullable().optional(),
  homeCity: z.string().max(100).nullable().optional(),
  budgetBand: BudgetBandSchema.nullable().optional(),
  interests: z.array(TravelInterestSchema).optional(),
});

export const UserSearchParamsSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export type BudgetBand = z.infer<typeof BudgetBandSchema>;
export type TravelInterest = z.infer<typeof TravelInterestSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UserSearchParams = z.infer<typeof UserSearchParamsSchema>;
