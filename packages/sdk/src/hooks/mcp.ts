import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { McpToken, CreateMcpTokenInput, PushToken } from '@roamera/types';
import { getApiClient } from '../client';

export const mcpKeys = {
  all: ['mcp'] as const,
  tokens: () => [...mcpKeys.all, 'tokens'] as const,
  pushTokens: () => [...mcpKeys.all, 'pushTokens'] as const,
};

// ── Static MCP token management ──────────────────────────────────────────

export function useMcpTokens() {
  return useQuery({
    queryKey: mcpKeys.tokens(),
    queryFn: async () => {
      const res = await getApiClient().get<McpToken[]>('/api/v1/mcp/tokens');
      return res.data;
    },
  });
}

export function useCreateMcpToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMcpTokenInput) => {
      const res = await getApiClient().post<McpToken & { token: string }>('/api/v1/mcp/tokens', input);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mcpKeys.tokens() }),
  });
}

export function useRevokeMcpToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getApiClient().delete(`/api/v1/mcp/tokens/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mcpKeys.tokens() }),
  });
}

// ── Push token management ─────────────────────────────────────────────────

export function usePushTokens() {
  return useQuery({
    queryKey: mcpKeys.pushTokens(),
    queryFn: async () => {
      const res = await getApiClient().get<PushToken[]>('/api/v1/push');
      return res.data;
    },
  });
}

export function useRegisterPushToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PushToken) => {
      const res = await getApiClient().post('/api/v1/push/register', input);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mcpKeys.pushTokens() }),
  });
}

export function useUnregisterPushToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      await getApiClient().delete('/api/v1/push/unregister', { data: { token } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mcpKeys.pushTokens() }),
  });
}
