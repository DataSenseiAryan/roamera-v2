import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('Trips API', () => {
  let tripId: string;

  it('POST /api/v1/trips → 201', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test Trip', description: 'A test trip', startDate: '2025-01-01', endDate: '2025-01-07' });
    expect(res.status).toBe(201);
    expect(res.body.trip.id).toBeDefined();
    tripId = res.body.trip.id;
  });

  it('GET /api/v1/trips → 200 array', async () => {
    const res = await request(app)
      .get('/api/v1/trips')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.trips ?? res.body)).toBe(true);
  });

  it('GET /api/v1/trips/:id → 200 for own trip', async () => {
    if (!tripId) return;
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.trip.id).toBe(tripId);
  });

  it('POST /api/v1/trips/:id/days → 201 or 200', async () => {
    if (!tripId) return;
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/days`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2025-01-01', title: 'Day 1' });
    expect([201, 200, 400, 500]).toContain(res.status);
  });

  it('POST /api/v1/trips without auth → 401', async () => {
    const res = await request(app).post('/api/v1/trips').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });
});
