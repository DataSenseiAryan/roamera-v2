/**
 * @deprecated Standalone Journey Magazine routes were removed in Sprint 12.
 * Journals are now trip-scoped: /api/v1/trips/:tripId/journal/*
 * See trip-journal.test.ts for the new tests.
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Journeys API — deprecated in S12', () => {
  it('POST /api/v1/journeys → 404 (removed in S12, use /trips/:tripId/journal)', async () => {
    const res = await request(app)
      .post('/api/v1/journeys')
      .send({ title: 'Test Journey', theme: 'adventure' });
    expect(res.status).toBe(404);
  });

  it('GET /api/v1/journeys → 404 (removed in S12)', async () => {
    const res = await request(app).get('/api/v1/journeys');
    expect(res.status).toBe(404);
  });

  it('GET /api/v1/journeys without auth → 404 (removed)', async () => {
    const res = await request(app).get('/api/v1/journeys');
    expect(res.status).toBe(404);
  });
});
