import http from 'http';

import { WebSocketServer } from 'ws';

import { createApp } from './app';
import { env } from './lib/env';
import { logger } from './lib/logger';

const app = createApp();
const server = http.createServer(app);

// WebSocket server — auth via ws_token query param (implemented in S4)
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url ?? '', `http://${request.headers.host}`);
  if (url.pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected (auth not yet implemented — S4)' }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString()) as { type?: string };
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {
      // ignore malformed
    }
  });
});

server.listen(env.PORT, () => {
  logger.info(`Roamera API running on http://localhost:${env.PORT}`);
  logger.info(`WebSocket available at ws://localhost:${env.PORT}/ws`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
