import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import { env } from '../lib/env';
import * as schema from './schema';

const libsqlClient = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(libsqlClient, { schema });

/**
 * Apply SQLite performance PRAGMAs for local file-mode databases.
 * These are no-ops on Turso remote connections (remote ignores pragma).
 */
export async function applyDbPragmas(): Promise<void> {
  try {
    // WAL mode for better concurrent read performance
    await libsqlClient.execute('PRAGMA journal_mode=WAL');
    // 64 MB page cache
    await libsqlClient.execute('PRAGMA cache_size=-65536');
    // Synchronous=NORMAL for durability/speed balance
    await libsqlClient.execute('PRAGMA synchronous=NORMAL');
    // Increase temp store to memory for query processing
    await libsqlClient.execute('PRAGMA temp_store=MEMORY');
  } catch {
    // Remote Turso connections silently ignore pragma — that's fine
  }
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    await libsqlClient.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
