import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().default('file:data/app.db'),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  JWT_SECRET: z.string().min(32).default('dev-jwt-secret-change-in-production-32ch'),
  JWT_REFRESH_SECRET: z.string().min(32).default('dev-refresh-secret-change-in-production-32'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  AI_SERVICE_SECRET: z.string().min(32).default('dev-ai-service-secret-change-in-production-32'),
  STORAGE_DRIVER: z.enum(['local', 'r2']).default('local'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3001,http://localhost:8081'),
  AMADEUS_CLIENT_ID: z.string().optional(),
  AMADEUS_CLIENT_SECRET: z.string().optional(),
  PEXELS_API_KEY: z.string().optional(),
  FOURSQUARE_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
