import { useQuery } from '@tanstack/react-query';

import type { MapSearchResult, OverpassResult } from '@roamera/types';

import { getApiClient } from '../client';

export const mapKeys = {
  search: (q: string) => ['maps', 'search', q] as const,
  autocomplete: (q: string) => ['maps', 'autocomplete', q] as const,
  reverse: (lat: number, lng: number) => ['maps', 'reverse', lat, lng] as const,
  overpass: (bbox: string, types: string) => ['maps', 'overpass', bbox, types] as const,
};

export function useMapSearch(q: string) {
  return useQuery({
    queryKey: mapKeys.search(q),
    queryFn: async () => {
      const res = await getApiClient().get<{ results: MapSearchResult[] }>('/api/v1/maps/search', { params: { q } });
      return res.data.results;
    },
    enabled: q.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMapAutocomplete(q: string) {
  return useQuery({
    queryKey: mapKeys.autocomplete(q),
    queryFn: async () => {
      const res = await getApiClient().get<{ results: MapSearchResult[] }>('/api/v1/maps/autocomplete', { params: { q } });
      return res.data.results;
    },
    enabled: q.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}

export function useReverseGeocode(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: mapKeys.reverse(lat ?? 0, lng ?? 0),
    queryFn: async () => {
      const res = await getApiClient().get<{ result: MapSearchResult }>('/api/v1/maps/reverse', { params: { lat, lng } });
      return res.data.result;
    },
    enabled: lat != null && lng != null,
    staleTime: 10 * 60 * 1000,
  });
}

export function useOverpassPOIs(
  bbox: { south: number; west: number; north: number; east: number } | null,
  types: string[] = [],
) {
  const bboxStr = bbox ? `${bbox.south},${bbox.west},${bbox.north},${bbox.east}` : '';
  const typesStr = types.join(',');

  return useQuery({
    queryKey: mapKeys.overpass(bboxStr, typesStr),
    queryFn: async () => {
      const res = await getApiClient().get<{ pois: OverpassResult[] }>('/api/v1/maps/overpass', {
        params: { south: bbox!.south, west: bbox!.west, north: bbox!.north, east: bbox!.east, types: typesStr || undefined },
      });
      return res.data.pois;
    },
    enabled: !!bbox,
    staleTime: 5 * 60 * 1000,
  });
}
