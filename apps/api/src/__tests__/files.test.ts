import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('Trip Files API', () => {
  let tripId: string;
  let fileId: string;

  // Create a trip first
  it('setup: create a trip for file tests', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'File Test Trip', description: 'For testing S10 file routes' });
    expect([201, 200]).toContain(res.status);
    tripId = res.body.trip?.id ?? res.body.id;
  });

  it('GET /api/v1/trips/:id/files → 200 empty array', async () => {
    if (!tripId) return;
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/files`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/v1/trips/:id/files → 201 with uploaded file', async () => {
    if (!tripId) return;
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/files`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', Buffer.from('Hello Roamera!'), { filename: 'test.txt', contentType: 'text/plain' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.filename).toBe('test.txt');
    fileId = res.body.id;
  });

  it('PATCH /api/v1/trips/:id/files/:fid (star) → 200', async () => {
    if (!fileId) return;
    const res = await request(app)
      .patch(`/api/v1/trips/${tripId}/files/${fileId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ isStarred: true });
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/trips/:id/files/:fid/download → 200 with url', async () => {
    if (!fileId) return;
    const res = await request(app)
      .get(`/api/v1/trips/${tripId}/files/${fileId}/download`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
  });

  it('POST /api/v1/trips/:id/files/:fid/share → 200 with shareUrl', async () => {
    if (!fileId) return;
    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/files/${fileId}/share`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.shareToken).toBeDefined();
    expect(res.body.shareUrl).toBeDefined();
  });

  it('DELETE /api/v1/trips/:id/files/:fid (soft trash) → 204', async () => {
    if (!fileId) return;
    const res = await request(app)
      .delete(`/api/v1/trips/${tripId}/files/${fileId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(204);
  });

  it('GET /api/v1/trips/:id/files without auth → 401', async () => {
    const res = await request(app).get('/api/v1/trips/fake/files');
    expect(res.status).toBe(401);
  });
});
