/**
 * Vitest global setup.
 * Runs once before all test suites.
 * Creates a test-specific SQLite DB, runs all migrations against it,
 * and seeds minimal test users.
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function setup() {
  process.env.DATABASE_URL = 'file:./data/test.db';
  process.env.JWT_SECRET = 'test-jwt-secret-for-tests-only-must-be-32chars';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-tests-only-32chars';
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';
  process.env.AI_SERVICE_URL = 'http://localhost:8000';
  process.env.AI_SERVICE_SECRET = 'dev-ai-service-secret-change-in-production-32';

  // Ensure data dir exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // Remove stale test DB
  const testDbPath = path.join(dataDir, 'test.db');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  // Also remove WAL/SHM files
  [testDbPath + '-wal', testDbPath + '-shm'].forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  // Run migrations against test DB
  try {
    execSync('pnpm db:migrate', { cwd: process.cwd(), stdio: 'inherit', env: { ...process.env } });
  } catch {
    // migrations might already have run — ignore
  }

  // Seed minimal test users into test DB
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const bcrypt = await import('bcryptjs');
  const { users } = await import('../db/schema');

  const client = createClient({ url: 'file:./data/test.db' });
  const db = drizzle(client);

  const passwordHash = await bcrypt.hash('password123', 10);

  // Seed test users
  const testUsers = [
    { id: 'test-user-1', username: 'testuser1', email: 'test1@test.com', passwordHash, role: 'user' as const },
    { id: 'test-admin-1', username: 'testadmin', email: 'admin@test.com', passwordHash, role: 'admin' as const },
  ];

  for (const u of testUsers) {
    await db.insert(users).values({ ...u, emailVerified: true }).onConflictDoNothing();
  }

  client.close();
  console.log('[setup] Test DB ready with 2 test users');
}

export async function teardown() {
  // Keep test DB for post-test inspection
}

export async function getToken(email: string): Promise<string> {
  const jwt = await import('jsonwebtoken');
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const { eq } = await import('drizzle-orm');
  const { users } = await import('../db/schema');

  const client = createClient({ url: 'file:./data/test.db' });
  const db = drizzle(client);
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  client.close();

  if (!user) throw new Error(`Test user not found: ${email}`);
  return jwt.default.sign({ sub: user.id, role: user.role }, 'test-jwt-secret-for-tests-only-must-be-32chars', {
    expiresIn: '1h',
  });
}
