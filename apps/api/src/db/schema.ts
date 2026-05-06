import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// ─── HELPER ──────────────────────────────────────────────────────────────────

const now = sql`(strftime('%s','now'))`;

// ═════════════════════════════════════════════════════════════════════════════
// IDENTITY (Sprint 1 — fully defined)
// ═════════════════════════════════════════════════════════════════════════════

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    role: text('role', { enum: ['user', 'admin', 'deleted'] }).notNull().default('user'),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    bio: text('bio'),
    homeCity: text('home_city'),
    avatarKey: text('avatar_key'),
    budgetBand: text('budget_band', { enum: ['backpacker', 'mid_range', 'luxury'] }),
    interests: text('interests', { mode: 'json' }).$type<string[]>().notNull().default([]),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    emailIdx: index('users_email_idx').on(t.email),
    usernameIdx: index('users_username_idx').on(t.username),
  }),
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    userIdx: index('sessions_user_idx').on(t.userId),
    expiresIdx: index('sessions_expires_idx').on(t.expiresAt),
  }),
);

export const otpTokens = sqliteTable(
  'otp_tokens',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    codeHash: text('code_hash').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    usedAt: integer('used_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    emailIdx: index('otp_tokens_email_idx').on(t.email),
  }),
);

export const passwordResetTokens = sqliteTable(
  'password_reset_tokens',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    usedAt: integer('used_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  },
);

export const inviteTokens = sqliteTable('invite_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  token: text('token').notNull().unique(),
  maxUses: integer('max_uses'),
  uses: integer('uses').notNull().default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

export const userSettings = sqliteTable(
  'user_settings',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    value: text('value').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    pk: uniqueIndex('user_settings_pk').on(t.userId, t.key),
  }),
);

export const follows = sqliteTable(
  'follows',
  {
    followerId: text('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    followingId: text('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    pk: uniqueIndex('follows_pk').on(t.followerId, t.followingId),
    followerIdx: index('follows_follower_idx').on(t.followerId),
    followingIdx: index('follows_following_idx').on(t.followingId),
  }),
);

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    details: text('details', { mode: 'json' }),
    ip: text('ip'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    userIdx: index('audit_log_user_idx').on(t.userId),
    createdIdx: index('audit_log_created_idx').on(t.createdAt),
  }),
);

export const idempotencyKeys = sqliteTable(
  'idempotency_keys',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    key: text('key').notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    method: text('method').notNull(),
    path: text('path').notNull(),
    responseStatus: integer('response_status'),
    responseBody: text('response_body'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    keyUserIdx: uniqueIndex('idempotency_keys_key_user_idx').on(t.key, t.userId),
    expiresIdx: index('idempotency_keys_expires_idx').on(t.expiresAt),
  }),
);

// ═════════════════════════════════════════════════════════════════════════════
// SOCIAL (Sprint 2)
// ═════════════════════════════════════════════════════════════════════════════

export const posts = sqliteTable(
  'posts',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content'),
    destinations: text('destinations', { mode: 'json' }).$type<Array<{ name: string; lat?: string; lng?: string; country?: string }>>().notNull().default([]),
    dateFrom: integer('date_from', { mode: 'timestamp' }),
    dateTo: integer('date_to', { mode: 'timestamp' }),
    activities: text('activities', { mode: 'json' }).$type<string[]>().notNull().default([]),
    accommodation: text('accommodation'),
    budgetInr: integer('budget_inr'),
    vacationType: text('vacation_type', { enum: ['leisure', 'adventure', 'workation', 'cultural', 'religious', 'wildlife'] }),
    transportMode: text('transport_mode', { enum: ['flight', 'train', 'road_trip', 'bus', 'cruise', 'backpack'] }),
    hashtags: text('hashtags', { mode: 'json' }).$type<string[]>().notNull().default([]),
    itineraryJson: text('itinerary_json', { mode: 'json' }),
    coverKey: text('cover_key'),
    likesCount: integer('likes_count').notNull().default(0),
    commentsCount: integer('comments_count').notNull().default(0),
    isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    userIdx: index('posts_user_idx').on(t.userId),
    createdIdx: index('posts_created_idx').on(t.createdAt),
    publishedIdx: index('posts_published_idx').on(t.isPublished),
  }),
);

export const postPhotos = sqliteTable(
  'post_photos',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull(),
    orderIndex: integer('order_index').notNull().default(0),
    caption: text('caption'),
  },
  (t) => ({
    postIdx: index('post_photos_post_idx').on(t.postId),
  }),
);

export const reactions = sqliteTable(
  'reactions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['love', 'epic', 'wander', 'wanna_go', 'amazing'] }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    postUserIdx: uniqueIndex('reactions_post_user_idx').on(t.postId, t.userId),
    postIdx: index('reactions_post_idx').on(t.postId),
  }),
);

export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    parentId: text('parent_id'),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    postIdx: index('comments_post_idx').on(t.postId),
    parentIdx: index('comments_parent_idx').on(t.parentId),
  }),
);

export const bucketList = sqliteTable(
  'bucket_list',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    placeName: text('place_name').notNull(),
    lat: text('lat'),
    lng: text('lng'),
    country: text('country'),
    note: text('note'),
    postId: text('post_id').references(() => posts.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    userIdx: index('bucket_list_user_idx').on(t.userId),
    userPostUniq: uniqueIndex('bucket_list_user_post_uniq').on(t.userId, t.postId),
  }),
);

export const savedPosts = sqliteTable(
  'saved_posts',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    pk: uniqueIndex('saved_posts_pk').on(t.userId, t.postId),
  }),
);

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS (Sprint 9 — skeleton stub)
// ═════════════════════════════════════════════════════════════════════════════

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  dataJson: text('data_json', { mode: 'json' }),
  actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

export const notificationPrefs = sqliteTable('notification_prefs', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  inApp: integer('in_app', { mode: 'boolean' }).notNull().default(true),
  email: integer('email', { mode: 'boolean' }).notNull().default(true),
  push: integer('push', { mode: 'boolean' }).notNull().default(false),
});

// ═════════════════════════════════════════════════════════════════════════════
// DESTINATIONS (Sprint 2 — skeleton stub)
// ═════════════════════════════════════════════════════════════════════════════

export const destinations = sqliteTable(
  'destinations',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    country: text('country').notNull(),
    description: text('description'),
    category: text('category'),
    coverKey: text('cover_key'),
    lat: text('lat'),
    lng: text('lng'),
    isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  },
  (t) => ({
    nameUniq: uniqueIndex('destinations_name_uniq').on(t.name),
  }),
);

// ═════════════════════════════════════════════════════════════════════════════
// TRIPS (Sprint 4 — skeleton stubs)
// ═════════════════════════════════════════════════════════════════════════════

export const trips = sqliteTable('trips', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dateFrom: integer('date_from', { mode: 'timestamp' }),
  dateTo: integer('date_to', { mode: 'timestamp' }),
  currency: text('currency').notNull().default('INR'),
  coverKey: text('cover_key'),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  shareToken: text('share_token').unique(),
  shareTokenExpiresAt: integer('share_token_expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(now),
});

export const tripMembers = sqliteTable('trip_members', {
  tripId: text('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'editor', 'viewer'] }).notNull().default('viewer'),
  invitedBy: text('invited_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

export const days = sqliteTable('days', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number').notNull(),
  date: integer('date', { mode: 'timestamp' }),
  title: text('title'),
  notes: text('notes'),
});

export const placeCategories = sqliteTable('place_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6B7280'),
  icon: text('icon'),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6B7280'),
});

export const places = sqliteTable('places', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  lat: text('lat'),
  lng: text('lng'),
  address: text('address'),
  categoryId: text('category_id').references(() => placeCategories.id),
  price: text('price'),
  website: text('website'),
  phone: text('phone'),
  imageUrl: text('image_url'),
  googlePlaceId: text('google_place_id'),
  transportMode: text('transport_mode'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

export const dayAssignments = sqliteTable('day_assignments', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  dayId: text('day_id').notNull().references(() => days.id, { onDelete: 'cascade' }),
  placeId: text('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull().default(0),
  placeTime: text('place_time'),
  endTime: text('end_time'),
  durationMinutes: integer('duration_minutes'),
  notes: text('notes'),
});

export const dayNotes = sqliteTable('day_notes', {
  id: text('id').primaryKey(),
  dayId: text('day_id').notNull().references(() => days.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  time: text('time'),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const reservations = sqliteTable('reservations', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  dayId: text('day_id').references(() => days.id),
  placeId: text('place_id').references(() => places.id),
  type: text('type', { enum: ['flight', 'hotel', 'restaurant', 'other'] }).notNull(),
  status: text('status').notNull().default('confirmed'),
  confirmation: text('confirmation'),
  name: text('name'),
  startTime: text('start_time'),
  endTime: text('end_time'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

export const accommodations = sqliteTable('accommodations', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  checkinDayId: text('checkin_day_id').references(() => days.id),
  checkoutDayId: text('checkout_day_id').references(() => days.id),
  checkinTime: text('checkin_time'),
  checkoutTime: text('checkout_time'),
  confirmation: text('confirmation'),
  notes: text('notes'),
  placeId: text('place_id').references(() => places.id),
});

export const tripFiles = sqliteTable('trip_files', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  storageKey: text('storage_key').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull().default(0),
  placeId: text('place_id').references(() => places.id),
  reservationId: text('reservation_id').references(() => reservations.id),
  isStarred: integer('is_starred', { mode: 'boolean' }).notNull().default(false),
  isTrashed: integer('is_trashed', { mode: 'boolean' }).notNull().default(false),
  shareToken: text('share_token').unique(),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

// ═════════════════════════════════════════════════════════════════════════════
// PACKING (Sprint 5 — skeleton stubs)
// ═════════════════════════════════════════════════════════════════════════════

export const packingLists = sqliteTable('packing_lists', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('Packing List'),
});

export const packingCategories = sqliteTable('packing_categories', {
  id: text('id').primaryKey(),
  listId: text('list_id').notNull().references(() => packingLists.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const packingItems = sqliteTable('packing_items', {
  id: text('id').primaryKey(),
  listId: text('list_id').notNull().references(() => packingLists.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => packingCategories.id),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  isPacked: integer('is_packed', { mode: 'boolean' }).notNull().default(false),
  assignedToUserId: text('assigned_to_user_id').references(() => users.id),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const packingBags = sqliteTable('packing_bags', {
  id: text('id').primaryKey(),
  listId: text('list_id').notNull().references(() => packingLists.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  weightLimitKg: text('weight_limit_kg'),
});

export const packingTemplates = sqliteTable('packing_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

// ═════════════════════════════════════════════════════════════════════════════
// BUDGET (Sprint 5 — skeleton stubs)
// ═════════════════════════════════════════════════════════════════════════════

export const budgetItems = sqliteTable('budget_items', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  name: text('name').notNull(),
  totalPrice: text('total_price').notNull().default('0'),
  currency: text('currency').notNull().default('INR'),
  persons: integer('persons').notNull().default(1),
  days: integer('days').notNull().default(1),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const budgetItemMembers = sqliteTable('budget_item_members', {
  budgetItemId: text('budget_item_id').notNull().references(() => budgetItems.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: text('amount').notNull().default('0'),
  isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
});

export const settlements = sqliteTable('settlements', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  fromUserId: text('from_user_id').notNull().references(() => users.id),
  toUserId: text('to_user_id').notNull().references(() => users.id),
  amount: text('amount').notNull(),
  currency: text('currency').notNull().default('INR'),
  settledAt: integer('settled_at', { mode: 'timestamp' }).notNull().default(now),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

// ═════════════════════════════════════════════════════════════════════════════
// CIRCLES (Sprint 6 — skeleton stubs)
// ═════════════════════════════════════════════════════════════════════════════

export const circles = sqliteTable('circles', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  destination: text('destination'),
  dateFrom: integer('date_from', { mode: 'timestamp' }),
  dateTo: integer('date_to', { mode: 'timestamp' }),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
  coverKey: text('cover_key'),
  linkedTripId: text('linked_trip_id').references(() => trips.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

export const circleMembers = sqliteTable('circle_members', {
  circleId: text('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'member'] }).notNull().default('member'),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().default(now),
});

export const circleMessages = sqliteTable('circle_messages', {
  id: text('id').primaryKey(),
  circleId: text('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  replyToId: text('reply_to_id'),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

export const circlePolls = sqliteTable('circle_polls', {
  id: text('id').primaryKey(),
  circleId: text('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  optionsJson: text('options_json', { mode: 'json' }).$type<string[]>().notNull(),
  isMultiple: integer('is_multiple', { mode: 'boolean' }).notNull().default(false),
  isClosed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
  deadline: integer('deadline', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

// ═════════════════════════════════════════════════════════════════════════════
// JUSTSPLIT (Sprint 7 — skeleton stubs)
// ═════════════════════════════════════════════════════════════════════════════

export const expenseGroups = sqliteTable('expense_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  currency: text('currency').notNull().default('INR'),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

export const expenseGroupMembers = sqliteTable('expense_group_members', {
  groupId: text('group_id').notNull().references(() => expenseGroups.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().default(now),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => expenseGroups.id, { onDelete: 'cascade' }),
  paidBy: text('paid_by').notNull().references(() => users.id),
  description: text('description').notNull(),
  amount: text('amount').notNull(),
  currency: text('currency').notNull().default('INR'),
  date: integer('date', { mode: 'timestamp' }),
  splitType: text('split_type', { enum: ['equal', 'weighted', 'exact'] }).notNull().default('equal'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

export const expenseSplits = sqliteTable('expense_splits', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: text('amount').notNull(),
  isSettled: integer('is_settled', { mode: 'boolean' }).notNull().default(false),
  settledAt: integer('settled_at', { mode: 'timestamp' }),
});

// ═════════════════════════════════════════════════════════════════════════════
// JOURNEY MAGAZINE (Sprint 8 — skeleton stubs)
// ═════════════════════════════════════════════════════════════════════════════

export const journeys = sqliteTable('journeys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  coverKey: text('cover_key'),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  shareToken: text('share_token').unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(now),
});

export const journeyEntries = sqliteTable('journey_entries', {
  id: text('id').primaryKey(),
  journeyId: text('journey_id').notNull().references(() => journeys.id, { onDelete: 'cascade' }),
  title: text('title'),
  contentJson: text('content_json', { mode: 'json' }),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

// ═════════════════════════════════════════════════════════════════════════════
// ATLAS (Sprint 8 — skeleton stubs)
// ═════════════════════════════════════════════════════════════════════════════

export const visitedCountries = sqliteTable('visited_countries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  countryCode: text('country_code').notNull(),
  visitedAt: integer('visited_at', { mode: 'timestamp' }).notNull().default(now),
});

export const visitedRegions = sqliteTable('visited_regions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  countryCode: text('country_code').notNull(),
  regionCode: text('region_code').notNull(),
  visitedAt: integer('visited_at', { mode: 'timestamp' }).notNull().default(now),
});

// ═════════════════════════════════════════════════════════════════════════════
// GAMIFICATION (Sprint 8 — skeleton stub)
// ═════════════════════════════════════════════════════════════════════════════

export const userBadges = sqliteTable('user_badges', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeType: text('badge_type').notNull(),
  earnedAt: integer('earned_at', { mode: 'timestamp' }).notNull().default(now),
  detailsJson: text('details_json', { mode: 'json' }),
});

// ═════════════════════════════════════════════════════════════════════════════
// MEDIA (shared)
// ═════════════════════════════════════════════════════════════════════════════

export const uploads = sqliteTable('uploads', {
  id: text('id').primaryKey(),
  storageKey: text('storage_key').notNull().unique(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull().default(0),
  width: integer('width'),
  height: integer('height'),
  refCount: integer('ref_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

// ═════════════════════════════════════════════════════════════════════════════
// MCP / OAuth (Sprint 11 — skeleton stubs)
// ═════════════════════════════════════════════════════════════════════════════

export const mcpTokens = sqliteTable('mcp_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  name: text('name').notNull(),
  scopes: text('scopes', { mode: 'json' }).$type<string[]>().notNull().default([]),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

// ═════════════════════════════════════════════════════════════════════════════
// SYSTEM (Sprint 9 — skeleton stubs)
// ═════════════════════════════════════════════════════════════════════════════

export const systemNotices = sqliteTable('system_notices', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body'),
  type: text('type').notNull().default('info'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(now),
});

export const userNoticeDismissals = sqliteTable('user_notice_dismissals', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  noticeId: text('notice_id').notNull().references(() => systemNotices.id, { onDelete: 'cascade' }),
  dismissedAt: integer('dismissed_at', { mode: 'timestamp' }).notNull().default(now),
});
