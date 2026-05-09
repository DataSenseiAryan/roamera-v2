import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../app';

const app = createApp();

describe('Auth API', () => {
  const uniqueTs = Date.now();
  const email = `test${uniqueTs}@example.com`;
  const username = `testauth${uniqueTs}`;

  it('POST /api/v1/auth/register → 201 (email verification required)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username, email, password: 'Password123!' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // Register returns message, not token (requires email verify first)
    expect(res.body.message).toBeDefined();
  });

  it('POST /api/v1/auth/register with duplicate email → 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: `${username}2`, email, password: 'Password123!' });
    expect(res.status).toBe(409);
  });

  it('POST /api/v1/auth/login with existing seeded user → 200 + token', async () => {
    // Use the test user seeded by setup.ts (emailVerified=true, password=password123)
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test1@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('POST /api/v1/auth/login with invalid credentials → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test1@test.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me without token → 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me with token → 200', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test1@test.com', password: 'password123' });
    const token = login.body.accessToken;
    expect(token).toBeDefined();

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test1@test.com');
  });
});
