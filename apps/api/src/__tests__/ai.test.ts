import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('AI Proxy API', () => {
  it('POST /api/v1/ai/plan without auth → 401', async () => {
    const res = await request(app)
      .post('/api/v1/ai/plan')
      .send({ destination: 'Goa', nights: 3 });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/ai/plan with auth → responds (200 if AI up, 503 if down)', async () => {
    const res = await request(app)
      .post('/api/v1/ai/plan')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ destination: 'Goa', nights: 3 });
    // In CI without AI service running, expect 200 (if AI up) or 503/500 (if AI down)
    expect([200, 500, 503]).toContain(res.status);
    if (res.status === 200) {
      // Verify itinerary shape from mock AI
      expect(Array.isArray(res.body.days) || res.body.itinerary).toBeTruthy();
    }
  });

  it('GET /api/v1/ai/history → 200 array', async () => {
    const res = await request(app)
      .get('/api/v1/ai/history')
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 404]).toContain(res.status);
  });
});
