import { Router } from 'express';
import axios from 'axios';

import { authenticate } from '../middleware/auth';

const router = Router();

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

// 5-minute in-memory cache keyed by lat,lng,type
const weatherCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function cacheGet(key: string): unknown | null {
  const entry = weatherCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    weatherCache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key: string, data: unknown): void {
  weatherCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm',
};

// GET /api/v1/weather/current
router.get('/current', authenticate, async (req, res, next) => {
  try {
    const { lat, lng } = req.query as { lat: string; lng: string };
    if (!lat || !lng) {
      res.status(400).json({ success: false, error: 'lat and lng required' });
      return;
    }

    const cacheKey = `curr:${parseFloat(lat).toFixed(2)}:${parseFloat(lng).toFixed(2)}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, current: cached, cached: true });
      return;
    }

    const { data } = await axios.get(OPEN_METEO_BASE, {
      params: {
        latitude: lat,
        longitude: lng,
        current_weather: true,
        hourly: 'relative_humidity_2m,apparent_temperature',
        forecast_days: 1,
        timezone: 'auto',
      },
      timeout: 8000,
    });

    const raw = (data as Record<string, unknown>).current_weather as Record<string, unknown>;
    const hourly = (data as Record<string, unknown>).hourly as Record<string, unknown[]> | undefined;

    const current = {
      temperature: raw?.temperature,
      windspeed: raw?.windspeed,
      weathercode: raw?.weathercode,
      description: WMO_DESCRIPTIONS[raw?.weathercode as number] ?? 'Unknown',
      isDay: raw?.is_day === 1,
      time: raw?.time,
      humidity: hourly?.relative_humidity_2m?.[0] ?? null,
      feelsLike: hourly?.apparent_temperature?.[0] ?? null,
    };

    cacheSet(cacheKey, current);
    res.json({ success: true, current });
  } catch (err) { next(err); }
});

// GET /api/v1/weather/forecast
router.get('/forecast', authenticate, async (req, res, next) => {
  try {
    const { lat, lng, days = '7' } = req.query as { lat: string; lng: string; days?: string };
    if (!lat || !lng) {
      res.status(400).json({ success: false, error: 'lat and lng required' });
      return;
    }

    const forecastDays = Math.min(parseInt(days, 10), 16);
    const cacheKey = `fcst:${parseFloat(lat).toFixed(2)}:${parseFloat(lng).toFixed(2)}:${forecastDays}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, forecast: cached, cached: true });
      return;
    }

    const { data } = await axios.get(OPEN_METEO_BASE, {
      params: {
        latitude: lat,
        longitude: lng,
        daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max',
        current_weather: true,
        forecast_days: forecastDays,
        timezone: 'auto',
      },
      timeout: 8000,
    });

    const daily = (data as Record<string, unknown>).daily as Record<string, unknown[]>;
    const dates = daily?.time ?? [];

    const forecast = dates.map((_: unknown, i: number) => ({
      date: daily.time?.[i] as string,
      weathercode: daily.weathercode?.[i],
      description: WMO_DESCRIPTIONS[(daily.weathercode?.[i] as number) ?? 0] ?? 'Unknown',
      tempMax: daily.temperature_2m_max?.[i],
      tempMin: daily.temperature_2m_min?.[i],
      precipitationProbability: daily.precipitation_probability_max?.[i],
      windspeedMax: daily.windspeed_10m_max?.[i],
    }));

    cacheSet(cacheKey, forecast);
    res.json({ success: true, forecast });
  } catch (err) { next(err); }
});

export default router;
