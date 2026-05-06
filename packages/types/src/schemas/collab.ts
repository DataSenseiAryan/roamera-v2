import { z } from 'zod';

export const CollabMessageSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  userId: z.string(),
  username: z.string(),
  avatarUrl: z.string().optional().nullable(),
  content: z.string(),
  replyToId: z.string().nullable(),
  isDeleted: z.boolean(),
  reactions: z.record(z.string(), z.number()).optional(),
  myReactions: z.array(z.string()).optional(),
  createdAt: z.string(),
});

export type CollabMessage = z.infer<typeof CollabMessageSchema>;

export const CollabNoteSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  userId: z.string(),
  username: z.string().optional(),
  title: z.string(),
  content: z.string(),
  category: z.string().nullable(),
  color: z.string().nullable(),
  isPinned: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CollabNote = z.infer<typeof CollabNoteSchema>;

export const CollabPollSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  isMultiple: z.boolean(),
  isClosed: z.boolean(),
  deadline: z.string().nullable(),
  votes: z.array(z.object({ optionIndex: z.number(), count: z.number() })),
  myVotes: z.array(z.number()),
  totalVoters: z.number(),
  createdAt: z.string(),
});

export type CollabPoll = z.infer<typeof CollabPollSchema>;
