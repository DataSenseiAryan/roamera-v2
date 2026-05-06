import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  AIItinerary,
  AIPlanRequest,
  AIPlanResult,
  CaptionResult,
  HashtagsResult,
  OptimizeBudget,
} from '@roamera/types';

import { getApiClient } from '../client';

export const aiKeys = {
  plan: () => ['ai', 'plan'] as const,
};

// ─── AI Plan ───────────────────────────────────────────────────────

export function useAIPlan() {
  return useMutation({
    mutationFn: async (input: AIPlanRequest): Promise<AIPlanResult> => {
      const { data } = await getApiClient().post('/api/v1/ai/plan', input);
      return data as AIPlanResult;
    },
  });
}

// ─── Refine Plan (SSE streaming) ───────────────────────────────────

export interface RefineStreamCallbacks {
  onChunk: (chunk: string) => void;
  onDone: (itinerary: AIItinerary | null) => void;
  onError: (err: Error) => void;
}

export async function streamRefinePlan(
  previousPlan: AIItinerary,
  userMessage: string,
  callbacks: RefineStreamCallbacks,
): Promise<void> {
  const client = getApiClient();
  const baseURL = (client.defaults.baseURL ?? '') as string;
  const token = (client.defaults.headers?.common?.['Authorization'] as string | undefined)?.slice(7);

  const response = await fetch(`${baseURL}/api/v1/ai/plan/refine`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ previousPlan, userMessage }),
  });

  if (!response.ok) {
    callbacks.onError(new Error(`HTTP ${response.status}: ${response.statusText}`));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError(new Error('No response body'));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let finalItinerary: AIItinerary | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') {
          callbacks.onDone(finalItinerary);
          return;
        }
        try {
          const parsed = JSON.parse(payload) as AIItinerary;
          finalItinerary = parsed;
          callbacks.onChunk(payload);
        } catch {
          callbacks.onChunk(payload);
        }
      }
    }
  }

  callbacks.onDone(finalItinerary);
}

// ─── Optimize Budget ───────────────────────────────────────────────

export function useOptimizeBudget() {
  return useMutation({
    mutationFn: async (input: OptimizeBudget): Promise<AIPlanResult> => {
      const { data } = await getApiClient().post('/api/v1/ai/optimize-budget', input);
      return data as AIPlanResult;
    },
  });
}

// ─── Caption ───────────────────────────────────────────────────────

export function useCaption() {
  return useMutation({
    mutationFn: async (input: { imageUrl: string; context?: Record<string, unknown> }): Promise<CaptionResult> => {
      const { data } = await getApiClient().post('/api/v1/ai/caption', input);
      return data as CaptionResult;
    },
  });
}

// ─── Hashtags ──────────────────────────────────────────────────────

export function useHashtags() {
  return useMutation({
    mutationFn: async (input: {
      postContent: string;
      destination?: string;
      vacationType?: string;
    }): Promise<HashtagsResult> => {
      const { data } = await getApiClient().post('/api/v1/ai/hashtags', input);
      return data as HashtagsResult;
    },
  });
}
