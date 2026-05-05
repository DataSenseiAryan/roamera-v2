import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { logger } from '../lib/logger';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  const status = (err as { status?: number }).status ?? 500;
  const message = status < 500 ? err.message : 'Internal server error';

  if (status >= 500) {
    logger.error({ err }, 'Unhandled server error');
  }

  res.status(status).json({
    success: false,
    error: message,
    code: (err as { code?: string }).code ?? 'INTERNAL_ERROR',
  });
};

export class AppError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = 'APP_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}
