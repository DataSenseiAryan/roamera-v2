import pino from 'pino';

import { env } from './env';

function buildLogger() {
  if (env.NODE_ENV !== 'production') {
    try {
      require.resolve('pino-pretty');
      return pino({
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      });
    } catch {
      // pino-pretty not available; fall through to plain JSON logger
    }
  }

  return pino({ level: env.NODE_ENV === 'production' ? 'info' : 'debug' });
}

export const logger = buildLogger();
