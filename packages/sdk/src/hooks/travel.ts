import { useQuery } from '@tanstack/react-query';

import type {
  Airport,
  FlightResult,
  FlightSearch,
  HotelResult,
  HotelSearch,
} from '@roamera/types';

import { getApiClient } from '../client';

export const travelKeys = {
  airports: (q: string) => ['travel', 'airports', q] as const,
  flights: (params: Partial<FlightSearch>) => ['travel', 'flights', params] as const,
  hotels: (params: Partial<HotelSearch>) => ['travel', 'hotels', params] as const,
};

// ─── Airport Autocomplete ──────────────────────────────────────────

export function useAirportSearch(q: string) {
  return useQuery({
    queryKey: travelKeys.airports(q),
    queryFn: async (): Promise<Airport[]> => {
      const { data } = await getApiClient().get('/api/v1/travel/airports', { params: { q } });
      return (data.airports as Airport[]) ?? [];
    },
    enabled: q.length >= 2,
    staleTime: 5 * 60_000,
  });
}

// ─── Flight Search ─────────────────────────────────────────────────

interface FlightSearchResult {
  flights: FlightResult[];
  deepLinks: {
    skyscanner: string;
    googleFlights: string;
    makemytrip: string;
  };
  message?: string;
}

export function useFlightSearch(params: Partial<FlightSearch>) {
  const enabled = !!(params.origin && params.destination && params.departureDate);
  return useQuery({
    queryKey: travelKeys.flights(params),
    queryFn: async (): Promise<FlightSearchResult> => {
      const { data } = await getApiClient().get('/api/v1/travel/flights', { params });
      return data as FlightSearchResult;
    },
    enabled,
    staleTime: 3 * 60_000,
    retry: 1,
  });
}

// ─── Hotel Search ──────────────────────────────────────────────────

interface HotelSearchResult {
  hotels: HotelResult[];
  deepLinks: {
    booking: string;
    makemytrip: string;
    agoda: string;
  };
  message?: string;
}

export function useHotelSearch(params: Partial<HotelSearch>) {
  const enabled = !!(params.cityCode || params.city);
  return useQuery({
    queryKey: travelKeys.hotels(params),
    queryFn: async (): Promise<HotelSearchResult> => {
      const { data } = await getApiClient().get('/api/v1/travel/hotels', { params });
      return data as HotelSearchResult;
    },
    enabled,
    staleTime: 3 * 60_000,
    retry: 1,
  });
}
