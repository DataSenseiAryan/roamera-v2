import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { VisitedCountry, AtlasStats, VisitedRegion } from '@roamera/types';

import { getApiClient } from '../client';

export const atlasKeys = {
  countries: () => ['atlas', 'countries'] as const,
  stats: () => ['atlas', 'stats'] as const,
  regions: (countryCode: string) => ['atlas', 'regions', countryCode] as const,
};

export function useVisitedCountries() {
  return useQuery({
    queryKey: atlasKeys.countries(),
    queryFn: async () => {
      const res = await getApiClient().get<{ countries: VisitedCountry[] }>('/api/v1/atlas/countries');
      return res.data.countries;
    },
  });
}

/**
 * @deprecated S12: Atlas stats are merged into gamification stats.
 * Use `useTravelStats()` from './gamification' instead.
 */
export function useAtlasStats() {
  return useQuery({
    queryKey: atlasKeys.stats(),
    queryFn: async () => {
      const res = await getApiClient().get<{ stats: AtlasStats }>('/api/v1/atlas/stats');
      return res.data.stats;
    },
  });
}

export function useVisitedRegions(countryCode: string) {
  return useQuery({
    queryKey: atlasKeys.regions(countryCode),
    queryFn: async () => {
      const res = await getApiClient().get<{ regions: VisitedRegion[] }>(
        `/api/v1/atlas/regions/${countryCode}`,
      );
      return res.data.regions;
    },
    enabled: Boolean(countryCode),
  });
}

export function useMarkCountryVisited() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await getApiClient().post<{ country: VisitedCountry }>(
        `/api/v1/atlas/countries/${code}`,
      );
      return res.data.country;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: atlasKeys.countries() });
      queryClient.invalidateQueries({ queryKey: atlasKeys.stats() });
    },
  });
}

export function useUnmarkCountry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      await getApiClient().delete(`/api/v1/atlas/countries/${code}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: atlasKeys.countries() });
      queryClient.invalidateQueries({ queryKey: atlasKeys.stats() });
    },
  });
}

export function useMarkRegionVisited() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ regionCode, countryCode }: { regionCode: string; countryCode: string }) => {
      const res = await getApiClient().post<{ region: VisitedRegion }>(
        `/api/v1/atlas/regions/${regionCode}`,
        { countryCode },
      );
      return res.data.region;
    },
    onSuccess: (_data, { countryCode }) => {
      queryClient.invalidateQueries({ queryKey: atlasKeys.regions(countryCode) });
    },
  });
}
