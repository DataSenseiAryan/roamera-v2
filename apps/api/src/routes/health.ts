import { Router } from 'express';

import { checkDbConnection } from '../db/client';

const router = Router();

const startTime = Date.now();

router.get('/health', async (_req, res) => {
  const dbOk = await checkDbConnection();

  const status = dbOk ? 'ok' : 'degraded';
  const httpStatus = dbOk ? 200 : 503;

  res.status(httpStatus).json({
    status,
    db: dbOk ? 'ok' : 'error',
    version: process.env.npm_package_version ?? '0.0.1',
    uptime_ms: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });
});

export default router;
