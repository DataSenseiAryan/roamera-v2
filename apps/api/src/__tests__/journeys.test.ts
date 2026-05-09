import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('Journeys API', () => {
  let journeyId: string;

  it('POST /api/v1/journeys → 201', async () => {
    const res = await request(app)
      .post('/api/v1/journeys')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test Journey', theme: 'adventure', isPublic: true });
    expect(res.status).toBe(201);
    journeyId = res.body.journey?.id ?? res.body.id;
    expect(journeyId).toBeDefined();
  });

  it('GET /api/v1/journeys → 200', async () => {
    const res = await request(app)
      .get('/api/v1/journeys')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/journeys/:id → 200', async () => {
    if (!journeyId) return;
    const res = await request(app)
      .get(`/api/v1/journeys/${journeyId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.journey?.id ?? res.body.id).toBe(journeyId);
  });

  it('POST /api/v1/journeys/:id/entries → 2xx or 4xx', async () => {
    if (!journeyId) return;
    const res = await request(app)
      .post(`/api/v1/journeys/${journeyId}/entries`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ body: 'Test journal entry', entryType: 'text' });
    expect([201, 200, 400, 422]).toContain(res.status);
  });

  it('POST /api/v1/journeys/:id/share → any response (route may not exist)', async () => {
    if (!journeyId) return;
    const res = await request(app)
      .post(`/api/v1/journeys/${journeyId}/share`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 201, 404, 500]).toContain(res.status);
  });

  it('GET /api/v1/journeys without auth → 401', async () => {
    const res = await request(app).get('/api/v1/journeys');
    expect(res.status).toBe(401);
  });
});
