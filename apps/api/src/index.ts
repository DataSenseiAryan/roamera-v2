import http from 'http';

import { WebSocketServer } from 'ws';

import { createApp } from './app';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { initWsManager } from './lib/ws';
import { wsTokenStore } from './routes/auth';

const app = createApp();
const server = http.createServer(app);

// WebSocket server — authenticated via one-time ws_token
const wss = new WebSocketServer({ noServer: true });
const wsManager = initWsManager(wss, wsTokenStore);

server.on('upgrade', (request, socket, head) => {
  wsManager.handleUpgrade(request, socket as never, head);
});

server.listen(env.PORT, () => {
  logger.info(`Roamera API running on http://localhost:${env.PORT}`);
  logger.info(`WebSocket available at ws://localhost:${env.PORT}/ws?token=<ws_token>`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
