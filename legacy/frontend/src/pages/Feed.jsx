import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import JournalCard from '../components/JournalCard';
import TrendingDestinations from '../components/TrendingDestinations';
import { motion } from 'framer-motion';
import { Globe, Users, Loader2, Compass, BookOpen, Map, Search } from 'lucide-react';

/* ─── animation variants ─────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

/* ─── quick-action cards ─────────────────────────────────── */
const QUICK_ACTIONS = [
  { id: 'explore',  icon: Compass,  label: 'Explore',    sub: 'Destinations',    href: '#trending' },
  { id: 'journals', icon: BookOpen, label: 'Stories',    sub: 'Real journeys',   href: '#stories'  },
  { id: 'plan',     icon: Map,      label: 'Plan Trip',  sub: 'Build itinerary', href: '/meetways', isNav: true },
];

/* ─── smooth-scroll helper ───────────────────────────────── */
function scrollTo(href, navigate) {
  if (href.startsWith('/')) { navigate(href); return; }
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─── section divider with micro-copy ───────────────────── */
function MicroCopyDivider({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex items-center gap-4 my-12 px-1"
    >
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      <p
        className="shrink-0 text-center italic"
        style={{
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          fontWeight: 400,
          letterSpacing: '0.02em',
          maxWidth: 300,
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </motion.div>
  );
}

/* ─── component ──────────────────────────────────────────── */
export default function Feed() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [tab, setTab]               = useState('public');
  const [journals, setJournals]     = useState([]);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [hasMore, setHasMore]       = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const sentinelRef = useRef(null);

  useEffect(() => { setJournals([]); setPage(1); setHasMore(true); }, [tab]);

  useEffect(() => {
    setLoading(true);
    const endpoint = tab === 'following'
      ? `/journals/feed/following?page=${page}`
      : `/journals/feed?page=${page}`;
    api.get(endpoint)
      .then((res) => {
        setJournals((prev) => page === 1 ? res.data : [...prev, ...res.data]);
        setHasMore(res.data.length === 20);
      })
      .catch(() => setHasMore(false))
      .finally(() => setLoading(false));
  }, [page, tab]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setPage((p) => p + 1); },
      { rootMargin: '200px' }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loading]);

  function handleTabClick(next) {
    if (next === 'following' && !user) { navigate('/login'); return; }
    setTab(next);
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={stagger}
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, var(--surface) 0%, var(--bg) 100%)',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '3rem',
        }}
      >
        {/* Radial bloom — top right */}
        <div aria-hidden style={{
          position: 'absolute', top: -120, right: -80,
          width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-dim) 0%, transparent 65%)',
          opacity: 0.18, pointerEvents: 'none',
        }} />
        {/* Radial bloom — bottom left */}
        <div aria-hidden style={{
          position: 'absolute', bottom: -80, left: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-dim) 0%, transparent 65%)',
          opacity: 0.1, pointerEvents: 'none',
        }} />

        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pt-11 sm:pt-16 relative z-10">

          {/* Eyebrow */}
          <motion.p
            variants={fadeUp}
            className="flex items-center gap-2 mb-5"
            style={{
              fontSize: '0.62rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.26em',
              color: 'var(--primary)',
            }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 17, height: 17, borderRadius: '50%',
              background: 'var(--primary)', color: '#fff', fontSize: '0.5rem',
            }}>✦</span>
            Compass
          </motion.p>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="font-black tracking-tight leading-[1.08] mb-4"
            style={{
              fontSize: 'clamp(2rem, 6vw, 3.1rem)',
              color: 'var(--text)',
              maxWidth: 580,
            }}
          >
            Your Next Journey<br />
            <span style={{ color: 'var(--primary)' }}>Starts Here.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={fadeUp}
            className="leading-relaxed mb-8"
            style={{
              fontSize: 'clamp(0.86rem, 2vw, 0.97rem)',
              color: 'var(--text-muted)',
              maxWidth: 440,
            }}
          >
            Discover stories, destinations, and experiences from travelers around the world.
          </motion.p>

          {/* Search bar */}
          <motion.form
            variants={fadeUp}
            onSubmit={handleSearch}
            className="relative mb-9 w-full"
            style={{ maxWidth: 500 }}
          >
            <Search
              aria-hidden
              style={{
                position: 'absolute', left: 17, top: '50%', transform: 'translateY(-50%)',
                width: 16, height: 16, color: 'var(--text-muted)', pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => navigate('/search')}
              placeholder="Search destinations, journals, people…"
              className="w-full outline-none transition-all"
              style={{
                paddingLeft: 46, paddingRight: 18, paddingTop: 13, paddingBottom: 13,
                borderRadius: 9999,
                background: 'var(--surface)',
                border: '1.5px solid var(--border)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                fontWeight: 500,
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              }}
            />
          </motion.form>

          {/* Quick actions */}
          <motion.div
            variants={stagger}
            className="grid grid-cols-3 gap-2 sm:gap-3 w-full"
            style={{ maxWidth: 440 }}
          >
            {QUICK_ACTIONS.map(({ id, icon: Icon, label, sub, href }) => (
              <motion.button
                key={id}
                variants={fadeUp}
                whileHover={{ y: -3, transition: { duration: 0.16, ease: [0.34, 1.56, 0.64, 1] } }}
                whileTap={{ scale: 0.96 }}
                onClick={() => scrollTo(href, navigate)}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-2xl text-center cursor-pointer transition-all"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)';
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.04)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--primary-dim)' }}
                >
                  <Icon style={{ width: 18, height: 18, color: 'var(--primary)' }} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    {sub}
                  </span>
                </span>
              </motion.button>
            ))}
          </motion.div>

        </div>
      </motion.section>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-10">

        {/* Trending destinations */}
        <motion.div
          id="trending"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        >
          <TrendingDestinations />
        </motion.div>

        {/* Micro-copy divider */}
        <MicroCopyDivider text="Every place has a story. Find yours." />

        {/* Stories section */}
        <motion.div
          id="stories"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Section header */}
          <div className="flex items-end justify-between mb-6 px-0.5">
            <div>
              <p style={{
                fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.24em', color: 'var(--primary)', marginBottom: '0.4rem',
              }}>
                ✦ Community
              </p>
              <h2
                className="font-black tracking-tight leading-tight"
                style={{ fontSize: 'clamp(1.2rem, 3vw, 1.55rem)', color: 'var(--text)' }}
              >
                Travel Stories
              </h2>
              <p className="mt-1" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Real journeys shared by the community
              </p>
            </div>

            {journals.length > 0 && (
              <span
                className="shrink-0"
                style={{
                  fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '5px 11px', borderRadius: 9999,
                  color: 'var(--primary)', background: 'var(--primary-dim)',
                  border: '1px solid rgba(0,74,198,0.14)',
                }}
              >
                {journals.length}+ stories
              </span>
            )}
          </div>

          {/* Tab toggle */}
          <div
            className="inline-flex p-1 rounded-2xl mb-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
          >
            {[
              { id: 'public',    label: 'For You',   icon: Globe  },
              { id: 'following', label: 'Following', icon: Users  },
            ].map(({ id, label, icon: Icon }) => {
              const isActive = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTabClick(id)}
                  className="relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: isActive ? '#fff' : 'var(--text-muted)' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="feedTab"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'var(--primary)', boxShadow: '0 3px 12px var(--shadow-glow)' }}
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon style={{ width: 15, height: 15 }} /> {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Personalization hint */}
          {tab === 'public' && journals.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 mb-5"
              style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)' }}
            >
              <span style={{ color: 'var(--primary)', fontSize: '0.6rem' }}>✦</span>
              For You · Based on trending journeys
            </motion.p>
          )}
          {tab === 'following' && journals.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 mb-5"
              style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)' }}
            >
              <span style={{ color: 'var(--primary)', fontSize: '0.6rem' }}>✦</span>
              Stories from explorers you follow
            </motion.p>
          )}

          {/* Empty state */}
          {journals.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div
                className="w-16 h-16 mx-auto rounded-2xl mb-5 flex items-center justify-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <Globe style={{ width: 30, height: 30, color: 'var(--primary)', opacity: 0.45 }} />
              </div>
              <p className="text-base font-bold mb-1.5" style={{ color: 'var(--text)' }}>
                No journeys found
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {tab === 'following'
                  ? 'Follow explorers to fill your feed.'
                  : 'Be the first to chart the map.'}
              </p>
            </motion.div>
          )}

          {/* Journal grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {journals.map((j, i) => (
              <motion.div
                key={j.id}
                variants={fadeUp}
                custom={i}
                transition={{ delay: Math.min(i * 0.04, 0.28) }}
                className="h-full"
              >
                <JournalCard journal={j} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center mt-12 mb-8">
            <Loader2
              style={{ width: 26, height: 26, color: 'var(--primary)', opacity: 0.55 }}
              className="animate-spin"
            />
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && !loading && <div ref={sentinelRef} className="h-1" />}

        {/* End of feed */}
        {!hasMore && journals.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-16 mb-8 flex items-center justify-center gap-5"
          >
            <div className="h-px flex-1 max-w-[72px]" style={{ background: 'linear-gradient(to right, transparent, var(--border))' }} />
            <span style={{
              fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.22em',
              fontWeight: 600, color: 'var(--text-muted)', opacity: 0.45,
            }}>
              You've explored it all
            </span>
            <div className="h-px flex-1 max-w-[72px]" style={{ background: 'linear-gradient(to left, transparent, var(--border))' }} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
