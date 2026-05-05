import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import { env } from '../lib/env';
import * as schema from './schema';

const libsqlClient = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(libsqlClient, { schema });

export async function checkDbConnection(): Promise<boolean> {
  try {
    await libsqlClient.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
