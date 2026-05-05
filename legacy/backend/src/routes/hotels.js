const router = require('express').Router();
const axios = require('axios');

const SERPAPI_KEY = process.env.SERPAPI_KEY;

function tomorrowDate() {
  return new Date(Date.now() + 86400000).toISOString().slice(0, 10);
}
function weekFromNow() {
  return new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
}

router.get('/search', async (req, res) => {
  if (!SERPAPI_KEY || SERPAPI_KEY === 'your_serpapi_key') {
    return res.status(503).json({
      error: 'SerpAPI key not configured. Add SERPAPI_KEY to backend/.env — get a free key at serpapi.com',
    });
  }

  const { destination = '', checkin, checkout, guests = 2 } = req.query;
  const adults = parseInt(guests);
  const checkinDate = checkin || tomorrowDate();
  const checkoutDate = checkout || weekFromNow();
  const nights = Math.max(1, Math.round(
    (new Date(checkoutDate) - new Date(checkinDate)) / 86400000
  ));

  const serpRes = await axios.get('https://serpapi.com/search', {
    params: {
      engine: 'google_hotels',
      q: destination,
      check_in_date: checkinDate,
      check_out_date: checkoutDate,
      adults,
      currency: 'INR',
      hl: 'en',
      gl: 'us',
      api_key: SERPAPI_KEY,
    },
  });

  const raw = serpRes.data?.properties ?? [];

  const hotels = raw.slice(0, 15).map((h) => {
    const price = h.rate_per_night?.extracted_lowest ?? null;
    return {
      id: h.property_token ?? h.name,
      name: h.name,
      rating: h.class ?? null,
      reviewScore: h.overall_rating ?? null,
      reviewCount: h.reviews ?? 0,
      address: h.location ?? '',
      neighbourhood: null,
      image: h.images?.[0]?.original_image ?? h.images?.[0]?.thumbnail
        ?? `https://picsum.photos/seed/${encodeURIComponent(h.name)}/600/400`,
      pricePerNight: price,
      totalPrice: price ? Math.round(price * nights) : null,
      currency: 'INR',
      nights,
      deal: h.deal ?? null,
      bookingLink: h.link ?? `https://www.google.com/travel/hotels?q=${encodeURIComponent(destination)}`,
    };
  });

  res.json({
    destination,
    checkin: checkinDate,
    checkout: checkoutDate,
    guests: adults,
    nights,
    hotels,
  });
});

module.exports = router;
