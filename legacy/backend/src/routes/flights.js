const router = require('express').Router();
const axios = require('axios');
const { resolveIata } = require('../lib/cityToIata');

const SERPAPI_KEY = process.env.SERPAPI_KEY;

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ');
}

router.get('/search', async (req, res) => {
  if (!SERPAPI_KEY || SERPAPI_KEY === 'your_serpapi_key') {
    return res.status(503).json({
      error: 'SerpAPI key not configured. Add SERPAPI_KEY to backend/.env',
    });
  }

  const { origin, destination, date, adults = 1 } = req.query;
  if (!origin || !destination || !date) {
    return res.status(400).json({ error: 'origin, destination, and date are required' });
  }

  const originCode = resolveIata(origin);
  const destCode = resolveIata(destination);

  const serpRes = await axios.get('https://serpapi.com/search', {
    params: {
      engine: 'google_flights',
      departure_id: originCode,
      arrival_id: destCode,
      outbound_date: date,
      adults: parseInt(adults),
      currency: 'INR',
      hl: 'en',
      gl: 'us',
      type: 2, // one-way
      api_key: SERPAPI_KEY,
    },
  });

  const best = serpRes.data?.best_flights ?? [];
  const other = serpRes.data?.other_flights ?? [];

  const flights = [...best, ...other].slice(0, 12).map((option, idx) => {
    const first = option.flights[0];
    const last = option.flights[option.flights.length - 1];
    return {
      id: option.departure_token ?? `flight-${idx}`,
      airline: first.airline,
      airlineLogo: first.airline_logo ?? null,
      flightNumber: first.flight_number,
      origin: first.departure_airport.id,
      destination: last.arrival_airport.id,
      originName: first.departure_airport.name,
      destinationName: last.arrival_airport.name,
      departure: first.departure_airport.time,
      arrival: last.arrival_airport.time,
      duration: formatDuration(option.total_duration),
      stops: option.flights.length - 1,
      price: option.price,
      currency: 'INR',
      isBest: idx < best.length,
    };
  });

  res.json({
    origin: { name: origin },
    destination: { name: destination },
    date,
    adults: parseInt(adults),
    flights,
  });
});

module.exports = router;
