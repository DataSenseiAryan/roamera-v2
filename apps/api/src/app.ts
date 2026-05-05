import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { env } from './lib/env';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/error';
import router from './routes/index';

export function createApp() {
  const app = express();

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }),
  );

  // Request logging
  app.use(pinoHttp({ logger }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Global rate limit (loose — specific routes add stricter limits)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests, please try again later.' },
    }),
  );

  // Routes
  app.use(router);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
