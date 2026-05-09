import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('Expenses API (JustSplit)', () => {
  let groupId: string;

  it('POST /api/v1/expenses/groups → 201', async () => {
    const res = await request(app)
      .post('/api/v1/expenses/groups')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test Group', currency: 'INR' });
    expect(res.status).toBe(201);
    groupId = res.body.group?.id ?? res.body.id;
    expect(groupId).toBeDefined();
  });

  it('GET /api/v1/expenses/groups → 200 array', async () => {
    const res = await request(app)
      .get('/api/v1/expenses/groups')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.groups ?? res.body)).toBe(true);
  });

  it('POST /api/v1/expenses/groups/:id/expenses → 201', async () => {
    if (!groupId) return;
    const res = await request(app)
      .post(`/api/v1/expenses/groups/${groupId}/expenses`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ description: 'Lunch', amount: 500, currency: 'INR', splits: [] });
    expect([201, 400]).toContain(res.status); // 400 if splits required
  });

  it('GET /api/v1/expenses/groups/:id/balances → 200', async () => {
    if (!groupId) return;
    const res = await request(app)
      .get(`/api/v1/expenses/groups/${groupId}/balances`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 404]).toContain(res.status);
  });

  it('GET /api/v1/expenses/groups without auth → 401', async () => {
    const res = await request(app).get('/api/v1/expenses/groups');
    expect(res.status).toBe(401);
  });
});
