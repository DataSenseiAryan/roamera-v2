import { useQuery } from '@tanstack/react-query';

import type { WeatherCurrent, WeatherForecastDay } from '@roamera/types';

import { getApiClient } from '../client';

export const weatherKeys = {
  current: (lat: number, lng: number) => ['weather', 'current', lat, lng] as const,
  forecast: (lat: number, lng: number, days: number) => ['weather', 'forecast', lat, lng, days] as const,
};

export function useCurrentWeather(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: weatherKeys.current(lat ?? 0, lng ?? 0),
    queryFn: async () => {
      const res = await getApiClient().get<{ current: WeatherCurrent }>('/api/v1/weather/current', {
        params: { lat, lng },
      });
      return res.data.current;
    },
    enabled: lat != null && lng != null,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

export function useWeatherForecast(lat: number | null, lng: number | null, days = 7) {
  return useQuery({
    queryKey: weatherKeys.forecast(lat ?? 0, lng ?? 0, days),
    queryFn: async () => {
      const res = await getApiClient().get<{ forecast: WeatherForecastDay[] }>('/api/v1/weather/forecast', {
        params: { lat, lng, days },
      });
      return res.data.forecast;
    },
    enabled: lat != null && lng != null,
    staleTime: 5 * 60 * 1000,
  });
}
