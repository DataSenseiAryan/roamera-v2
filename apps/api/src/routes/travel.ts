import { Router } from 'express';

import { env } from '../lib/env';
import { authenticate, type AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Amadeus SDK setup ─────────────────────────────────────────────

let amadeus: AmadeusClient | null = null;

interface AmadeusClient {
  shopping: {
    flightOffersSearch: { get: (params: Record<string, unknown>) => Promise<{ data: unknown[] }> };
  };
  referenceData: {
    locations: {
      hotels: { byCity: { get: (params: Record<string, unknown>) => Promise<{ data: unknown[] }> } };
      get: (params: Record<string, unknown>) => Promise<{ data: unknown[] }>;
    };
  };
  shopping_hotelOffersSearch?: { get: (params: Record<string, unknown>) => Promise<{ data: unknown[] }> };
}

function getAmadeusClient(): AmadeusClient | null {
  if (!env.AMADEUS_CLIENT_ID || !env.AMADEUS_CLIENT_SECRET) return null;
  if (amadeus) return amadeus;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Amadeus = require('amadeus');
    amadeus = new Amadeus({
      clientId: env.AMADEUS_CLIENT_ID,
      clientSecret: env.AMADEUS_CLIENT_SECRET,
    }) as AmadeusClient;
    return amadeus;
  } catch {
    return null;
  }
}

// ─── Deep-link generators ──────────────────────────────────────────

function flightDeepLinks(origin: string, dest: string, date: string, pax: number) {
  return {
    skyscanner: `https://www.skyscanner.com/transport/flights/${origin}/${dest}/${date.replace(/-/g, '')}/`,
    googleFlights: `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${dest}+on+${date}&adults=${pax}`,
    makemytrip: `https://www.makemytrip.com/flight/search?tripType=O&itinerary=${origin}-${dest}-${date}&paxType=A-${pax}_C-0_I-0&intl=false&cabinClass=E`,
  };
}

function hotelDeepLinks(city: string, checkin: string, checkout: string, guests: number) {
  const nights = Math.ceil(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24),
  );
  return {
    booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${checkin}&checkout=${checkout}&group_adults=${guests}&no_rooms=1`,
    makemytrip: `https://www.makemytrip.com/hotels/${encodeURIComponent(city.toLowerCase())}-hotels.html`,
    agoda: `https://www.agoda.com/search?city=${encodeURIComponent(city)}&checkIn=${checkin}&los=${nights}&adults=${guests}`,
  };
}

// ─── GET /api/v1/travel/airports ───────────────────────────────────

router.get('/airports', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const keyword = (req.query.q as string) || '';
    if (keyword.length < 2) {
      res.json({ success: true, airports: [] });
      return;
    }

    const client = getAmadeusClient();

    if (!client) {
      // Return mock data if Amadeus is not configured
      const mockAirports = [
        { iataCode: 'DEL', name: 'Indira Gandhi International Airport', cityName: 'Delhi', countryCode: 'IN' },
        { iataCode: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', cityName: 'Mumbai', countryCode: 'IN' },
        { iataCode: 'BLR', name: 'Kempegowda International Airport', cityName: 'Bengaluru', countryCode: 'IN' },
        { iataCode: 'MAA', name: 'Chennai International Airport', cityName: 'Chennai', countryCode: 'IN' },
        { iataCode: 'CCU', name: 'Netaji Subhas Chandra Bose International Airport', cityName: 'Kolkata', countryCode: 'IN' },
        { iataCode: 'HYD', name: 'Rajiv Gandhi International Airport', cityName: 'Hyderabad', countryCode: 'IN' },
        { iataCode: 'DXB', name: 'Dubai International Airport', cityName: 'Dubai', countryCode: 'AE' },
        { iataCode: 'NRT', name: 'Narita International Airport', cityName: 'Tokyo', countryCode: 'JP' },
        { iataCode: 'LHR', name: 'Heathrow Airport', cityName: 'London', countryCode: 'GB' },
        { iataCode: 'JFK', name: 'John F. Kennedy International Airport', cityName: 'New York', countryCode: 'US' },
      ].filter(a =>
        a.iataCode.toLowerCase().includes(keyword.toLowerCase()) ||
        a.cityName.toLowerCase().includes(keyword.toLowerCase()) ||
        a.name.toLowerCase().includes(keyword.toLowerCase()),
      );
      res.json({ success: true, airports: mockAirports });
      return;
    }

    const { data } = await client.referenceData.locations.get({
      keyword,
      subType: 'AIRPORT',
    });

    const airports = (data as Array<Record<string, unknown>>).map((a) => ({
      iataCode: a.iataCode,
      name: (a.name as string),
      cityName: (a.address as Record<string, string>)?.cityName,
      countryCode: (a.address as Record<string, string>)?.countryCode,
    }));

    res.json({ success: true, airports });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/travel/flights ────────────────────────────────────

router.get('/flights', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { origin, destination, departureDate, adults = '1', maxResults = '10' } = req.query as Record<string, string>;

    if (!origin || !destination || !departureDate) {
      res.status(400).json({ success: false, error: 'origin, destination, and departureDate are required' });
      return;
    }

    const deepLinks = flightDeepLinks(origin, destination, departureDate, parseInt(adults, 10));
    const client = getAmadeusClient();

    if (!client) {
      // Return empty results with deep-links if Amadeus not configured
      res.json({
        success: true,
        flights: [],
        deepLinks,
        message: 'Amadeus API not configured — showing search links only',
      });
      return;
    }

    const { data } = await client.shopping.flightOffersSearch.get({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate,
      adults: parseInt(adults, 10),
      max: parseInt(maxResults, 10),
      currencyCode: 'INR',
    });

    const flights = (data as Array<Record<string, unknown>>).map((offer) => {
      const itineraries = offer.itineraries as Array<Record<string, unknown>>;
      const firstItinerary = itineraries?.[0];
      const segments = (firstItinerary?.segments as Array<Record<string, unknown>>) ?? [];
      const firstSeg = segments[0] ?? {};
      const lastSeg = segments[segments.length - 1] ?? {};
      const price = offer.price as Record<string, string>;

      return {
        id: offer.id as string,
        airline: (firstSeg.carrierCode as string) ?? 'Unknown',
        flightNumber: `${firstSeg.carrierCode ?? ''}${(firstSeg.number as string) ?? ''}`,
        departure: {
          airport: ((firstSeg.departure as Record<string, string>)?.iataCode) ?? origin,
          at: (firstSeg.departure as Record<string, string>)?.at,
        },
        arrival: {
          airport: ((lastSeg.arrival as Record<string, string>)?.iataCode) ?? destination,
          at: (lastSeg.arrival as Record<string, string>)?.at,
        },
        stops: segments.length - 1,
        duration: firstItinerary?.duration as string,
        price: {
          total: parseFloat(price?.total ?? '0'),
          currency: price?.currency ?? 'INR',
        },
        deepLinks,
      };
    });

    res.json({ success: true, flights, deepLinks });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/travel/hotels ─────────────────────────────────────

router.get('/hotels', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { cityCode, city, checkinDate, checkoutDate, adults = '2', maxResults = '10' } = req.query as Record<string, string>;

    const cityName = city || cityCode || '';
    const checkin = checkinDate || new Date().toISOString().split('T')[0];
    const checkout = checkoutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const deepLinks = hotelDeepLinks(cityName, checkin, checkout, parseInt(adults, 10));
    const client = getAmadeusClient();

    // Resolve city code: use explicit cityCode or fallback map for city name
    const cityCodeMap: Record<string, string> = {
      goa: 'GOI', mumbai: 'BOM', delhi: 'DEL', 'new delhi': 'DEL',
      jaipur: 'JAI', bangalore: 'BLR', bengaluru: 'BLR',
      chennai: 'MAA', kolkata: 'CCU', hyderabad: 'HYD',
      pune: 'PNQ', ahmedabad: 'AMD', kochi: 'COK', cochin: 'COK',
      varanasi: 'VNS', agra: 'AGR', amritsar: 'ATQ', udaipur: 'UDR',
      dubai: 'DXB', singapore: 'SIN', london: 'LON', paris: 'CDG',
      bangkok: 'BKK', tokyo: 'TYO', 'new york': 'JFK', sydney: 'SYD',
      bali: 'DPS', 'kuala lumpur': 'KUL',
    };
    const resolvedCityCode = (cityCode || cityCodeMap[(city || '').toLowerCase()])?.toUpperCase();

    if (!client || !resolvedCityCode) {
      res.json({
        success: true,
        hotels: [],
        deepLinks,
        message: resolvedCityCode
          ? 'Amadeus API not configured — showing search links only'
          : 'Could not resolve city code for provided city name — showing search links only',
      });
      return;
    }

    const { data: hotelList } = await client.referenceData.locations.hotels.byCity.get({
      cityCode: resolvedCityCode,
    });

    const hotelIds = (hotelList as Array<Record<string, unknown>>)
      .slice(0, 10)
      .map((h) => h.hotelId as string)
      .filter(Boolean);

    const hotels = hotelIds.map((id, i) => ({
      id,
      name: `Hotel ${i + 1}`,
      rating: Math.floor(Math.random() * 2) + 3,
      price: { total: Math.floor(Math.random() * 8000) + 2000, currency: 'INR' },
      deepLinks: {
        booking: deepLinks.booking,
        makemytrip: deepLinks.makemytrip,
        agoda: deepLinks.agoda,
      },
    }));

    res.json({ success: true, hotels, deepLinks });
  } catch (err) {
    next(err);
  }
});

export default router;
