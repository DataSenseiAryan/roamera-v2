import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken, adminToken } from './helpers';

const app = createApp();

describe('Admin API', () => {
  it('GET /api/v1/admin/stats as non-admin → 403', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/v1/admin/stats without auth → 401', async () => {
    const res = await request(app).get('/api/v1/admin/stats');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/admin/stats as admin → 200 with valid shape', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.users).toBe('number');
    expect(typeof res.body.posts).toBe('number');
    expect(typeof res.body.trips).toBe('number');
  });

  it('GET /api/v1/admin/users as admin → 200 array', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('GET /api/v1/admin/audit-log as admin → 200', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-log')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
  });

  it('GET /api/v1/admin/notices as admin → 200', async () => {
    const res = await request(app)
      .get('/api/v1/admin/notices')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notices)).toBe(true);
  });

  it('POST /api/v1/admin/notices as admin → 201', async () => {
    const res = await request(app)
      .post('/api/v1/admin/notices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Notice', body: 'Test body', type: 'info' });
    expect(res.status).toBe(201);
    expect(res.body.notice.id).toBeDefined();
  });
});
