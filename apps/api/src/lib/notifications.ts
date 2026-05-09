/**
 * Central notification creation helper.
 * Called by route modules after actions that should notify users.
 * Writes to DB, broadcasts via WebSocket, and optionally queues email.
 */
import crypto from 'crypto';

import { and, eq } from 'drizzle-orm';

import { db } from '../db/client';
import { notifications, notificationPrefs, users } from '../db/schema';
import { sendNotificationEmail } from './email';
import { logger } from './logger';
import { getWsManager } from './ws';
import { sendPushToUser } from './push';

export type NotificationType =
  | 'follow'
  | 'comment'
  | 'reaction'
  | 'trip_invite'
  | 'trip_update'
  | 'circle_invite'
  | 'journey_contributor'
  | 'system';

export interface CreateNotificationOpts {
  userId: string;
  actorId?: string;
  type: NotificationType | string;
  title: string;
  body?: string;
  resourceType?: string;
  resourceId?: string;
  data?: Record<string, unknown>;
}

export async function createNotification(opts: CreateNotificationOpts): Promise<void> {
  try {
    // Check in-app pref (default: enabled)
    const [pref] = await db
      .select()
      .from(notificationPrefs)
      .where(and(eq(notificationPrefs.userId, opts.userId), eq(notificationPrefs.eventType, opts.type)))
      .limit(1);

    const inAppEnabled = pref ? pref.inApp : true;
    const emailEnabled = pref ? pref.email : true;

    if (!inAppEnabled) return;

    const id = crypto.randomUUID();
    const [notification] = await db
      .insert(notifications)
      .values({
        id,
        userId: opts.userId,
        type: opts.type,
        title: opts.title,
        body: opts.body,
        dataJson: opts.data ?? null,
        actorId: opts.actorId ?? null,
        resourceType: opts.resourceType ?? null,
        resourceId: opts.resourceId ?? null,
      })
      .returning();

    // Broadcast to user's WS room (best-effort)
    try {
      const wsManager = getWsManager();
      wsManager.broadcast(`user:${opts.userId}`, 'notification:new', notification);
    } catch {
      // WsManager not yet initialised (e.g. during tests) — skip
    }

    // Send push notification (non-blocking)
    const pushEnabled = pref ? pref.push : false;
    if (pushEnabled) {
      sendPushToUser(opts.userId, opts.title, opts.body ?? '', opts.data).catch(() => {});
    }

    // Queue email notification (non-blocking)
    if (emailEnabled) {
      const [recipient] = await db
        .select({ email: users.email, username: users.username })
        .from(users)
        .where(eq(users.id, opts.userId))
        .limit(1);

      if (recipient) {
        sendNotificationEmail(recipient.email, recipient.username, opts.title, opts.body).catch(
          (err) => logger.warn({ err }, 'Failed to send notification email'),
        );
      }
    }
  } catch (err) {
    logger.warn({ err, opts }, 'createNotification failed — non-fatal');
  }
}
