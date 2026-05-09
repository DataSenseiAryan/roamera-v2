import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { userToken } from './helpers';

const app = createApp();

describe('MCP API', () => {
  let tokenId: string;
  let rawToken: string;

  // ── OAuth Discovery ────────────────────────────────────────────────────
  describe('OAuth 2.1 Discovery', () => {
    it('GET /.well-known/oauth-authorization-server → 200 with required fields', async () => {
      const res = await request(app)
        .get('/api/v1/mcp/.well-known/oauth-authorization-server');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('issuer');
      expect(res.body).toHaveProperty('token_endpoint');
      expect(res.body).toHaveProperty('authorization_endpoint');
      expect(res.body).toHaveProperty('scopes_supported');
      expect(Array.isArray(res.body.scopes_supported)).toBe(true);
    });
  });

  // ── Dynamic Client Registration ──────────────────────────────────────
  describe('Dynamic Client Registration', () => {
    it('POST /oauth/register → 201 with client credentials', async () => {
      const res = await request(app)
        .post('/api/v1/mcp/oauth/register')
        .send({
          client_name: 'Test Client',
          redirect_uris: ['http://localhost:8080/callback'],
          scope: 'trips:read budget:read',
        });
      expect(res.status).toBe(201);
      expect(res.body.client_id).toBeDefined();
      expect(res.body.client_secret).toBeDefined();
    });

    it('POST /oauth/register → 400 without required fields', async () => {
      const res = await request(app)
        .post('/api/v1/mcp/oauth/register')
        .send({ client_name: 'No Redirect' });
      expect(res.status).toBe(400);
    });
  });

  // ── Static MCP Tokens ─────────────────────────────────────────────────
  describe('Static MCP Tokens', () => {
    it('GET /tokens → 401 without auth', async () => {
      const res = await request(app).get('/api/v1/mcp/tokens');
      expect(res.status).toBe(401);
    });

    it('POST /tokens → 201 with valid token', async () => {
      const res = await request(app)
        .post('/api/v1/mcp/tokens')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test Token', scopes: ['trips:read', 'budget:read'] });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.token).toBeDefined();
      expect(res.body.token).toMatch(/^mcp_/);
      expect(res.body.name).toBe('Test Token');
      tokenId = res.body.id;
      rawToken = res.body.token;
    });

    it('GET /tokens → 200 with user token list', async () => {
      const res = await request(app)
        .get('/api/v1/mcp/tokens')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      // Raw token must NOT be included in list (security)
      const tokenFromList = res.body.find((t: { id: string }) => t.id === tokenId);
      expect(tokenFromList).toBeDefined();
      expect(tokenFromList.token).toBeUndefined();
    });

    it('POST /tokens → 400 without name', async () => {
      const res = await request(app)
        .post('/api/v1/mcp/tokens')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ scopes: ['trips:read'] });
      expect(res.status).toBe(400);
    });
  });

  // ── MCP Server (StreamableHTTP) ──────────────────────────────────────
  describe('MCP Server endpoint', () => {
    it('POST /server → 401 without auth', async () => {
      const res = await request(app)
        .post('/api/v1/mcp/server')
        .send({});
      expect(res.status).toBe(401);
    });

    it('POST /server → not 401 with valid static MCP token', async () => {
      if (!rawToken) return;
      const res = await request(app)
        .post('/api/v1/mcp/server')
        .set('Authorization', `Bearer ${rawToken}`)
        .set('Content-Type', 'application/json')
        .send({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1,
        });
      // Should not be 401 (might be 200, 400 based on MCP protocol, but auth passed)
      expect(res.status).not.toBe(401);
    });
  });

  // ── Token Revocation ─────────────────────────────────────────────────
  describe('Token revocation', () => {
    it('DELETE /tokens/:id → 204 revokes token', async () => {
      if (!tokenId) return;
      const res = await request(app)
        .delete(`/api/v1/mcp/tokens/${tokenId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(204);
    });

    it('POST /server → 401 with revoked token', async () => {
      if (!rawToken) return;
      const res = await request(app)
        .post('/api/v1/mcp/server')
        .set('Authorization', `Bearer ${rawToken}`)
        .send({});
      expect(res.status).toBe(401);
    });
  });
});
