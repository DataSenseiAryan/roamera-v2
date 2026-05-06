import { z } from 'zod';

export const VacationTypeSchema = z.enum([
  'leisure',
  'adventure',
  'workation',
  'cultural',
  'religious',
  'wildlife',
]);

export const TransportModeSchema = z.enum([
  'flight',
  'train',
  'road_trip',
  'bus',
  'cruise',
  'backpack',
]);

export const ReactionTypeSchema = z.enum([
  'love',
  'epic',
  'wander',
  'wanna_go',
  'amazing',
]);

export const PostDestinationSchema = z.object({
  name: z.string(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  country: z.string().optional(),
});

export const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(10000).optional(),
  destinations: z.array(PostDestinationSchema).max(5).default([]),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  activities: z.array(z.string()).max(20).default([]),
  accommodation: z.string().max(200).optional(),
  budgetInr: z.number().int().positive().optional(),
  vacationType: VacationTypeSchema.optional(),
  transportMode: TransportModeSchema.optional(),
  hashtags: z.array(z.string().max(50)).max(20).default([]),
  itineraryJson: z.any().optional(),
});

export const UpdatePostSchema = CreatePostSchema.partial();

export const PhotoSchema = z.object({
  id: z.string(),
  storageKey: z.string(),
  url: z.string(),
  orderIndex: z.number(),
  caption: z.string().nullable(),
});

export const PostAuthorSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
});

export const PostSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  destinations: z.array(PostDestinationSchema),
  coverUrl: z.string().nullable(),
  photos: z.array(PhotoSchema),
  dateFrom: z.string().nullable(),
  dateTo: z.string().nullable(),
  activities: z.array(z.string()),
  hashtags: z.array(z.string()),
  budgetInr: z.number().nullable(),
  vacationType: VacationTypeSchema.nullable(),
  transportMode: TransportModeSchema.nullable(),
  isPublished: z.boolean(),
  likesCount: z.number(),
  commentsCount: z.number(),
  isSaved: z.boolean(),
  viewerReaction: ReactionTypeSchema.nullable(),
  reactionCounts: z.record(z.string(), z.number()),
  author: PostAuthorSchema,
  createdAt: z.string(),
});

export const CommentAuthorSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
});

export const CommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  userId: z.string(),
  parentId: z.string().nullable(),
  content: z.string(),
  author: CommentAuthorSchema,
  createdAt: z.string(),
});

export const CreateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export const ReactionSchema = z.object({
  type: ReactionTypeSchema,
});

export const FeedParamsSchema = z.object({
  feed: z.enum(['global', 'following']).default('global'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const DestinationSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  coverUrl: z.string().nullable(),
  lat: z.string().nullable(),
  lng: z.string().nullable(),
  isFeatured: z.boolean(),
  createdAt: z.string(),
});

export const BucketListItemSchema = z.object({
  id: z.string(),
  placeName: z.string(),
  lat: z.string().nullable(),
  lng: z.string().nullable(),
  country: z.string().nullable(),
  note: z.string().nullable(),
  postId: z.string().nullable(),
  createdAt: z.string(),
});

export const AddBucketListSchema = z.object({
  placeName: z.string().min(1).max(200),
  lat: z.string().optional(),
  lng: z.string().optional(),
  country: z.string().optional(),
  note: z.string().max(500).optional(),
});

export type VacationType = z.infer<typeof VacationTypeSchema>;
export type TransportMode = z.infer<typeof TransportModeSchema>;
export type ReactionType = z.infer<typeof ReactionTypeSchema>;
export type PostDestination = z.infer<typeof PostDestinationSchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
export type Photo = z.infer<typeof PhotoSchema>;
export type Post = z.infer<typeof PostSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type ReactionInput = z.infer<typeof ReactionSchema>;
export type FeedParams = z.infer<typeof FeedParamsSchema>;
export type Destination = z.infer<typeof DestinationSchema>;
export type BucketListItem = z.infer<typeof BucketListItemSchema>;
export type AddBucketListInput = z.infer<typeof AddBucketListSchema>;
