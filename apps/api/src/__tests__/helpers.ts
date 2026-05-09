/**
 * Shared test helpers — used by all test suites.
 */
import jwt from 'jsonwebtoken';

export const JWT_SECRET = 'test-jwt-secret-for-tests-only-must-be-32chars';

export function makeToken(userId: string, role: 'user' | 'admin' = 'user'): string {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

export const TEST_USER_ID = 'test-user-1';
export const TEST_ADMIN_ID = 'test-admin-1';

export const userToken = makeToken(TEST_USER_ID, 'user');
export const adminToken = makeToken(TEST_ADMIN_ID, 'admin');
