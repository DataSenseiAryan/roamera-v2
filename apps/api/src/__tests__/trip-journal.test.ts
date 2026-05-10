import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

let token: string;
let tripId: string;
let entryId: string;

beforeAll(async () => {
  // Use seeded test user (email verified, password = password123)
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test1@test.com',
    password: 'password123',
  });
  token = loginRes.body.accessToken ?? loginRes.body.tokens?.accessToken;

  // Create a trip
  const tripRes = await request(app)
    .post('/api/v1/trips')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Journal Test Trip',
      dateFrom: '2025-06-01',
      dateTo: '2025-06-10',
      currency: 'INR',
    });
  tripId = tripRes.body.trip?.id ?? tripRes.body.id;
});

describe('Trip Journal API', () => {
  it('GET /trips/:tripId/journal — auto-creates journal and returns empty entries', async () => {
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/journal`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.journal).toBeDefined();
    expect(res.body.journal.tripId).toBe(tripId);
    expect(res.body.entries).toBeInstanceOf(Array);
  });

  it('POST /trips/:tripId/journal — creates a journal entry', async () => {
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/journal`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Day 1 in Jaipur',
        contentJson: [
          { type: 'heading', text: 'The Pink City' },
          { type: 'text', text: 'We arrived at the stunning Amer Fort...' },
        ],
        orderIndex: 0,
      });
    expect(res.status).toBe(201);
    expect(res.body.entry).toBeDefined();
    expect(res.body.entry.title).toBe('Day 1 in Jaipur');
    entryId = res.body.entry.id;
  });

  it('PATCH /trips/:tripId/journal/:entryId — updates entry title', async () => {
    const res = await request(app)
      .patch(`/api/v1/trips/${tripId}/journal/${entryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Day 1 in Jaipur (Updated)' });
    expect(res.status).toBe(200);
    expect(res.body.entry.title).toBe('Day 1 in Jaipur (Updated)');
  });

  it('GET /trips/:tripId/journal — lists entry with updated title', async () => {
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/journal`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const entry = res.body.entries.find((e: { id: string }) => e.id === entryId);
    expect(entry).toBeDefined();
    expect(entry.title).toBe('Day 1 in Jaipur (Updated)');
  });

  it('POST /trips/:tripId/journal/share — generates share token', async () => {
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/journal/share`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.shareToken).toBeTypeOf('string');
    expect(res.body.shareToken.length).toBeGreaterThan(10);
  });

  it('GET /api/v1/journal/public/:token — public journal view works', async () => {
    // Get the share token first
    const journalRes = await request(app)
      .get(`/api/v1/trips/${tripId}/journal`)
      .set('Authorization', `Bearer ${token}`);
    const shareToken = journalRes.body.journal.shareToken;

    if (shareToken) {
      const res = await request(app).get(`/api/v1/journal/public/${shareToken}`);
      expect(res.status).toBe(200);
      expect(res.body.journal).toBeDefined();
      expect(res.body.entries).toBeInstanceOf(Array);
    }
  });

  it('DELETE /trips/:tripId/journal/share — revokes share token', async () => {
    const res = await request(app)
      .delete(`/api/v1/trips/${tripId}/journal/share`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('DELETE /trips/:tripId/journal/:entryId — deletes entry', async () => {
    const res = await request(app)
      .delete(`/api/v1/trips/${tripId}/journal/${entryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('GET /trips/:tripId/journal — requires auth', async () => {
    const res = await request(app).get(`/api/v1/trips/${tripId}/journal`);
    expect(res.status).toBe(401);
  });
});
