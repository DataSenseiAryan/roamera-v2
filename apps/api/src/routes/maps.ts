import { Router } from 'express';
import axios from 'axios';

import { authenticate } from '../middleware/auth';

const router = Router();

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'Roamera/2.0 (contact@roamera.in)';

// Simple in-memory rate limiter for Nominatim (max 1 req/s)
let lastNominatimCall = 0;
async function nominatimThrottle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastNominatimCall;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  lastNominatimCall = Date.now();
}

// Simple in-memory cache for map results
const mapCache = new Map<string, { data: unknown; expiresAt: number }>();
const MAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheGet(key: string): unknown | null {
  const entry = mapCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    mapCache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key: string, data: unknown): void {
  mapCache.set(key, { data, expiresAt: Date.now() + MAP_CACHE_TTL });
}

// GET /api/v1/maps/search
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { q, lat, lng, limit = '10' } = req.query as Record<string, string>;
    if (!q || q.length < 2) {
      res.status(400).json({ success: false, error: 'q param with at least 2 chars required' });
      return;
    }

    const cacheKey = `search:${q}:${lat}:${lng}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, results: cached, cached: true });
      return;
    }

    await nominatimThrottle();

    const params: Record<string, string> = {
      q,
      format: 'json',
      addressdetails: '1',
      limit,
      'accept-language': 'en',
    };
    if (lat && lng) {
      params.lat = lat;
      params.lon = lng;
      params.bounded = '0';
    }

    const { data } = await axios.get(`${NOMINATIM_BASE}/search`, {
      params,
      headers: { 'User-Agent': USER_AGENT },
      timeout: 8000,
    });

    const results = (data as Array<Record<string, unknown>>).map((r) => ({
      placeId: r.place_id,
      displayName: r.display_name,
      lat: parseFloat(r.lat as string),
      lng: parseFloat(r.lon as string),
      type: r.type,
      category: r.class,
      address: r.address,
      boundingBox: r.boundingbox,
    }));

    cacheSet(cacheKey, results);
    res.json({ success: true, results });
  } catch (err) { next(err); }
});

// GET /api/v1/maps/autocomplete
router.get('/autocomplete', authenticate, async (req, res, next) => {
  try {
    const { q } = req.query as { q: string };
    if (!q || q.length < 2) {
      res.json({ success: true, results: [] });
      return;
    }

    const cacheKey = `ac:${q}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, results: cached });
      return;
    }

    await nominatimThrottle();

    const { data } = await axios.get(`${NOMINATIM_BASE}/search`, {
      params: {
        q,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        'accept-language': 'en',
      },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5000,
    });

    const results = (data as Array<Record<string, unknown>>).map((r) => ({
      placeId: r.place_id,
      displayName: r.display_name,
      shortName: (r.display_name as string).split(',')[0],
      lat: parseFloat(r.lat as string),
      lng: parseFloat(r.lon as string),
      type: r.type,
      address: r.address,
    }));

    cacheSet(cacheKey, results);
    res.json({ success: true, results });
  } catch (err) { next(err); }
});

// GET /api/v1/maps/reverse
router.get('/reverse', authenticate, async (req, res, next) => {
  try {
    const { lat, lng } = req.query as { lat: string; lng: string };
    if (!lat || !lng) {
      res.status(400).json({ success: false, error: 'lat and lng are required' });
      return;
    }

    const cacheKey = `rev:${parseFloat(lat).toFixed(4)}:${parseFloat(lng).toFixed(4)}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, result: cached });
      return;
    }

    await nominatimThrottle();

    const { data } = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: { lat, lon: lng, format: 'json', 'accept-language': 'en' },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5000,
    });

    const result = {
      placeId: (data as Record<string, unknown>).place_id,
      displayName: (data as Record<string, unknown>).display_name,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: (data as Record<string, unknown>).address,
    };

    cacheSet(cacheKey, result);
    res.json({ success: true, result });
  } catch (err) { next(err); }
});

// GET /api/v1/maps/overpass — POI search in bounding box
router.get('/overpass', authenticate, async (req, res, next) => {
  try {
    const { south, west, north, east, types } = req.query as {
      south: string; west: string; north: string; east: string; types?: string;
    };

    if (!south || !west || !north || !east) {
      res.status(400).json({ success: false, error: 'south, west, north, east bbox params required' });
      return;
    }

    const requestedTypes = types ? types.split(',') : ['restaurant', 'hotel', 'attraction', 'museum', 'cafe'];

    const typeFilters: Record<string, string> = {
      restaurant: 'amenity~"restaurant|food_court"',
      hotel: 'tourism~"hotel|hostel|guest_house"',
      attraction: 'tourism~"attraction|viewpoint|zoo|theme_park"',
      museum: 'tourism~"museum|gallery"',
      cafe: 'amenity~"cafe|bar"',
      transport: 'amenity~"bus_station|taxi|ferry_terminal"',
      shopping: 'shop~"mall|supermarket|market"',
    };

    const bbox = `${south},${west},${north},${east}`;
    const cacheKey = `overpass:${bbox}:${requestedTypes.join(',')}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, pois: cached });
      return;
    }

    const filters = requestedTypes
      .filter((t) => typeFilters[t])
      .map((t) => `node[${typeFilters[t]}](${bbox});`)
      .join('\n');

    const overpassQuery = `[out:json][timeout:15];\n(\n${filters || `node["tourism"](${bbox});`}\n);\nout body;`;

    const { data } = await axios.post(OVERPASS_BASE, overpassQuery, {
      headers: { 'Content-Type': 'text/plain' },
      timeout: 20000,
    });

    const pois = ((data as { elements?: Array<Record<string, unknown>> }).elements ?? [])
      .slice(0, 50)
      .map((el) => ({
        id: el.id,
        name: (el.tags as Record<string, string>)?.name ?? 'Unnamed',
        lat: el.lat,
        lng: el.lon,
        type: (el.tags as Record<string, string>)?.amenity ?? (el.tags as Record<string, string>)?.tourism ?? 'place',
        tags: el.tags,
      }));

    cacheSet(cacheKey, pois);
    res.json({ success: true, pois });
  } catch (err) { next(err); }
});

export default router;
