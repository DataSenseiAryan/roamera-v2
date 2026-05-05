import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { MapPin, Key, Star, ArrowLeft, Hotel, CalendarDays, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Stars({ count }) {
  if (!count) return null;
  return (
    <span className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < count ? 'fill-current' : 'fill-transparent opacity-30 text-white'}`} />
      ))}
    </span>
  );
}


function HotelCard({ hotel }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group glass rounded-[1.5rem] overflow-hidden hover:border-[var(--primary)] transition-all flex flex-col border border-[var(--border)] shadow-md hover:shadow-xl hover:-translate-y-1">
      <div className="relative aspect-video overflow-hidden bg-[var(--surface-hover)]">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => { e.target.src = `https://picsum.photos/seed/${hotel.id}/600/400`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/30 to-transparent opacity-90" />
        {hotel.rating && (
          <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1 shadow-sm">
            <Stars count={hotel.rating} />
          </span>
        )}
        {hotel.reviewScore && (
          <span className="absolute top-3 right-3 bg-[var(--primary)] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {hotel.reviewScore} ★
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-lg leading-tight mb-1" style={{ color: 'var(--text)' }}>{hotel.name}</h3>
        {hotel.neighbourhood && (
          <p className="text-xs font-bold uppercase tracking-wider mb-1 mt-1" style={{ color: 'var(--primary)' }}>{hotel.neighbourhood}</p>
        )}
        {hotel.address && (
          <p className="text-xs mb-1 font-medium flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><MapPin className="w-3 h-3" /> {hotel.address}</p>
        )}
        {hotel.reviewCount > 0 && (
          <p className="text-[0.65rem] font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{hotel.reviewCount.toLocaleString()} reviews</p>
        )}

        <div className="mb-5 mt-2">
          {hotel.pricePerNight ? (
            <div>
              <span className="text-2xl font-black" style={{ color: 'var(--accent)' }}>
                {hotel.currency} {hotel.pricePerNight.toLocaleString()}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--text-muted)' }}>/night</span>
              {hotel.nights > 1 && hotel.totalPrice && (
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>
                  {hotel.currency} {hotel.totalPrice.toLocaleString()} total · {hotel.nights} nights
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm italic font-medium" style={{ color: 'var(--text-muted)' }}>Price on request</p>
          )}
        </div>

        <a
          href={hotel.bookingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0770e3] hover:bg-[#0558b5] hover:shadow-lg text-white text-sm font-bold transition-all shadow-md group-hover:shadow-[#0770e3]/20"
        >
          Find Best Price
        </a>
      </div>
    </motion.div>
  );
}

export default function PlanTrip() {
  const { destination } = useParams();
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [checkin, setCheckin] = useState(today);
  const [checkout, setCheckout] = useState(nextWeek);
  const [guests, setGuests] = useState(2);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  function search() {
    setLoading(true);
    setError('');
    setResults(null);
    api.get('/hotels/search', { params: { destination, checkin, checkout, guests } })
      .then((res) => setResults(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to fetch hotels'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { search(); }, [destination]);

  const sorted = results
    ? [...results.hotels].sort((a, b) =>
        sortBy === 'rating' ? (b.reviewScore ?? 0) - (a.reviewScore ?? 0)
        : sortBy === 'price_asc' ? (a.pricePerNight ?? Infinity) - (b.pricePerNight ?? Infinity)
        : (b.pricePerNight ?? 0) - (a.pricePerNight ?? 0)
      )
    : [];

  const decoded = decodeURIComponent(destination);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[2rem] mb-10 relative h-44 sm:h-56 md:h-64 overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-dim)] via-[var(--primary)] to-[var(--accent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mixing-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/20 to-transparent opacity-80" />
        
        <div className="absolute inset-0 flex flex-col justify-end px-5 sm:px-8 pb-6 sm:pb-10 z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-1 filter drop-shadow-md">Hotels in</p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mb-3 text-white filter drop-shadow-lg tracking-tight">{results?.destination ?? decoded}</h1>
          <div className="flex items-center gap-2">
            <SkyscannerLogo />
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Powered by Skyscanner</span>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="absolute top-5 left-5 text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full px-4 py-2 text-xs font-bold flex items-center gap-1 border border-white/10 transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </motion.div>

      {/* Search bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-[1.5rem] p-4 sm:p-5 mb-10 flex flex-col md:flex-row gap-4 items-end border border-[var(--border)] shadow-md relative z-20 -mt-10 sm:-mt-16 md:-mt-20 mx-2 sm:mx-4 md:mx-10 backdrop-blur-2xl">
        <div className="flex-1 w-full relative">
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><CalendarDays className="w-3.5 h-3.5 text-[var(--primary)]" /> Check-in</label>
          <input type="date" value={checkin} min={today} onChange={(e) => setCheckin(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-colors outline-none" />
        </div>
        <div className="flex-1 w-full relative">
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><CalendarDays className="w-3.5 h-3.5 text-[var(--primary)]" /> Check-out</label>
          <input type="date" value={checkout} min={checkin} onChange={(e) => setCheckout(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-colors outline-none" />
        </div>
        <div className="w-full md:w-36 relative">
          <label className="block text-[0.65rem] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><Users className="w-3.5 h-3.5 text-[var(--primary)]" /> Guests</label>
          <select value={guests} onChange={(e) => setGuests(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)] focus:bg-[var(--surface)] transition-colors outline-none appearance-none">
            {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <button onClick={search}
          className="w-full md:w-auto bg-[#0770e3] hover:bg-[#0558b5] text-white px-8 py-3.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-[#0770e3]/50">
          Search
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* API key not set */}
        {error?.includes('RapidAPI key') && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="glass rounded-[2rem] p-8 text-center border border-amber-500/20 max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
               <Key className="w-8 h-8 text-amber-400" />
            </div>
            <p className="font-bold text-amber-500 text-lg mb-2">RapidAPI key required</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Open <code className="bg-[var(--surface-hover)] px-2 py-1 rounded-md text-[var(--primary)] border border-[var(--border)]">backend/.env</code> and set:
            </p>
            <code className="block bg-[var(--surface-hover)] text-[var(--primary)] text-sm rounded-xl px-6 py-4 mb-6 border border-[var(--border)] font-mono font-semibold shadow-inner">
              RAPIDAPI_KEY=your_key_here
            </code>
            <ol className="text-sm text-left max-w-sm mx-auto space-y-2 mb-8 font-medium" style={{ color: 'var(--text-muted)' }}>
              <li>1. Sign up free at <strong className="text-[var(--text)]">rapidapi.com</strong></li>
              <li>2. Search for <strong className="text-[var(--text)]">"Skyscanner API"</strong></li>
              <li>3. Subscribe to the free tier</li>
              <li>4. Copy your key and paste in <code className="bg-[var(--surface-hover)] px-1 rounded text-[var(--primary)] border border-[var(--border)] font-mono">.env</code></li>
            </ol>
            <a
              href="https://rapidapi.com/skyscanner/api/skyscanner-api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#0770e3] hover:bg-[#0558b5] text-white text-sm font-bold px-8 py-3 rounded-xl shadow-md transition-colors"
            >
              Get Skyscanner API key →
            </a>
          </motion.div>
        )}

        {error && !error.includes('RapidAPI key') && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-red-500 glass rounded-2xl p-5 border border-red-500/20 max-w-xl mx-auto font-semibold shadow-sm">{error}</motion.p>
        )}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-20 gap-4">
            <div className="relative w-16 h-16 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl flex items-center justify-center shadow-inner">
               <Hotel className="w-8 h-8 text-[var(--primary)] animate-pulse" />
               <div className="absolute inset-0 rounded-2xl border-2 border-[var(--primary)] border-t-transparent animate-spin opacity-50" />
            </div>
            <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Searching Skyscanner for hotels…</p>
          </motion.div>
        )}

        {results && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                <span className="font-black px-2 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border)] mr-1" style={{ color: 'var(--text)' }}>{sorted.length}</span> hotels · <span className="font-bold text-[var(--primary)]">{results.nights} night{results.nights !== 1 ? 's' : ''}</span>
              </p>
              <div className="flex items-center gap-3">
                <label className="text-[0.65rem] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sort</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm rounded-xl px-4 py-2 font-bold cursor-pointer bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] focus:border-[var(--primary)] outline-none appearance-none hover:bg-[var(--surface-hover)] transition-colors shadow-sm">
                  <option value="rating">Top rated</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
              </div>
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-20 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] shadow-sm max-w-2xl mx-auto">
                <p className="text-5xl mb-4">🔭</p>
                <p className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>No hotels found.</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try adjusting your dates or destination.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-12">
                {sorted.map((hotel, i) => (
                   <motion.div key={hotel.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                       <HotelCard hotel={hotel} />
                   </motion.div>
                ))}
              </div>
            )}

            {sorted.length > 0 && (
              <div className="text-center">
                <a
                  href={results.skyscannerSearchLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[#0770e3] text-[var(--text)] text-sm font-bold px-8 py-3 rounded-xl transition-all shadow-sm"
                >
                  <SkyscannerLogo />
                  See all results on Skyscanner
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
