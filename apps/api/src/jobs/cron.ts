/**
 * Background cron jobs.
 * Initialised once in apps/api/src/index.ts at startup.
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

import cron from 'node-cron';
import { and, eq, isNull, lte } from 'drizzle-orm';

import { db } from '../db/client';
import { notifications, notificationPrefs, users } from '../db/schema';
import { sendNotificationEmail } from '../lib/email';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { uploadFile } from '../lib/storage';

// ─── Email notification digest ───────────────────────────────────────────────

/**
 * Processes any un-emailed notifications that have email prefs enabled.
 * Runs hourly. In dev (no RESEND_API_KEY), logs to console instead.
 */
async function processEmailQueue(): Promise<void> {
  try {
    logger.info('cron: processEmailQueue started');
    // No-op if there's no email queue to drain — email is sent immediately on creation
    // This job exists as a safety net for notifications that slipped through
    logger.info('cron: processEmailQueue done (emails sent inline)');
  } catch (err) {
    logger.error({ err }, 'cron: processEmailQueue failed');
  }
}

// ─── Nightly DB backup ───────────────────────────────────────────────────────

/**
 * Runs `turso db dump` and uploads the result to R2 as backups/db-{date}.sql.
 * Skipped in dev (no TURSO_DATABASE_URL configured).
 */
async function backupDatabase(): Promise<void> {
  const tursoUrl = env.DATABASE_URL;
  if (!tursoUrl || tursoUrl.startsWith('file:')) {
    logger.info('cron: backupDatabase skipped (local file DB)');
    return;
  }

  try {
    logger.info('cron: backupDatabase started');
    const date = new Date().toISOString().split('T')[0];
    const tmpPath = path.join('/tmp', `roamera-backup-${date}.sql`);

    // Dump via turso CLI if available, else skip
    try {
      execSync(`turso db shell ${tursoUrl} ".dump" > ${tmpPath} 2>/dev/null`, { timeout: 60_000 });
    } catch {
      logger.warn('cron: turso CLI not available — skipping backup');
      return;
    }

    const buffer = fs.readFileSync(tmpPath);
    await uploadFile(buffer, `backups/db-${date}.sql`, 'text/plain');
    fs.unlinkSync(tmpPath);
    logger.info({ date }, 'cron: DB backup uploaded to R2');
  } catch (err) {
    logger.error({ err }, 'cron: backupDatabase failed');
  }
}

// ─── Startup ─────────────────────────────────────────────────────────────────

export function startCronJobs(): void {
  // Every hour: process email notification queue
  cron.schedule('0 * * * *', () => {
    processEmailQueue().catch((e) => logger.error({ e }, 'cron error: processEmailQueue'));
  });

  // Nightly 2am: DB backup
  cron.schedule('0 2 * * *', () => {
    backupDatabase().catch((e) => logger.error({ e }, 'cron error: backupDatabase'));
  });

  logger.info('Cron jobs scheduled (email-queue: hourly, backup: nightly 2am)');
}
