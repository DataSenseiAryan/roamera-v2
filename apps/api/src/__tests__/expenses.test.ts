/**
 * @deprecated Standalone JustSplit expenses routes were removed in Sprint 12.
 * These tests verify that the old routes return 404 and that budget is now trip-scoped.
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Expenses API (JustSplit) — deprecated in S12', () => {
  it('POST /api/v1/expenses/groups → 404 (removed in S12)', async () => {
    const res = await request(app)
      .post('/api/v1/expenses/groups')
      .send({ name: 'Test Group', currency: 'INR' });
    expect(res.status).toBe(404);
  });

  it('GET /api/v1/expenses/groups → 404 (removed in S12)', async () => {
    const res = await request(app).get('/api/v1/expenses/groups');
    expect(res.status).toBe(404);
  });

  it('GET /api/v1/expenses/groups without auth → 404 (removed)', async () => {
    const res = await request(app).get('/api/v1/expenses/groups');
    expect(res.status).toBe(404);
  });
});
