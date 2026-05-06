import { z } from 'zod';

export const CreateCircleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  destination: z.string().max(500).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export type CreateCircle = z.infer<typeof CreateCircleSchema>;

export const CircleListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  destination: z.string().nullable(),
  dateFrom: z.string().nullable(),
  dateTo: z.string().nullable(),
  isPublic: z.boolean(),
  linkedTripId: z.string().nullable(),
  linkedTripTitle: z.string().nullable().optional(),
  memberCount: z.number(),
  myRole: z.enum(['owner', 'member']).nullable(),
  createdAt: z.string(),
});

export type CircleListItem = z.infer<typeof CircleListItemSchema>;

export const CircleDetailSchema = CircleListItemSchema.extend({
  ownerId: z.string(),
  coverUrl: z.string().nullable(),
  linkedTripId: z.string().nullable(),
});

export type CircleDetail = z.infer<typeof CircleDetailSchema>;

export const CircleMemberSchema = z.object({
  userId: z.string(),
  role: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarKey: z.string().nullable(),
  joinedAt: z.string(),
});

export type CircleMember = z.infer<typeof CircleMemberSchema>;

export const CircleMessageSchema = z.object({
  id: z.string(),
  circleId: z.string(),
  userId: z.string(),
  content: z.string(),
  isDeleted: z.boolean().optional(),
  replyToId: z.string().nullable(),
  createdAt: z.string(),
  author: z.object({
    username: z.string(),
    avatarKey: z.string().nullable(),
  }),
  reactions: z.array(z.object({ emoji: z.string(), count: z.number() })),
});

export type CircleMessage = z.infer<typeof CircleMessageSchema>;

export const CirclePollSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  isMultiple: z.boolean(),
  isClosed: z.boolean(),
  deadline: z.string().nullable(),
  votes: z.array(z.object({ optionIndex: z.number(), count: z.number() })),
  myVotes: z.array(z.number()),
  createdAt: z.string(),
});

export type CirclePoll = z.infer<typeof CirclePollSchema>;
