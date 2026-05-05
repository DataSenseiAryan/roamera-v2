import path from 'path';

import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { drizzle } from 'drizzle-orm/libsql';

async function runMigrations() {
  const url = process.env.DATABASE_URL ?? 'file:data/app.db';

  // Ensure the data directory exists for local file mode
  if (url.startsWith('file:')) {
    const fs = await import('fs');
    const dbPath = url.replace('file:', '');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const db = drizzle(client);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete.');

  client.close();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
