import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import { WebSocket, WebSocketServer } from 'ws';

import { logger } from './logger';

export type WsEvent =
  | 'place:created'
  | 'place:updated'
  | 'place:deleted'
  | 'day:created'
  | 'day:updated'
  | 'day:deleted'
  | 'assignment:created'
  | 'assignment:updated'
  | 'assignment:deleted'
  | 'note:created'
  | 'note:updated'
  | 'note:deleted'
  | 'trip:updated'
  | 'member:added'
  | 'member:removed'
  | 'notification:new'
  | 'notification:updated'
  | 'system:notice'
  | 'pong';

interface ClientMeta {
  userId: string;
  rooms: Set<string>;
}

interface WsMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  rooms?: string[];
}

// In-memory ws_token store (shared with auth.ts via import)
export type WsTokenStore = Map<string, { userId: string; expiresAt: number }>;

export class WsManager {
  private wss: WebSocketServer;
  private clients = new Map<WebSocket, ClientMeta>();
  private rooms = new Map<string, Set<WebSocket>>();
  private tokenStore: WsTokenStore;

  constructor(wss: WebSocketServer, tokenStore: WsTokenStore) {
    this.wss = wss;
    this.tokenStore = tokenStore;
  }

  handleUpgrade(req: IncomingMessage, socket: Socket, head: Buffer): void {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    const token = url.searchParams.get('token');
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const entry = this.tokenStore.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      this.tokenStore.delete(token);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Consume the token (one-time use)
    this.tokenStore.delete(token);
    const { userId } = entry;

    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.handleConnection(ws, userId);
    });
  }

  handleConnection(ws: WebSocket, userId: string): void {
    // Track client with empty room set
    this.clients.set(ws, { userId, rooms: new Set() });

    // Auto-subscribe to personal room
    this.joinRoom(ws, `user:${userId}`);

    ws.send(JSON.stringify({ type: 'connected', userId }));
    logger.info({ userId }, 'WS client connected');

    ws.on('message', (data: Buffer) => {
      this.handleMessage(ws, data.toString());
    });

    ws.on('close', () => {
      this.cleanup(ws);
    });

    ws.on('error', (err) => {
      logger.error({ err, userId }, 'WS error');
      this.cleanup(ws);
    });
  }

  private handleMessage(ws: WebSocket, raw: string): void {
    try {
      const msg = JSON.parse(raw) as WsMessage;

      switch (msg.type) {
        case 'subscribe':
          if (Array.isArray(msg.rooms)) {
            for (const room of msg.rooms) this.joinRoom(ws, room);
            ws.send(JSON.stringify({ type: 'subscribed', rooms: msg.rooms }));
          }
          break;

        case 'unsubscribe':
          if (Array.isArray(msg.rooms)) {
            for (const room of msg.rooms) this.leaveRoom(ws, room);
            ws.send(JSON.stringify({ type: 'unsubscribed', rooms: msg.rooms }));
          }
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch {
      // Ignore malformed messages
    }
  }

  private joinRoom(ws: WebSocket, room: string): void {
    const meta = this.clients.get(ws);
    if (!meta) return;

    meta.rooms.add(room);
    if (!this.rooms.has(room)) this.rooms.set(room, new Set());
    this.rooms.get(room)!.add(ws);
  }

  private leaveRoom(ws: WebSocket, room: string): void {
    const meta = this.clients.get(ws);
    if (!meta) return;

    meta.rooms.delete(room);
    this.rooms.get(room)?.delete(ws);
    if (this.rooms.get(room)?.size === 0) this.rooms.delete(room);
  }

  private cleanup(ws: WebSocket): void {
    const meta = this.clients.get(ws);
    if (!meta) return;

    for (const room of meta.rooms) {
      this.rooms.get(room)?.delete(ws);
      if (this.rooms.get(room)?.size === 0) this.rooms.delete(room);
    }

    this.clients.delete(ws);
    logger.info({ userId: meta.userId }, 'WS client disconnected');
  }

  broadcast(room: string, event: WsEvent | string, data: unknown, excludeWs?: WebSocket): void {
    const roomClients = this.rooms.get(room);
    if (!roomClients || roomClients.size === 0) return;

    const payload = JSON.stringify({ type: event, data });

    for (const client of roomClients) {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  getUserId(ws: WebSocket): string | undefined {
    return this.clients.get(ws)?.userId;
  }

  getConnectedCount(): number {
    return this.clients.size;
  }
}

// Singleton instance (initialised in index.ts)
let wsManager: WsManager | null = null;

export function initWsManager(wss: WebSocketServer, tokenStore: WsTokenStore): WsManager {
  wsManager = new WsManager(wss, tokenStore);
  return wsManager;
}

export function getWsManager(): WsManager {
  if (!wsManager) throw new Error('WsManager not initialised — call initWsManager first');
  return wsManager;
}
