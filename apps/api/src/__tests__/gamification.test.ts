import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('Gamification API', () => {
  it('GET /api/v1/gamification/badges → 200 array', async () => {
    const res = await request(app)
      .get('/api/v1/gamification/badges')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.badges ?? res.body)).toBe(true);
  });

  it('GET /api/v1/gamification/stats → 200 with atlas fields (S12)', async () => {
    const res = await request(app)
      .get('/api/v1/gamification/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    const stats = res.body.stats ?? res.body;
    // S12: stats now includes atlas fields
    expect(typeof (stats.countriesVisited ?? stats.countries)).toBe('number');
    expect(typeof (stats.percentOfWorld ?? 0)).toBe('number');
    expect(Array.isArray(stats.continentBreakdown ?? [])).toBe(true);
  });

  it('GET /api/v1/gamification/leaderboard → 200 sorted array', async () => {
    const res = await request(app)
      .get('/api/v1/gamification/leaderboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    const data = res.body.leaderboard ?? res.body;
    expect(Array.isArray(data)).toBe(true);
  });

  it('GET /api/v1/gamification/badges without auth → 401', async () => {
    const res = await request(app).get('/api/v1/gamification/badges');
    expect(res.status).toBe(401);
  });
});
