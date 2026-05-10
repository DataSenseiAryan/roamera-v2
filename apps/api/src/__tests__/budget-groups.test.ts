import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

let token: string;
let tripId: string;
let budgetItemId: string;

beforeAll(async () => {
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test1@test.com',
    password: 'password123',
  });
  token = loginRes.body.accessToken ?? loginRes.body.tokens?.accessToken;

  const tripRes = await request(app)
    .post('/api/v1/trips')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Budget Test Trip', dateFrom: '2025-07-01', dateTo: '2025-07-10', currency: 'INR' });
  tripId = tripRes.body.trip?.id ?? tripRes.body.id;
});

describe('Trip Budget API (S12 merged)', () => {
  it('GET /trips/:tripId/budget — returns items, settlements, grandTotal', async () => {
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/budget`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toBeInstanceOf(Array);
    expect(res.body.settlements).toBeInstanceOf(Array);
    // grandTotal is at top level (not nested in summary)
    expect(res.body.grandTotal).toBeDefined();
  });

  it('POST /trips/:tripId/budget/items — creates a budget item', async () => {
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/budget/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hotel', category: 'accommodation', totalPrice: 5000, currency: 'INR' });
    expect(res.status).toBe(201);
    expect(res.body.item).toBeDefined();
    expect(res.body.item.name).toBe('Hotel');
    budgetItemId = res.body.item.id;
  });

  it('PATCH /trips/:tripId/budget/items/:id — updates item', async () => {
    const res = await request(app)
      .patch(`/api/v1/trips/${tripId}/budget/items/${budgetItemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hotel Deluxe', totalPrice: 8000 });
    expect(res.status).toBe(200);
  });

  it('GET /trips/:tripId/budget/settlements — lists settlements', async () => {
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/budget/settlements`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.settlements).toBeInstanceOf(Array);
  });

  it('DELETE /trips/:tripId/budget/items/:id — deletes item', async () => {
    const res = await request(app)
      .delete(`/api/v1/trips/${tripId}/budget/items/${budgetItemId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/expenses/groups — returns 404 (router unmounted in S12)', async () => {
    const res = await request(app)
      .get('/api/v1/expenses/groups')
      .set('Authorization', `Bearer ${token}`);
    // Should get 404 since expenses router is unmounted
    expect(res.status).toBe(404);
  });
});
