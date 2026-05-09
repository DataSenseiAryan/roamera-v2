import { z } from 'zod';

export const McpTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  scopes: z.array(z.string()),
  lastUsedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const CreateMcpTokenSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).min(1),
});

export const PushTokenSchema = z.object({
  token: z.string(),
  platform: z.enum(['ios', 'android', 'web', 'unknown']),
});

export const RegisterPushTokenSchema = PushTokenSchema;

export type McpToken = z.infer<typeof McpTokenSchema>;
export type CreateMcpTokenInput = z.infer<typeof CreateMcpTokenSchema>;
export type PushToken = z.infer<typeof PushTokenSchema>;
