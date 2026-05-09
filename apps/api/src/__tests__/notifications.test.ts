import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('Notifications API', () => {
  it('GET /api/v1/notifications → 200 array', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  it('GET /api/v1/notifications/unread-count → 200 with count', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe('number');
  });

  it('GET /api/v1/notifications/preferences → 200', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.preferences)).toBe(true);
    expect(res.body.preferences.length).toBeGreaterThan(0);
  });

  it('PATCH /api/v1/notifications/preferences → 200', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send([{ eventType: 'follow', inApp: true, email: false }]);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/v1/notifications/read-all → 200', async () => {
    const res = await request(app)
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/notifications without auth → 401', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/notices (public) → 200', async () => {
    const res = await request(app).get('/api/v1/notices');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notices)).toBe(true);
  });
});
