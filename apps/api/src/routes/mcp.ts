import { Router } from 'express';
import { createHash, randomBytes } from 'crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { db } from '../db/client';
import {
  mcpTokens,
  oauthClients,
  oauthCodes,
  oauthTokens,
  trips,
  days as tripDays,
  dayAssignments,
  places,
  tripMembers,
  expenses,
  packingItems,
  packingLists,
  visitedCountries,
  notifications,
} from '../db/schema';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { env } from '../lib/env';

const router = Router();

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const now = () => new Date();
const nowMs = () => Math.floor(Date.now() / 1000);

// ─── Supported MCP Scopes ─────────────────────────────────────────────────
const SUPPORTED_SCOPES = [
  'trips:read', 'trips:write',
  'budget:read', 'packing:read', 'packing:write',
  'atlas:read', 'notifications:read',
];

// ─── OAuth 2.1 Discovery ─────────────────────────────────────────────────
router.get('/.well-known/oauth-authorization-server', (_req, res) => {
  const base = env.API_BASE_URL;
  res.json({
    issuer: base,
    authorization_endpoint: `${base}/api/v1/mcp/oauth/authorize`,
    token_endpoint: `${base}/api/v1/mcp/oauth/token`,
    revocation_endpoint: `${base}/api/v1/mcp/oauth/revoke`,
    registration_endpoint: `${base}/api/v1/mcp/oauth/register`,
    scopes_supported: SUPPORTED_SCOPES,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'none'],
  });
});

// ─── Dynamic Client Registration ─────────────────────────────────────────
router.post('/oauth/register', async (req, res, next) => {
  try {
    const { client_name, redirect_uris, scope } = req.body as {
      client_name?: string;
      redirect_uris?: string[];
      scope?: string;
    };

    if (!client_name || !redirect_uris?.length) {
      throw new AppError('client_name and redirect_uris are required', 400);
    }

    const clientId = `mcp_${randomBytes(12).toString('hex')}`;
    const clientSecret = randomBytes(24).toString('hex');
    const requestedScopes = (scope ?? SUPPORTED_SCOPES.join(' ')).split(' ').filter(s => SUPPORTED_SCOPES.includes(s));

    const [client] = await db.insert(oauthClients).values({
      id: randomBytes(8).toString('hex'),
      clientId,
      clientSecretHash: sha256(clientSecret),
      name: client_name,
      redirectUris: redirect_uris,
      scopes: requestedScopes,
    }).returning();

    res.status(201).json({
      client_id: client.clientId,
      client_secret: clientSecret,
      client_name: client.name,
      redirect_uris: client.redirectUris,
      scope: (client.scopes as string[]).join(' '),
    });
  } catch (err) { next(err); }
});

// ─── Authorization Endpoint (redirect to consent page) ───────────────────
router.get('/oauth/authorize', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { client_id, redirect_uri, state, code_challenge, code_challenge_method, scope } = req.query as Record<string, string>;

    if (!client_id || !redirect_uri || !code_challenge) {
      throw new AppError('client_id, redirect_uri, and code_challenge are required', 400);
    }

    const [client] = await db.select().from(oauthClients).where(eq(oauthClients.clientId, client_id));
    if (!client) throw new AppError('Unknown client', 400);

    if (!(client.redirectUris as string[]).includes(redirect_uri)) {
      throw new AppError('redirect_uri not registered', 400);
    }

    const requestedScopes = scope?.split(' ').filter(s => SUPPORTED_SCOPES.includes(s)) ?? [];

    // Return consent info for the web UI
    res.json({
      client_name: client.name,
      scopes: requestedScopes,
      redirect_uri,
      state,
      code_challenge,
      code_challenge_method: code_challenge_method ?? 'S256',
      client_id,
    });
  } catch (err) { next(err); }
});

// ─── Authorization Submit (issue auth code) ──────────────────────────────
router.post('/oauth/authorize', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { client_id, redirect_uri, state, code_challenge, code_challenge_method, scopes, approved } = req.body as {
      client_id: string;
      redirect_uri: string;
      state?: string;
      code_challenge: string;
      code_challenge_method?: string;
      scopes: string[];
      approved: boolean;
    };

    if (!approved) {
      const url = new URL(redirect_uri);
      url.searchParams.set('error', 'access_denied');
      if (state) url.searchParams.set('state', state);
      return res.json({ redirect: url.toString() });
    }

    const [client] = await db.select().from(oauthClients).where(eq(oauthClients.clientId, client_id));
    if (!client) throw new AppError('Unknown client', 400);

    const code = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(oauthCodes).values({
      id: randomBytes(8).toString('hex'),
      clientId: client_id,
      userId: req.user!.id,
      code,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method ?? 'S256',
      scopes: scopes.filter(s => SUPPORTED_SCOPES.includes(s)),
      expiresAt,
    });

    const url = new URL(redirect_uri);
    url.searchParams.set('code', code);
    if (state) url.searchParams.set('state', state);

    res.json({ redirect: url.toString() });
  } catch (err) { next(err); }
});

// ─── Token Endpoint ────────────────────────────────────────────────────────
router.post('/oauth/token', async (req, res, next) => {
  try {
    const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier, refresh_token } = req.body as Record<string, string>;

    if (grant_type === 'authorization_code') {
      if (!code || !client_id) throw new AppError('code and client_id required', 400);

      const [authCode] = await db.select().from(oauthCodes)
        .where(and(eq(oauthCodes.code, code), isNull(oauthCodes.usedAt)));

      if (!authCode) throw new AppError('Invalid or expired code', 400);
      if (authCode.expiresAt < now()) throw new AppError('Code expired', 400);
      if (authCode.clientId !== client_id) throw new AppError('Client mismatch', 400);

      // PKCE verification
      if (authCode.codeChallengeMethod === 'S256' && code_verifier) {
        const computed = createHash('sha256').update(code_verifier).digest('base64url');
        if (computed !== authCode.codeChallenge) {
          throw new AppError('PKCE verification failed', 400);
        }
      }

      // Mark code as used
      await db.update(oauthCodes).set({ usedAt: now() }).where(eq(oauthCodes.id, authCode.id));

      const accessToken = `moa_${randomBytes(24).toString('hex')}`;
      const refreshTokenVal = `mor_${randomBytes(24).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(oauthTokens).values({
        id: randomBytes(8).toString('hex'),
        clientId: client_id,
        userId: authCode.userId,
        accessTokenHash: sha256(accessToken),
        refreshTokenHash: sha256(refreshTokenVal),
        scopes: authCode.scopes as string[],
        expiresAt,
      });

      return res.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: refreshTokenVal,
        scope: (authCode.scopes as string[]).join(' '),
      });
    }

    if (grant_type === 'refresh_token') {
      if (!refresh_token) throw new AppError('refresh_token required', 400);

      const [existing] = await db.select().from(oauthTokens)
        .where(and(eq(oauthTokens.refreshTokenHash, sha256(refresh_token)), isNull(oauthTokens.revokedAt)));

      if (!existing || existing.expiresAt < now()) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Revoke old token
      await db.update(oauthTokens).set({ revokedAt: now() }).where(eq(oauthTokens.id, existing.id));

      const newAccessToken = `moa_${randomBytes(24).toString('hex')}`;
      const newRefreshToken = `mor_${randomBytes(24).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.insert(oauthTokens).values({
        id: randomBytes(8).toString('hex'),
        clientId: existing.clientId,
        userId: existing.userId,
        accessTokenHash: sha256(newAccessToken),
        refreshTokenHash: sha256(newRefreshToken),
        scopes: existing.scopes as string[],
        expiresAt,
      });

      return res.json({
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: newRefreshToken,
        scope: (existing.scopes as string[]).join(' '),
      });
    }

    throw new AppError(`Unsupported grant_type: ${grant_type}`, 400);
  } catch (err) { next(err); }
});

// ─── Token Revocation ─────────────────────────────────────────────────────
router.post('/oauth/revoke', async (req, res, next) => {
  try {
    const { token } = req.body as { token: string };
    if (!token) throw new AppError('token required', 400);

    const hash = sha256(token);
    // Try access token first, then refresh token
    await db.update(oauthTokens)
      .set({ revokedAt: now() })
      .where(eq(oauthTokens.accessTokenHash, hash));
    await db.update(oauthTokens)
      .set({ revokedAt: now() })
      .where(eq(oauthTokens.refreshTokenHash, hash));

    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Static MCP Token CRUD ────────────────────────────────────────────────

// Helper: resolve userId from Bearer (OAuth token or static MCP token)
async function resolveUserId(authHeader?: string): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const hash = sha256(token);

  // Try static MCP token
  if (token.startsWith('mcp_')) {
    const [row] = await db.select().from(mcpTokens).where(eq(mcpTokens.tokenHash, hash));
    if (row) {
      await db.update(mcpTokens).set({ lastUsedAt: now() }).where(eq(mcpTokens.id, row.id));
      return row.userId;
    }
  }

  // Try OAuth access token
  if (token.startsWith('moa_')) {
    const [row] = await db.select().from(oauthTokens)
      .where(and(eq(oauthTokens.accessTokenHash, hash), isNull(oauthTokens.revokedAt)));
    if (row && row.expiresAt > now()) return row.userId;
  }

  return null;
}

router.get('/tokens', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const rows = await db.select({
      id: mcpTokens.id,
      name: mcpTokens.name,
      scopes: mcpTokens.scopes,
      lastUsedAt: mcpTokens.lastUsedAt,
      createdAt: mcpTokens.createdAt,
    }).from(mcpTokens).where(eq(mcpTokens.userId, req.user!.id));
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/tokens', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, scopes } = req.body as { name?: string; scopes?: string[] };
    if (!name) throw new AppError('name is required', 400);

    const rawToken = `mcp_${randomBytes(24).toString('hex')}`;
    const hash = sha256(rawToken);
    const validScopes = (scopes ?? SUPPORTED_SCOPES).filter(s => SUPPORTED_SCOPES.includes(s));

    const [row] = await db.insert(mcpTokens).values({
      id: randomBytes(8).toString('hex'),
      userId: req.user!.id,
      tokenHash: hash,
      name,
      scopes: validScopes,
    }).returning();

    res.status(201).json({ id: row.id, name: row.name, scopes: row.scopes, token: rawToken });
  } catch (err) { next(err); }
});

router.delete('/tokens/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const [row] = await db.select().from(mcpTokens)
      .where(and(eq(mcpTokens.id, req.params.id), eq(mcpTokens.userId, req.user!.id)));
    if (!row) throw new AppError('Token not found', 404);

    await db.delete(mcpTokens).where(eq(mcpTokens.id, req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── MCP Server (StreamableHTTP transport) ────────────────────────────────

function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({ name: 'roamera', version: '1.0.0' });

  // Tool: get_trips
  server.tool('get_trips', 'List user\'s trips', {}, async () => {
    const rows = await db.select({
      id: trips.id,
      title: trips.title,
      dateFrom: trips.dateFrom,
      dateTo: trips.dateTo,
      currency: trips.currency,
    }).from(trips).innerJoin(tripMembers, eq(tripMembers.tripId, trips.id))
      .where(eq(tripMembers.userId, userId));
    return { content: [{ type: 'text', text: JSON.stringify(rows) }] };
  });

  // Tool: get_trip_details
  server.tool('get_trip_details', 'Full trip data (days, places)', {
    tripId: z.string().describe('Trip UUID'),
  }, async ({ tripId }) => {
    const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
    if (!trip) return { content: [{ type: 'text', text: 'Trip not found' }], isError: true };

    const days = await db.select().from(tripDays).where(eq(tripDays.tripId, tripId));
    const assigns = await db.select({
      id: dayAssignments.id,
      dayId: dayAssignments.dayId,
      placeId: dayAssignments.placeId,
      orderIndex: dayAssignments.orderIndex,
      placeTime: dayAssignments.placeTime,
      notes: dayAssignments.notes,
      placeName: places.name,
      placeAddress: places.address,
    }).from(dayAssignments)
      .leftJoin(places, eq(dayAssignments.placeId, places.id))
      .where(eq(dayAssignments.tripId, tripId));

    return { content: [{ type: 'text', text: JSON.stringify({ trip, days, assignments: assigns }) }] };
  });

  // Tool: create_trip
  server.tool('create_trip', 'Create a new trip', {
    title: z.string().describe('Trip title'),
    dateFrom: z.string().optional().describe('Start date ISO string'),
    dateTo: z.string().optional().describe('End date ISO string'),
  }, async ({ title, dateFrom, dateTo }) => {
    const id = randomBytes(8).toString('hex') + randomBytes(8).toString('hex');
    const [trip] = await db.insert(trips).values({
      id,
      title,
      ownerId: userId,
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
    }).returning();
    await db.insert(tripMembers).values({ tripId: id, userId, role: 'owner' });
    return { content: [{ type: 'text', text: JSON.stringify({ id: trip.id, title: trip.title }) }] };
  });

  // Tool: add_place_to_trip
  server.tool('add_place_to_trip', 'Add a place to a trip day', {
    tripId: z.string().describe('Trip UUID'),
    dayId: z.string().describe('Day UUID'),
    placeName: z.string().describe('Name of the place'),
    placeAddress: z.string().optional().describe('Address'),
    notes: z.string().optional().describe('Notes'),
  }, async ({ tripId, dayId, placeName, placeAddress, notes }) => {
    const placeId = randomBytes(16).toString('hex');
    await db.insert(places).values({ id: placeId, tripId, name: placeName, address: placeAddress ?? null });

    const existing = await db.select().from(dayAssignments).where(eq(dayAssignments.dayId, dayId));
    await db.insert(dayAssignments).values({
      id: randomBytes(16).toString('hex'),
      tripId,
      dayId,
      placeId,
      orderIndex: existing.length,
      notes: notes ?? null,
    });
    return { content: [{ type: 'text', text: `Added ${placeName} to day` }] };
  });

  // Tool: get_budget_summary
  server.tool('get_budget_summary', 'Trip budget status and expenses', {
    tripId: z.string().describe('Trip UUID'),
  }, async ({ tripId }) => {
    const rows = await db.select().from(expenses).where(eq(expenses.tripId, tripId));
    const total = rows.reduce((sum, e) => sum + (e.amount as number), 0);
    return { content: [{ type: 'text', text: JSON.stringify({ total, currency: 'INR', items: rows.length, expenses: rows }) }] };
  });

  // Tool: get_packing_list
  server.tool('get_packing_list', 'Get packing checklist for a trip', {
    tripId: z.string().describe('Trip UUID'),
  }, async ({ tripId }) => {
    const lists = await db.select({ id: packingLists.id }).from(packingLists).where(eq(packingLists.tripId, tripId));
    if (!lists.length) return { content: [{ type: 'text', text: JSON.stringify([]) }] };
    const listIds = lists.map(l => l.id);
    const rows = await db.select().from(packingItems).where(eq(packingItems.listId, listIds[0]));
    return { content: [{ type: 'text', text: JSON.stringify(rows) }] };
  });

  // Tool: mark_item_packed
  server.tool('mark_item_packed', 'Check or uncheck a packing item', {
    itemId: z.string().describe('Packing item UUID'),
    isPacked: z.boolean().describe('True to mark packed, false to unpack'),
  }, async ({ itemId, isPacked }) => {
    await db.update(packingItems).set({ isPacked }).where(eq(packingItems.id, itemId));
    return { content: [{ type: 'text', text: `Item ${isPacked ? 'packed' : 'unpacked'}` }] };
  });

  // Tool: get_user_atlas
  server.tool('get_user_atlas', 'Get visited countries for user', {}, async () => {
    const rows = await db.select().from(visitedCountries).where(eq(visitedCountries.userId, userId));
    return { content: [{ type: 'text', text: JSON.stringify(rows) }] };
  });

  // Tool: get_notifications
  server.tool('get_notifications', 'Get unread notifications for user', {}, async () => {
    const rows = await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { content: [{ type: 'text', text: JSON.stringify(rows) }] };
  });

  // Tool: get_weather (stub — calls weather endpoint logic)
  server.tool('get_weather', 'Get weather for a location', {
    location: z.string().describe('City or place name'),
  }, async ({ location }) => {
    return { content: [{ type: 'text', text: JSON.stringify({ location, note: 'Use /api/v1/weather?location=' + encodeURIComponent(location) + ' for live data' }) }] };
  });

  // Tool: search_places
  server.tool('search_places', 'Search for points of interest', {
    query: z.string().describe('Place name or keyword'),
    limit: z.number().int().min(1).max(10).optional().describe('Max results'),
  }, async ({ query, limit = 5 }) => {
    return { content: [{ type: 'text', text: JSON.stringify({ query, note: 'Use /api/v1/maps/search?q=' + encodeURIComponent(query) + '&limit=' + limit + ' for live results' }) }] };
  });

  return server;
}

// MCP StreamableHTTP endpoint
router.all('/server', async (req, res, next) => {
  try {
    const userId = await resolveUserId(req.headers.authorization);
    if (!userId) {
      res.setHeader('WWW-Authenticate', 'Bearer error="invalid_token"');
      return res.status(401).json({ error: 'invalid_token', error_description: 'Valid Bearer token required' });
    }

    const mcpServer = buildMcpServer(userId);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);
  } catch (err) { next(err); }
});

export default router;
