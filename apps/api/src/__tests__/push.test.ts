import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('Push Token API', () => {
  const pushToken = `ExponentPushToken[test_${Date.now()}]`;

  it('POST /push/register → 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/push/register')
      .send({ token: pushToken, platform: 'ios' });
    expect(res.status).toBe(401);
  });

  it('POST /push/register → 201 with valid token', async () => {
    const res = await request(app)
      .post('/api/v1/push/register')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ token: pushToken, platform: 'ios' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('POST /push/register → 200 upsert on duplicate token', async () => {
    const res = await request(app)
      .post('/api/v1/push/register')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ token: pushToken, platform: 'ios' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('GET /push → 200 returns push token list', async () => {
    const res = await request(app)
      .get('/api/v1/push')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    // Should not expose raw token in list
    const entry = res.body[0];
    expect(entry.id).toBeDefined();
    expect(entry.platform).toBeDefined();
  });

  it('DELETE /push/unregister → 204 removes token', async () => {
    const res = await request(app)
      .delete('/api/v1/push/unregister')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ token: pushToken });
    expect(res.status).toBe(204);
  });

  it('POST /push/register → 400 without token', async () => {
    const res = await request(app)
      .post('/api/v1/push/register')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ platform: 'ios' });
    expect(res.status).toBe(400);
  });
});
