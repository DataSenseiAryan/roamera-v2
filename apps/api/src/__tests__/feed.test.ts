import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('Feed API', () => {
  it('GET /api/v1/feed/compass requires auth → 401', async () => {
    const res = await request(app).get('/api/v1/feed/compass');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/feed/compass with auth → 200 array', async () => {
    const res = await request(app)
      .get('/api/v1/feed/compass')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.posts ?? res.body.feed ?? res.body)).toBe(true);
  });

  it('GET /api/v1/feed/trending → 200 array', async () => {
    const res = await request(app)
      .get('/api/v1/feed/trending')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/feed/saved → 200', async () => {
    const res = await request(app)
      .get('/api/v1/feed/saved')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });
});
