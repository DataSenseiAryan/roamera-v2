import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

let token: string;
let tripId: string;
let circleId: string;
let collabMsgId: string;
let circleMsgId: string;

beforeAll(async () => {
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: 'test1@test.com',
    password: 'password123',
  });
  token = loginRes.body.accessToken ?? loginRes.body.tokens?.accessToken;

  const tripRes = await request(app)
    .post('/api/v1/trips')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Chat Test Trip', dateFrom: '2025-08-01', dateTo: '2025-08-10', currency: 'INR' });
  tripId = tripRes.body.trip?.id ?? tripRes.body.id;

  const circleRes = await request(app)
    .post('/api/v1/circles')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Chat Test Circle', destination: 'Goa', isPublic: false });
  circleId = circleRes.body.circle?.id ?? circleRes.body.id;
});

describe('Unified Chat — Trip Collab (contextType=trip)', () => {
  it('GET /trips/:tripId/collab/messages — returns empty list', async () => {
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/collab/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.messages).toBeInstanceOf(Array);
  });

  it('POST /trips/:tripId/collab/messages — sends a message', async () => {
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/collab/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Let us meet at the hotel lobby!' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBeDefined();
    expect(res.body.message.content).toBe('Let us meet at the hotel lobby!');
    collabMsgId = res.body.message.id;
  });

  it('POST /trips/:tripId/collab/messages/:id/react — reacts to message', async () => {
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/collab/messages/${collabMsgId}/react`)
      .set('Authorization', `Bearer ${token}`)
      .send({ emoji: '👍' });
    expect(res.status).toBe(200);
  });

  it('DELETE /trips/:tripId/collab/messages/:id — deletes message', async () => {
    const res = await request(app)
      .delete(`/api/v1/trips/${tripId}/collab/messages/${collabMsgId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });
});

describe('Unified Chat — Circle Chat (contextType=circle)', () => {
  it('GET /circles/:circleId/messages — returns empty list', async () => {
    const res = await request(app)
      .get(`/api/v1/circles/${circleId}/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.messages).toBeInstanceOf(Array);
  });

  it('POST /circles/:circleId/messages — sends a message', async () => {
    const res = await request(app)
      .post(`/api/v1/circles/${circleId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hey circle members, anyone interested in Goa trip?' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBeDefined();
    circleMsgId = res.body.message.id;
  });

  it('POST /circles/:circleId/messages/:id/react — reacts to circle message', async () => {
    const res = await request(app)
      .post(`/api/v1/circles/${circleId}/messages/${circleMsgId}/react`)
      .set('Authorization', `Bearer ${token}`)
      .send({ emoji: '🔥' });
    expect([200, 201]).toContain(res.status);
  });

  it('DELETE /circles/:circleId/messages/:id — deletes circle message', async () => {
    const res = await request(app)
      .delete(`/api/v1/circles/${circleId}/messages/${circleMsgId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });
});

describe('Chat — Notes (trip collab)', () => {
  it('GET /trips/:tripId/collab/notes — returns notes', async () => {
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/collab/notes`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.notes).toBeInstanceOf(Array);
  });

  it('POST /trips/:tripId/collab/notes — creates a note', async () => {
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/collab/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Packing Reminder', content: 'Bring sunscreen!', color: '#fef3c7' });
    expect(res.status).toBe(201);
    expect(res.body.note).toBeDefined();
  });
});
