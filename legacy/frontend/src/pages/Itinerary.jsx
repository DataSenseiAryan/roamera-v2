import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, MapPin, CalendarDays, Navigation, Lightbulb, ChevronRight, Hotel, Globe2, Map, Sparkles } from 'lucide-react';

const DAY_COLORS = ['var(--primary)', 'var(--accent)', 'var(--warning)', 'var(--success)', 'var(--info)'];
const DAY_COLORS_DIM = ['var(--primary-dim)', 'var(--accent-dim)', 'rgba(min(var(--warning)), 0.1)', 'rgba(min(var(--success)), 0.1)', 'rgba(min(var(--info)), 0.1)'];

export default function Itinerary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/destinations/${id}/itinerary`)
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load itinerary.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="text-center py-24 px-4 text-[var(--text-muted)] flex flex-col items-center justify-center min-h-[60vh]">
      <MapPin className="w-16 h-16 mb-4 opacity-50" />
      <p className="text-lg font-bold">{error || 'Itinerary not found.'}</p>
    </div>
  );

  const { destination, days, nearby } = data;
  const current = days[activeDay];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">

      {/* Hero */}
      <div className="relative h-[280px] sm:h-[340px] rounded-b-[2rem] sm:rounded-[2.5rem] mb-10 overflow-hidden group shadow-lg border-b border-[var(--border)] sm:border sm:mt-6">
        <img
          src={destination.coverImage}
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/40 to-transparent" />
        <button onClick={() => navigate(-1)}
          className="absolute top-5 left-5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white p-2.5 transition-all hover:bg-black/60 shadow-sm z-10 hover:scale-105">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
             <p className="m-0 mb-1.5 text-white/80 text-xs sm:text-sm font-bold flex items-center gap-1.5 uppercase tracking-wider drop-shadow-md"><MapPin className="w-3.5 h-3.5 text-[var(--accent)]" /> {destination.country}</p>
             <h1 className="m-0 text-white text-3xl sm:text-5xl font-black leading-tight drop-shadow-lg">{destination.name}</h1>
             <p className="m-0 mt-2 text-white/90 text-sm font-semibold flex items-center gap-2 drop-shadow-md bg-black/30 backdrop-blur-sm self-start inline-flex px-3 py-1.5 rounded-lg border border-white/10"><CalendarDays className="w-4 h-4 text-[var(--primary)]" /> {days.length}-Day Curated Journey</p>
          </motion.div>
        </div>
      </div>

      {/* Day selector tabs */}
      <div className="flex gap-2 overflow-x-auto mb-8 pb-3 scrollbar-none snap-x snap-mandatory mask-linear-fade">
        {days.map((d, i) => (
          <button key={i} onClick={() => setActiveDay(i)}
            className={`snap-start shrink-0 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 relative border ${
              activeDay === i 
                ? 'text-[var(--primary)] bg-[var(--primary-dim)] border-[var(--primary)]/40 shadow-sm scale-105 z-10' 
                : 'text-[var(--text-muted)] bg-[var(--surface-hover)] border-transparent hover:bg-[var(--surface)] hover:text-[var(--text)]'
            }`}
          >
             <span className="relative z-10 flex items-center gap-2">Day {d.day}</span>
          </button>
        ))}
      </div>

      {/* Day content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Day Details (Left/Main Column) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeDay} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
               className="glass border border-[var(--border)] rounded-[2rem] p-6 sm:p-8 relative overflow-hidden"
            >
               {/* Ambient background glow based on active day color (simulated with CSS vars as fallback) */}
               <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] opacity-20 pointer-events-none" style={{ backgroundColor: DAY_COLORS[activeDay % DAY_COLORS.length] || 'var(--primary)' }} />

              <div className="flex items-start sm:items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-inner border"
                     style={{ backgroundColor: DAY_COLORS_DIM[activeDay % DAY_COLORS_DIM.length] || 'var(--primary-dim)', color: DAY_COLORS[activeDay % DAY_COLORS.length] || 'var(--primary)', borderColor: `${DAY_COLORS[activeDay % DAY_COLORS.length] || 'var(--primary)'}33` }}>
                  D{current.day}
                </div>
                <div>
                  <p className="m-0 text-[var(--accent)] text-[0.65rem] font-black uppercase tracking-widest mb-1 opacity-80 flex items-center gap-1.5"><Globe2 className="w-3 h-3" /> Day Focus</p>
                  <h2 className="m-0 text-[var(--text)] text-xl sm:text-2xl font-black leading-tight">{current.title}</h2>
                </div>
              </div>

              {/* Places */}
              <div className="mb-8">
                <h3 className="m-0 mb-4 text-[0.7rem] text-[var(--text-muted)] font-black uppercase tracking-widest flex items-center gap-2"><Navigation className="w-3.5 h-3.5 text-[var(--primary)]" /> Places to Visit</h3>
                <div className="flex flex-col gap-3 relative pl-3">
                   {/* Vertical timeline line */}
                   <div className="absolute left-[1.15rem] top-4 bottom-4 w-px bg-[var(--border)] opacity-50" />
                   
                  {current.places.map((place, pi) => (
                    <motion.div key={pi} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: pi * 0.1 }} className="flex items-center gap-3 relative z-10 group bg-[var(--surface-hover)] rounded-xl p-2.5 pr-4 border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
                      <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[0.65rem] font-black shadow-sm"
                           style={{ backgroundColor: DAY_COLORS_DIM[activeDay % DAY_COLORS_DIM.length] || 'var(--primary-dim)', color: DAY_COLORS[activeDay % DAY_COLORS.length] || 'var(--primary)', border: `1px solid ${DAY_COLORS[activeDay % DAY_COLORS.length] || 'var(--primary)'}33` }}>
                        {pi + 1}
                      </div>
                      <span className="text-[var(--text)] text-sm font-semibold group-hover:text-[var(--primary)] transition-colors">{place}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tip */}
              <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm relative overflow-hidden group hover:border-[var(--accent)]/30 transition-colors">
                 <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[var(--accent)]/10 rounded-full blur-2xl group-hover:bg-[var(--accent)]/20 transition-colors pointer-events-none" />
                <div className="mt-0.5 shrink-0 bg-[var(--bg)] p-2 rounded-xl shadow-inner border border-[var(--border)]">
                   <Lightbulb className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div className="flex-1 relative z-10">
                   <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Local Tip</h4>
                   <p className="m-0 text-[var(--text)] text-[0.85rem] leading-relaxed font-medium">{current.tips}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* All days overview (Right/Sidebar) */}
        <div className="glass border border-[var(--border)] rounded-[2rem] p-6 lg:self-start lg:sticky lg:top-24 shadow-sm">
          <h3 className="m-0 mb-5 text-[0.7rem] text-[var(--text-muted)] font-black uppercase tracking-widest flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-[var(--primary)]" /> Itinerary Overview</h3>
          <div className="flex flex-col gap-1 relative">
             <div className="absolute left-[1.125rem] top-4 bottom-4 w-px bg-[var(--border)] hidden sm:block" />
             
            {days.map((d, i) => (
              <button key={i} onClick={() => setActiveDay(i)}
                className={`flex items-start gap-4 p-3 rounded-xl transition-all duration-200 text-left w-full group relative z-10 ${
                  activeDay === i ? 'bg-[var(--primary-dim)] border border-[var(--primary)]/30 shadow-sm' : 'bg-transparent border border-transparent hover:bg-[var(--surface-hover)]'
                }`}>
                <div className={`w-9 h-9 rounded-[0.6rem] shrink-0 flex items-center justify-center font-black text-xs transition-colors shadow-sm ${
                    activeDay === i 
                      ? 'bg-[var(--primary)] text-white' 
                      : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] group-hover:text-[var(--primary)]'
                  }`}>
                  {d.day}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`m-0 font-bold text-[0.85rem] truncate transition-colors ${activeDay === i ? 'text-[var(--primary)]' : 'text-[var(--text)] group-hover:text-[var(--primary)]'}`}>{d.title}</p>
                  <p className="m-0 mt-0.5 text-[0.65rem] font-semibold text-[var(--text-muted)] truncate opacity-80 group-hover:opacity-100 transition-opacity">
                    {d.places.length} stops · {d.places[0]}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 mt-2 transition-transform ${activeDay === i ? 'text-[var(--primary)] translate-x-1' : 'text-[var(--text-muted)] opacity-50 group-hover:text-[var(--primary)] group-hover:translate-x-0.5 group-hover:opacity-100'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nearby destinations */}
      {nearby && nearby.length > 0 && (
        <div className="glass border border-[var(--border)] rounded-[2rem] p-6 sm:p-8 mb-10 shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-[80px] pointer-events-none" />
           <h3 className="m-0 mb-5 text-[0.7rem] text-[var(--text-muted)] font-black uppercase tracking-widest flex items-center gap-2"><Map className="w-3.5 h-3.5 text-[var(--primary)]" /> Nearby Destinations</h3>
          <div className="flex flex-wrap gap-2.5 relative z-10">
            {nearby.map((place) => (
              <span key={place} className="px-4 py-2 rounded-full text-xs font-bold bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary-dim)] transition-all cursor-pointer shadow-sm">
                {place}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Book hotels CTA */}
      <div className="relative rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden border border-[var(--primary)]/40 shadow-lg group hover:shadow-xl transition-shadow cursor-default">
         <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-90" />
         {/* Subtle animated pattern/gradient overlay */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay" />
         
        <div className="relative z-10 text-center sm:text-left flex-1">
          <p className="m-0 mb-1.5 text-white/80 text-xs font-bold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5"><Sparkles className="w-3 h-3" /> Ready to go?</p>
          <p className="m-0 text-white font-black text-xl sm:text-2xl drop-shadow-md">Book your stay in {destination.name}</p>
        </div>
        <Link to={`/plan/${encodeURIComponent(destination.name)}`}
          className="relative z-10 px-6 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white font-bold text-sm flex items-center gap-2 transition-all shadow-sm group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] shrink-0 w-full sm:w-auto justify-center">
          <Hotel className="w-4 h-4" /> Explore Hotels
        </Link>
      </div>
    </div>
  );
}
