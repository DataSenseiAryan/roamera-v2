import { useState } from 'react';
import { Plane, Hotel, MapPin, Calendar, Users, Search, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

function Stars({ count }) {
  if (!count) return null;
  return (
    <span className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < count ? 'fill-current' : 'fill-transparent opacity-30'}`} />
      ))}
    </span>
  );
}

function FlightCard({ flight }) {
  // SerpAPI returns "YYYY-MM-DD HH:mm" — extract the time portion directly
  const depTime = flight.departure?.split(' ')[1] ?? '';
  const arrTime = flight.arrival?.split(' ')[1] ?? '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[1.5rem] p-5 border border-[var(--border)] hover:border-[var(--primary)] transition-all shadow-md hover:shadow-xl hover:-translate-y-1"
    >
      {/* Airline + price row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {flight.airlineLogo ? (
            <img src={flight.airlineLogo} alt={flight.airline} className="w-8 h-8 object-contain rounded-md" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-dim)' }}>
              <Plane className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            </div>
          )}
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{flight.airline}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{flight.flightNumber}</p>
          </div>
        </div>
        <div className="text-right">
          {flight.isBest && (
            <span className="text-[0.6rem] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 inline-block" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
              Best deal
            </span>
          )}
          <p className="text-2xl font-black" style={{ color: 'var(--accent)' }}>
            ${flight.price?.toLocaleString()}
          </p>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>per person</p>
        </div>
      </div>

      {/* Route row */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-center">
          <p className="text-xl font-black" style={{ color: 'var(--text)' }}>{depTime}</p>
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{flight.origin}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{flight.duration}</p>
          <div className="w-full flex items-center">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <Plane className="w-3.5 h-3.5 mx-1" style={{ color: 'var(--primary)' }} />
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
          <p className="text-xs font-bold" style={{ color: flight.stops === 0 ? 'var(--primary)' : 'var(--accent)' }}>
            {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black" style={{ color: 'var(--text)' }}>{arrTime}</p>
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{flight.destination}</p>
        </div>
      </div>
    </motion.div>
  );
}

function HotelCard({ hotel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="group glass rounded-[1.5rem] overflow-hidden border border-[var(--border)] hover:border-[var(--primary)] transition-all shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col"
    >
      <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--surface-hover)' }}>
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => { e.target.src = `https://picsum.photos/seed/${hotel.id}/600/400`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/30 to-transparent opacity-90" />
        {hotel.rating && (
          <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1">
            <Stars count={hotel.rating} />
          </span>
        )}
        {hotel.reviewScore && (
          <span className="absolute top-3 right-3 text-white text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--primary)' }}>
            {hotel.reviewScore} ★
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-base leading-tight mb-1" style={{ color: 'var(--text)' }}>{hotel.name}</h3>
        {hotel.neighbourhood && (
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--primary)' }}>{hotel.neighbourhood}</p>
        )}
        {hotel.address && (
          <p className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <MapPin className="w-3 h-3" /> {hotel.address}
          </p>
        )}
        {hotel.reviewCount > 0 && (
          <p className="text-[0.65rem] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
            {hotel.reviewCount.toLocaleString()} reviews
          </p>
        )}

        {hotel.deal && (
          <p className="text-xs font-bold mb-2 px-2 py-1 rounded-lg inline-block" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
            🏷️ {hotel.deal}
          </p>
        )}

        <div className="mt-auto mb-4">
          {hotel.pricePerNight ? (
            <div>
              <span className="text-2xl font-black" style={{ color: 'var(--accent)' }}>
                {hotel.currency} {hotel.pricePerNight.toLocaleString()}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--text-muted)' }}>/night</span>
              {hotel.nights > 1 && hotel.totalPrice && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {hotel.currency} {hotel.totalPrice.toLocaleString()} total · {hotel.nights} nights
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Price on request</p>
          )}
        </div>

        <a
          href={hotel.bookingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-md"
          style={{ background: '#0770e3' }}
        >
          Find Best Price
        </a>
      </div>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="glass rounded-[1.5rem] p-5 border border-[var(--border)] animate-pulse">
      <div className="h-4 rounded-full mb-4" style={{ background: 'var(--surface-hover)', width: '60%' }} />
      <div className="h-8 rounded-full mb-3" style={{ background: 'var(--surface-hover)' }} />
      <div className="h-4 rounded-full" style={{ background: 'var(--surface-hover)', width: '40%' }} />
    </div>
  );
}

export default function TravelLens() {
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [flightDate, setFlightDate] = useState(today);
  const [checkin, setCheckin] = useState(nextWeek);
  const [checkout, setCheckout] = useState(twoWeeks);
  const [guests, setGuests] = useState(1);
  const [tab, setTab] = useState('flights');

  const [flights, setFlights] = useState(null);
  const [hotels, setHotels] = useState(null);
  const [flightMeta, setFlightMeta] = useState(null);
  const [hotelMeta, setHotelMeta] = useState(null);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [flightError, setFlightError] = useState('');
  const [hotelError, setHotelError] = useState('');
  const [searched, setSearched] = useState(false);

  function search(e) {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    setSearched(true);
    setFlights(null);
    setHotels(null);
    setFlightError('');
    setHotelError('');

    setLoadingFlights(true);
    api.get('/flights/search', { params: { origin, destination, date: flightDate, adults: guests } })
      .then((res) => { setFlights(res.data.flights); setFlightMeta(res.data); })
      .catch((err) => setFlightError(err.response?.data?.error || 'Failed to fetch flights'))
      .finally(() => setLoadingFlights(false));

    setLoadingHotels(true);
    api.get('/hotels/search', { params: { destination, checkin, checkout, guests } })
      .then((res) => { setHotels(res.data.hotels); setHotelMeta(res.data); })
      .catch((err) => setHotelError(err.response?.data?.error || 'Failed to fetch hotels'))
      .finally(() => setLoadingHotels(false));
  }

  const busy = loadingFlights || loadingHotels;

  return (
    <div className="min-h-screen pb-24" style={{ color: 'var(--text)' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-6 max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-black tracking-tight mb-1">
          Travel<span style={{ color: 'var(--primary)' }}>Lens</span>
        </h1>
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Cheapest flights &amp; hotels to any destination
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={search} className="max-w-2xl mx-auto px-4 mb-8">
        <div className="glass rounded-[2rem] p-6 border border-[var(--border)] shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Plane className="w-3 h-3" /> From
              </span>
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. London, New York"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => { e.target.style.border = '1px solid var(--primary)'; e.target.style.outline = 'none'; }}
                onBlur={(e) => { e.target.style.border = '1px solid var(--border)'; }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <MapPin className="w-3 h-3" /> To
              </span>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Paris, Tokyo"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => { e.target.style.border = '1px solid var(--primary)'; e.target.style.outline = 'none'; }}
                onBlur={(e) => { e.target.style.border = '1px solid var(--border)'; }}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Plane className="w-3 h-3" /> Fly on
              </span>
              <input
                type="date" value={flightDate} min={today}
                onChange={(e) => setFlightDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => { e.target.style.border = '1px solid var(--primary)'; e.target.style.outline = 'none'; }}
                onBlur={(e) => { e.target.style.border = '1px solid var(--border)'; }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Calendar className="w-3 h-3" /> Check-in
              </span>
              <input
                type="date" value={checkin} min={today}
                onChange={(e) => setCheckin(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => { e.target.style.border = '1px solid var(--primary)'; e.target.style.outline = 'none'; }}
                onBlur={(e) => { e.target.style.border = '1px solid var(--border)'; }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Calendar className="w-3 h-3" /> Check-out
              </span>
              <input
                type="date" value={checkout} min={checkin}
                onChange={(e) => setCheckout(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => { e.target.style.border = '1px solid var(--primary)'; e.target.style.outline = 'none'; }}
                onBlur={(e) => { e.target.style.border = '1px solid var(--border)'; }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Users className="w-3 h-3" /> Guests
              </span>
              <input
                type="number" value={guests} min={1} max={9}
                onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => { e.target.style.border = '1px solid var(--primary)'; e.target.style.outline = 'none'; }}
                onBlur={(e) => { e.target.style.border = '1px solid var(--border)'; }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn-glow w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Search className="w-4 h-4" />
            {busy ? 'Searching...' : 'Search TravelLens'}
          </button>
        </div>
      </form>

      {/* Pre-search empty state */}
      {!searched && (
        <div className="max-w-2xl mx-auto px-4 text-center py-4">
          <div className="flex justify-center gap-6 mb-4" style={{ opacity: 0.15 }}>
            <Plane className="w-12 h-12" />
            <Hotel className="w-12 h-12" />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Enter your origin, destination and dates above to find the best deals
          </p>
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="max-w-5xl mx-auto px-4">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'flights', label: 'Flights', Icon: Plane, count: flights?.length ?? 0 },
              { key: 'hotels',  label: 'Hotels',  Icon: Hotel, count: hotels?.length ?? 0  },
            ].map(({ key, label, Icon, count }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all"
                  style={{
                    background: active ? 'var(--primary)' : 'var(--surface-hover)',
                    color: active ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {count > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{
                        background: active ? 'rgba(255,255,255,0.2)' : 'var(--primary-dim)',
                        color: active ? '#fff' : 'var(--primary)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'flights' && (
              <motion.div key="flights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {flightMeta && (
                  <p className="text-sm mb-4 font-medium" style={{ color: 'var(--text-muted)' }}>
                    {flightMeta.origin?.city} ({flightMeta.origin?.code}) → {flightMeta.destination?.city} ({flightMeta.destination?.code}) · {flightMeta.adults} adult{flightMeta.adults !== 1 ? 's' : ''}
                  </p>
                )}
                {loadingFlights && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
                  </div>
                )}
                {flightError && (
                  <div className="glass rounded-2xl p-6 border border-[var(--border)] text-center">
                    <p style={{ color: 'var(--text-muted)' }}>{flightError}</p>
                  </div>
                )}
                {!loadingFlights && !flightError && flights?.length === 0 && (
                  <div className="glass rounded-2xl p-10 text-center border border-[var(--border)]">
                    <Plane className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p style={{ color: 'var(--text-muted)' }}>No flights found for this route and date.</p>
                  </div>
                )}
                {flights?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {flights.map((f) => <FlightCard key={f.id} flight={f} />)}
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'hotels' && (
              <motion.div key="hotels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {hotelMeta && (
                  <p className="text-sm mb-4 font-medium" style={{ color: 'var(--text-muted)' }}>
                    {hotelMeta.destination} · {hotelMeta.checkin} → {hotelMeta.checkout} · {hotelMeta.guests} guest{hotelMeta.guests !== 1 ? 's' : ''}
                  </p>
                )}
                {loadingHotels && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} />)}
                  </div>
                )}
                {hotelError && (
                  <div className="glass rounded-2xl p-6 border border-[var(--border)] text-center">
                    <p style={{ color: 'var(--text-muted)' }}>{hotelError}</p>
                  </div>
                )}
                {!loadingHotels && !hotelError && hotels?.length === 0 && (
                  <div className="glass rounded-2xl p-10 text-center border border-[var(--border)]">
                    <Hotel className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p style={{ color: 'var(--text-muted)' }}>No hotels found for this destination and dates.</p>
                  </div>
                )}
                {hotels?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hotels.map((h) => <HotelCard key={h.id} hotel={h} />)}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
