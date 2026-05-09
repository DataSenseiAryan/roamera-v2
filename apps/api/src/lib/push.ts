import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { pushTokens } from '../db/schema';
import { logger } from './logger';

const expo = new Expo();

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  try {
    const tokenRows = await db.select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));

    if (!tokenRows.length) return;

    const messages: ExpoPushMessage[] = tokenRows
      .filter(({ token }) => Expo.isExpoPushToken(token))
      .map(({ token }) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: data ?? {},
      }));

    if (!messages.length) return;

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      // Log any errors (DeviceNotRegistered tokens should be cleaned up)
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          logger.warn({ ticket }, 'Expo push notification error');
          if (ticket.details?.error === 'DeviceNotRegistered') {
            // Clean up invalid tokens
            const invalidToken = messages.find(m => true)?.to;
            if (invalidToken) {
              await db.delete(pushTokens).where(eq(pushTokens.token, invalidToken as string));
            }
          }
        }
      }
    }
  } catch (err) {
    logger.error({ err }, 'Failed to send push notification');
  }
}
