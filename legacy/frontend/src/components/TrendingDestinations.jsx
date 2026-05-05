import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Sparkles, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_ICONS = {
  All: '🌍', Beaches: '🏖️', Mountains: '🏔️', Deserts: '🏜️',
  Religious: '🕌', Adventure: '🪂', City: '🏙️', Islands: '🏝️',
};

export default function TrendingDestinations() {
  const [allDestinations, setAllDestinations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/destinations').then((res) => setAllDestinations(res.data));
    api.get('/destinations/categories').then((res) => setCategories(['All', ...res.data]));
  }, []);

  const visible = activeCategory === 'All'
    ? allDestinations
    : allDestinations.filter((d) => d.category === activeCategory);

  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, [activeCategory]);

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  }

  if (!allDestinations.length) return null;

  return (
    <section className="mb-12">
      <div className="flex items-end justify-between mb-5 px-1">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
            <Sparkles className="w-3 h-3" /> Explore
          </p>
          <h2 className="font-black tracking-tight leading-tight text-[var(--text)]" style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)' }}>
            Trending Destinations
          </h2>
          <p className="mt-1 text-[var(--text-muted)]" style={{ fontSize: '0.82rem' }}>Places travelers love right now</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} className="w-9 h-9 rounded-full btn-glass flex items-center justify-center text-[var(--text)] hover:text-[var(--primary)] transition-colors shadow-sm">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll(1)} className="w-9 h-9 rounded-full btn-glass flex items-center justify-center text-[var(--text)] hover:text-[var(--primary)] transition-colors shadow-sm">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2.5 overflow-x-auto pb-4 mb-1 scrollbar-none snap-x px-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.78rem] font-bold whitespace-nowrap transition-all duration-250 shrink-0 snap-start border ${
              activeCategory === cat
                ? 'text-white border-transparent scale-[1.03]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] border-[var(--border)] scale-100'
            }`}
            style={activeCategory === cat
              ? { background: 'var(--primary)', boxShadow: '0 4px 14px var(--shadow-glow)' }
              : { background: 'var(--surface)' }
            }
          >
            <span style={{ fontSize: '1rem' }}>{CATEGORY_ICONS[cat] ?? '📍'}</span>
            {cat}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div ref={scrollRef} className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 scrollbar-none snap-x px-1 pt-2">
        <AnimatePresence mode="popLayout">
            {visible.map((d) => (
            <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => navigate(`/itinerary/${d.id}`)}
                className="shrink-0 w-[min(72vw,256px)] sm:w-64 md:w-72 rounded-[2rem] overflow-hidden glass hover-card cursor-pointer snap-center group border border-[var(--border)]"
            >
                <div className="relative h-44 overflow-hidden rounded-t-[2rem]">
                <img src={d.coverImage} alt={d.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300" />
                
                <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full glass border border-[var(--border)] text-[var(--text)] shadow-sm backdrop-blur-md">
                    <span className="mr-1">{CATEGORY_ICONS[d.category] ?? '📍'}</span> {d.category}
                </span>

                <div className="absolute bottom-4 left-5 right-5">
                    <p className="text-lg font-black leading-tight text-white drop-shadow-md mb-1 group-hover:text-[var(--primary)] transition-colors">{d.name}</p>
                    <p className="text-xs font-semibold text-white/80 drop-shadow-sm flex items-center gap-1"><MapPin className="w-3 h-3 text-[var(--accent)]"/> {d.country}</p>
                </div>
                </div>

                <div className="p-5">
                <p className="text-xs font-medium line-clamp-2 mb-4 text-[var(--text-muted)] leading-relaxed group-hover:text-[var(--text)] transition-colors">{d.description}</p>
                <div className="flex flex-wrap gap-2">
                    {d.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm">
                        {tag}
                    </span>
                    ))}
                </div>
                </div>
            </motion.div>
            ))}
        </AnimatePresence>
        {visible.length === 0 && (
          <div className="w-full py-12 text-center border-2 border-dashed border-[var(--border)] rounded-[2rem] glass">
            <p className="text-sm font-bold text-[var(--text-muted)]">No destinations found for "{activeCategory}".</p>
          </div>
        )}
      </div>
    </section>
  );
}
