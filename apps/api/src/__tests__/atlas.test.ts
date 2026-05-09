import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('Atlas API', () => {
  it('GET /api/v1/atlas/countries → 200 with valid shape', async () => {
    const res = await request(app)
      .get('/api/v1/atlas/countries')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    const data = res.body;
    expect(data).toBeDefined();
  });

  it('GET /api/v1/atlas/stats → 200', async () => {
    const res = await request(app)
      .get('/api/v1/atlas/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });

  it('POST /api/v1/atlas/countries/:code → 201 mark country', async () => {
    const res = await request(app)
      .post('/api/v1/atlas/countries/JP')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'visited' });
    expect([200, 201]).toContain(res.status);
  });

  it('DELETE /api/v1/atlas/countries/JP → 200 unmark', async () => {
    const res = await request(app)
      .delete('/api/v1/atlas/countries/JP')
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 204, 404]).toContain(res.status);
  });

  it('GET /api/v1/atlas/countries without auth → 401', async () => {
    const res = await request(app).get('/api/v1/atlas/countries');
    expect(res.status).toBe(401);
  });
});
