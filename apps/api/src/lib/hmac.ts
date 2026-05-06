import crypto from 'crypto';

import { env } from './env';

/**
 * Signs a service-to-service request body with HMAC-SHA256.
 * Must match the verification logic in apps/ai-service/src/middleware/hmac.py.
 *
 * Signing scheme:
 *   timestamp = Date.now() (milliseconds)
 *   bodyHash  = SHA-256(JSON.stringify(body))
 *   message   = `${timestamp}.${bodyHash}`
 *   token     = HMAC-SHA256(AI_SERVICE_SECRET, message)
 */
export function signServiceRequest(body: unknown): {
  'X-Service-Token': string;
  'X-Timestamp': string;
} {
  const timestamp = Date.now();
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex');
  const message = `${timestamp}.${bodyHash}`;
  const token = crypto
    .createHmac('sha256', env.AI_SERVICE_SECRET)
    .update(message)
    .digest('hex');

  return {
    'X-Service-Token': token,
    'X-Timestamp': String(timestamp),
  };
}
