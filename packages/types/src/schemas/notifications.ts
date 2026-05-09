import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string().nullable().optional(),
  data: z.record(z.unknown()).nullable().optional(),
  actorId: z.string().nullable().optional(),
  resourceType: z.string().nullable().optional(),
  resourceId: z.string().nullable().optional(),
  readAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationPrefSchema = z.object({
  eventType: z.string(),
  inApp: z.boolean(),
  email: z.boolean(),
  push: z.boolean(),
});

export type NotificationPref = z.infer<typeof NotificationPrefSchema>;

export const NotificationPrefUpdateSchema = z.array(
  z.object({
    eventType: z.string(),
    inApp: z.boolean().optional(),
    email: z.boolean().optional(),
    push: z.boolean().optional(),
  }),
);

export const SystemNoticeSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().nullable().optional(),
  type: z.string(),
  isActive: z.boolean(),
  createdAt: z.number().nullable().optional(),
});

export type SystemNotice = z.infer<typeof SystemNoticeSchema>;

export const NOTIFICATION_EVENT_TYPES = [
  'follow',
  'comment',
  'reaction',
  'trip_invite',
  'trip_update',
  'circle_invite',
  'journey_contributor',
  'system',
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];
