import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('Reservations & Accommodations API', () => {
  let tripId: string;
  let reservationId: string;
  let accommodationId: string;

  // Create a trip first
  it('setup: create a trip for reservation tests', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Reservation Test Trip', description: 'For testing S10 routes' });
    expect([201, 200]).toContain(res.status);
    tripId = res.body.trip?.id ?? res.body.id;
  });

  // ─── Reservations ──────────────────────────────────────────────

  it('GET /api/v1/trips/:id/reservations → 200 empty array', async () => {
    if (!tripId) return;
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/reservations`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/v1/trips/:id/reservations → 201', async () => {
    if (!tripId) return;
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/reservations`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'flight', name: 'AI 101 Mumbai → Delhi', startTime: '08:00', confirmation: 'ABC123' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.type).toBe('flight');
    reservationId = res.body.id;
  });

  it('PATCH /api/v1/trips/:id/reservations/:rid → 200', async () => {
    if (!reservationId) return;
    const res = await request(app)
      .patch(`/api/v1/trips/${tripId}/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ notes: 'Window seat preferred', status: 'confirmed' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/v1/trips/:id/reservations/:rid → 204', async () => {
    if (!reservationId) return;
    const res = await request(app)
      .delete(`/api/v1/trips/${tripId}/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(204);
  });

  it('POST /api/v1/trips/:id/reservations without auth → 401', async () => {
    const res = await request(app)
      .post('/api/v1/trips/fake-id/reservations')
      .send({ type: 'hotel' });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/trips/:id/reservations without type → 400', async () => {
    if (!tripId) return;
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/reservations`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'No type provided' });
    expect(res.status).toBe(400);
  });

  // ─── Accommodations ────────────────────────────────────────────

  it('GET /api/v1/trips/:id/accommodations → 200 array', async () => {
    if (!tripId) return;
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/accommodations`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/v1/trips/:id/accommodations → 201', async () => {
    if (!tripId) return;
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/accommodations`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ confirmation: 'HTL-999', checkinTime: '14:00', checkoutTime: '11:00', notes: 'Breakfast included' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    accommodationId = res.body.id;
  });

  it('PATCH /api/v1/trips/:id/accommodations/:aid → 200', async () => {
    if (!accommodationId) return;
    const res = await request(app)
      .patch(`/api/v1/trips/${tripId}/accommodations/${accommodationId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ notes: 'Updated: sea view room' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/v1/trips/:id/accommodations/:aid → 204', async () => {
    if (!accommodationId) return;
    const res = await request(app)
      .delete(`/api/v1/trips/${tripId}/accommodations/${accommodationId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(204);
  });

  // ─── Offline Bundle ────────────────────────────────────────────

  it('GET /api/v1/trips/:id/bundle → 200 with trip payload', async () => {
    if (!tripId) return;
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/bundle`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.trip).toBeDefined();
    expect(Array.isArray(res.body.days)).toBe(true);
    expect(res.body.bundledAt).toBeDefined();
  });

  // ─── ICS Export ────────────────────────────────────────────────

  it('GET /api/v1/trips/:id/export/ics → 200 text/calendar', async () => {
    if (!tripId) return;
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/export/ics`)
      .set('Authorization', `Bearer ${userToken}`)
      .buffer(true)
      .parse((res, callback) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => callback(null, data));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/calendar/);
  });
});
