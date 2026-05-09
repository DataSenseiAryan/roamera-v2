import { useQuery } from '@tanstack/react-query';

import type { Badge, TravelStats, LeaderboardEntry } from '@roamera/types';

import { getApiClient } from '../client';

export const gamificationKeys = {
  badges: () => ['gamification', 'badges'] as const,
  stats: () => ['gamification', 'stats'] as const,
  leaderboard: () => ['gamification', 'leaderboard'] as const,
};

export function useBadges() {
  return useQuery({
    queryKey: gamificationKeys.badges(),
    queryFn: async () => {
      const res = await getApiClient().get<{ badges: Badge[] }>('/api/v1/gamification/badges');
      return res.data.badges;
    },
  });
}

export function useTravelStats() {
  return useQuery({
    queryKey: gamificationKeys.stats(),
    queryFn: async () => {
      const res = await getApiClient().get<{ stats: TravelStats }>('/api/v1/gamification/stats');
      return res.data.stats;
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: gamificationKeys.leaderboard(),
    queryFn: async () => {
      const res = await getApiClient().get<{ leaderboard: LeaderboardEntry[] }>(
        '/api/v1/gamification/leaderboard',
      );
      return res.data.leaderboard;
    },
  });
}
