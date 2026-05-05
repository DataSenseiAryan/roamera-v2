import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  MapPin, Search, Calendar, Users as UsersIcon, Plus,
  Lock, CheckCircle2, Loader2, Sparkles, X, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Constants ──────────────────────────────────────────── */
const FILTERS = ['All', 'Adventure', 'Backpacking', 'Party', 'Chill', 'Culture', 'Luxury', 'Nature', 'Food'];
const TRENDING = [
  { name: 'Bali', emoji: '🌴' }, { name: 'Santorini', emoji: '🏛️' },
  { name: 'Vietnam', emoji: '🛵' }, { name: 'Patagonia', emoji: '🏔️' },
  { name: 'Japan', emoji: '🗾' }, { name: 'Morocco', emoji: '🕌' },
];

/* ── Background ─────────────────────────────────────────── */
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size: Math.random() * 2.5 + 1,
  x: Math.random() * 100,
  y: Math.random() * 100,
  dur: Math.random() * 10 + 14,
  delay: Math.random() * 6,
  opacity: Math.random() * 0.18 + 0.04,
}));

const LIGHT_STICKERS = ['✈️', '🗺️', '🧭', '📸', '🎒', '🌸', '⛺', '🚢', '🎫', '🌅'];

function MeetwaysBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, background: 'var(--primary)', opacity: p.opacity }}
          animate={{ y: [0, -24, 0], opacity: [p.opacity, p.opacity * 2, p.opacity] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {LIGHT_STICKERS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute text-xl select-none"
          style={{ left: `${(i * 10 + 4) % 96}%`, top: `${(i * 17 + 8) % 82}%`, opacity: 0.055 }}
          animate={{ y: [0, -16, 0], rotate: [0, 7, -5, 0] }}
          transition={{ duration: 15 + i * 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 1.1 }}
        >
          {s}
        </motion.span>
      ))}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px]"
        style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 0%, var(--primary-dim) 0%, transparent 70%)', opacity: 0.28 }}
      />
    </div>
  );
}

/* ── Avatar ─────────────────────────────────────────────── */
function Avatar({ name, size = 30, className = '' }) {
  const h = name ? (name.charCodeAt(0) * 37) % 360 : 220;
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 border-2 border-white/10 text-white font-bold ${className}`}
      style={{ width: size, height: size, background: `hsl(${h},48%,30%)`, fontSize: size * 0.38 }}
    >
      {name ? name[0].toUpperCase() : '?'}
    </div>
  );
}

/* ── StatusBadge ────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    open:      { label: 'Open',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    joined:    { label: 'Joined',  color: 'var(--primary)', bg: 'var(--primary-dim)' },
    full:      { label: 'Full',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    requested: { label: 'Pending', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  };
  const c = map[status] || map.open;
  return (
    <span
      style={{ color: c.color, background: c.bg, borderColor: `${c.color}38` }}
      className="px-2.5 py-0.5 rounded-full text-[0.62rem] font-semibold tracking-wide border"
    >
      {c.label}
    </span>
  );
}

/* ── FilterPill ─────────────────────────────────────────── */
function FilterPill({ label, active, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`px-4 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
        active
          ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_2px_12px_var(--shadow-glow)]'
          : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] hover:border-[var(--border-hover)]'
      }`}
    >
      {label}
    </motion.button>
  );
}

/* ── MeetwayCard ────────────────────────────────────────── */
function MeetwayCard({ meetway, onNavigate }) {
  const { user } = useAuth();
  const [uiStatus, setUiStatus] = useState('open');
  const [busy, setBusy] = useState(false);

  const spotsLeft = meetway.spotsLeft ?? (meetway.maxPeople - (meetway.spotsTaken ?? 0));
  const spotsPct  = ((meetway.spotsTaken ?? 0) / meetway.maxPeople) * 100;
  const tags      = meetway.tags || [];

  async function handleJoin(e) {
    e.stopPropagation();
    if (!user) { onNavigate('/login'); return; }
    if (uiStatus !== 'open' || busy) return;
    setBusy(true);
    try {
      await api.post(`/meetways/${meetway.id}/join`);
      setUiStatus(meetway.privacy === 'private' ? 'requested' : 'joined');
    } catch (err) {
      if (err.response?.status === 400) {
        setUiStatus(err.response.data.status || 'joined');
      }
    } finally {
      setBusy(false);
    }
  }

  const isFull = spotsLeft === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -4, boxShadow: '0 20px 44px rgba(0,0,0,0.13)' }}
      onClick={() => onNavigate(`/meetways/${meetway.id}`)}
      className="group flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden cursor-pointer shadow-sm transition-all duration-300 hover:border-[var(--primary)]/35"
    >
      {/* Cover */}
      <div className="h-44 relative overflow-hidden bg-[var(--surface-hover)] shrink-0">
        {meetway.coverPhoto ? (
          <img
            src={meetway.coverPhoto}
            alt={meetway.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--primary-dim) 0%, var(--primary) 100%)' }}
          >
            <Sparkles className="w-10 h-10 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

        {meetway.privacy === 'private' && (
          <div className="absolute top-3 right-3 bg-black/45 backdrop-blur-sm rounded-full px-2.5 py-1 text-[0.6rem] text-white/90 font-medium flex items-center gap-1 border border-white/10">
            <Lock className="w-2.5 h-2.5" /> Private
          </div>
        )}

        <div className="absolute bottom-3.5 left-4 right-4">
          <h3 className="m-0 text-[0.95rem] font-bold text-white leading-snug drop-shadow line-clamp-1">
            {meetway.title}
          </h3>
          <p className="m-0 mt-0.5 text-[0.72rem] text-white/70 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            {meetway.destination}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-4 py-4 gap-3">

        {/* Row 1: Date + Status */}
        <div className="flex items-center justify-between">
          <span className="text-[0.72rem] text-[var(--text-muted)] flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[var(--primary)] shrink-0" />
            {new Date(meetway.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {new Date(meetway.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <StatusBadge status={uiStatus} />
        </div>

        {/* Row 2: Traveler progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[0.7rem] text-[var(--text-muted)] flex items-center gap-1">
              <UsersIcon className="w-3 h-3 shrink-0" />
              {meetway.spotsTaken ?? 0} of {meetway.maxPeople} spots taken
            </span>
            {isFull && <span className="text-[0.62rem] font-semibold text-amber-500">Full</span>}
          </div>
          <div className="h-1 rounded-full bg-[var(--surface-hover)] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(spotsPct, 100)}%` }}
              transition={{ delay: 0.25, duration: 0.65, ease: 'easeOut' }}
              className={`h-full rounded-full ${isFull ? 'bg-amber-400' : 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]'}`}
            />
          </div>
        </div>

        {/* Row 3: Budget */}
        {(meetway.budgetMin || meetway.budgetMax) && (
          <p className="m-0 text-[0.72rem] text-[var(--text-muted)]">
            <span className="text-[0.82rem] font-semibold text-emerald-500">
              ₹{meetway.budgetMin ?? '?'} – ₹{meetway.budgetMax ?? '?'}
            </span>
            {' '}per person
          </p>
        )}

        {/* Row 4: Tags */}
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {tags.slice(0, 3).map(t => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[0.62rem] text-[var(--text-muted)]"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Footer: host + action */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name={meetway.host?.username} size={26} />
            <span className="text-[0.72rem] text-[var(--text-muted)] truncate">@{meetway.host?.username}</span>
          </div>

          <motion.button
            onClick={handleJoin}
            disabled={uiStatus !== 'open' || busy}
            whileTap={{ scale: 0.94 }}
            className={`ml-3 shrink-0 px-3.5 py-1.5 rounded-full text-[0.72rem] font-semibold transition-all ${
              uiStatus === 'joined'
                ? 'bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--primary)]/25'
                : uiStatus === 'requested'
                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/25'
                : isFull
                ? 'bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-50'
                : 'bg-[var(--primary)] text-white shadow-[0_2px_10px_var(--shadow-glow)] hover:opacity-90'
            }`}
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : uiStatus === 'joined' ? (
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Joined</span>
            ) : uiStatus === 'requested' ? 'Pending'
              : isFull ? 'Full'
              : meetway.privacy === 'private' ? 'Request'
              : 'Join'}
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
}

/* ── Skeleton ───────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-[var(--surface-hover)]" />
      <div className="px-4 py-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-2 w-2/5 rounded-full bg-[var(--surface-hover)]" />
          <div className="h-2 w-12 rounded-full bg-[var(--surface-hover)]" />
        </div>
        <div className="h-1 w-full rounded-full bg-[var(--surface-hover)]" />
        <div className="h-2 w-1/3 rounded-full bg-[var(--surface-hover)]" />
        <div className="flex gap-1.5">
          <div className="h-4 w-12 rounded-full bg-[var(--surface-hover)]" />
          <div className="h-4 w-10 rounded-full bg-[var(--surface-hover)]" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
          <div className="w-6 h-6 rounded-full bg-[var(--surface-hover)]" />
          <div className="h-6 w-16 rounded-full bg-[var(--surface-hover)]" />
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ────────────────────────────────────────── */
function EmptyState({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 px-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-sm mx-auto"
    >
      <motion.p
        className="text-5xl mb-4 leading-none"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        🌏
      </motion.p>
      <h3 className="text-base font-bold text-[var(--text)] mb-2 m-0">No meetways found</h3>
      <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed m-0">
        Try adjusting your filters or explore a new destination.
      </p>
      <motion.button
        onClick={onReset}
        whileTap={{ scale: 0.97 }}
        className="px-5 py-2 rounded-full border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-dim)] text-sm font-medium transition-colors"
      >
        Clear filters
      </motion.button>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */
export default function Meetways() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meetways, setMeetways]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeFilter, setActiveFilter]   = useState('All');
  const [search, setSearch]               = useState('');
  const [budgetFilter, setBudgetFilter]   = useState('any');
  const [showPanel, setShowPanel]         = useState(false);
  const [page, setPage]                   = useState(1);
  const [hasMore, setHasMore]             = useState(true);

  const fetchMeetways = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: reset ? 1 : page });
      if (activeFilter !== 'All') params.set('tag', activeFilter);
      if (search) params.set('search', search);
      if (budgetFilter !== 'any') params.set('budget', budgetFilter);

      const res = await api.get(`/meetways?${params}`);
      const data = res.data;
      setMeetways(prev => (reset || page === 1) ? data : [...prev, ...data]);
      setHasMore(data.length === 20);
      if (reset) setPage(1);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, search, budgetFilter, page]);

  useEffect(() => {
    setPage(1);
    fetchMeetways(true);
  }, [activeFilter, search, budgetFilter]); // eslint-disable-line

  useEffect(() => {
    if (page > 1) fetchMeetways(false);
  }, [page]); // eslint-disable-line

  function resetFilters() {
    setActiveFilter('All');
    setSearch('');
    setBudgetFilter('any');
  }

  return (
    <div className="relative min-h-screen">
      <MeetwaysBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-5 lg:px-8 pb-28">

        {/* ── HERO ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="pt-10 pb-7 mb-6 text-center"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--primary)] mb-2.5 m-0"
          >
            Connect
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="text-[1.9rem] sm:text-[2.4rem] font-bold text-[var(--text)] tracking-tight m-0 mb-2 leading-tight"
          >
            Meet Fellow Travelers
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
            className="text-sm text-[var(--text-muted)] m-0"
          >
            Discover people, stories, and shared journeys
          </motion.p>
        </motion.div>

        {/* ── SEARCH ROW ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="max-w-xl mx-auto mb-5"
        >
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div
              className="flex-1 flex items-center gap-2.5 rounded-xl border border-[var(--border)] px-3.5 py-2.5 transition-all focus-within:ring-2 focus-within:ring-[var(--primary)]/35 focus-within:border-[var(--primary)]/45"
              style={{ background: 'var(--surface)' }}
            >
              <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <input
                type="text"
                placeholder="Search meetways, destinations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[var(--text)] text-sm placeholder:text-[var(--text-muted)]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowPanel(v => !v)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                showPanel
                  ? 'bg-[var(--primary-dim)] text-[var(--primary)] border-[var(--primary)]/35'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-hover)]'
              }`}
            >
              <Filter className="w-4 h-4" />
            </motion.button>

            {/* Create (desktop) */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => user ? navigate('/meetways/create') : navigate('/login')}
              className="hidden sm:flex h-11 px-4 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm items-center gap-1.5 shrink-0 shadow-[0_3px_12px_var(--shadow-glow)] hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Create
            </motion.button>
          </div>

          {/* Budget panel */}
          <AnimatePresence>
            {showPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                  <p className="m-0 mb-3 text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Budget</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { k: 'any', l: 'Any' },
                      { k: 'budget', l: '< ₹500' },
                      { k: 'mid', l: '₹500–1.2k' },
                      { k: 'luxury', l: '₹1k+' },
                    ].map(o => (
                      <button
                        key={o.k}
                        onClick={() => setBudgetFilter(o.k)}
                        className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          budgetFilter === o.k
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                            : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── FILTER PILLS ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.24 }}
          className="flex gap-2 overflow-x-auto mb-7 py-1 scrollbar-none"
        >
          {FILTERS.map(f => (
            <FilterPill key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
          ))}
        </motion.div>

        {/* ── TRENDING ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mb-8"
        >
          <p className="m-0 mb-3 text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
            Trending <span className="text-sm">🔥</span>
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {TRENDING.map((d, i) => (
              <motion.button
                key={d.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.28 + i * 0.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearch(d.name)}
                className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] min-w-[4.5rem] transition-all hover:border-[var(--primary)]/35 hover:bg-[var(--surface-hover)] group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">{d.emoji}</span>
                <span className="text-[0.65rem] text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors whitespace-nowrap">
                  {d.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── RESULTS LABEL ──────────────────────────────────── */}
        {(meetways.length > 0 || loading) && (
          <p className="m-0 mb-4 text-[0.72rem] text-[var(--text-muted)] flex items-center gap-2">
            {loading && meetways.length === 0 ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" /> Finding meetways…</>
            ) : (
              `${meetways.length} meetway${meetways.length !== 1 ? 's' : ''}`
            )}
          </p>
        )}

        {/* ── GRID ───────────────────────────────────────────── */}
        {meetways.length === 0 && !loading ? (
          <EmptyState onReset={resetFilters} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetways.map(m => (
              <MeetwayCard key={m.id} meetway={m} onNavigate={navigate} />
            ))}
            {loading && [1, 2, 3].map(i => <Skeleton key={i} />)}
          </div>
        )}

        {/* ── LOAD MORE ──────────────────────────────────────── */}
        {hasMore && !loading && meetways.length > 0 && (
          <div className="flex justify-center mt-10">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setPage(p => p + 1)}
              className="px-5 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/35 transition-all"
            >
              Load more
            </motion.button>
          </div>
        )}

        {!hasMore && meetways.length > 0 && (
          <p className="text-center text-[0.62rem] text-[var(--text-muted)] uppercase tracking-widest mt-10 opacity-35">
            ✦ You've seen them all ✦
          </p>
        )}
      </div>

      {/* ── FAB (mobile) ───────────────────────────────────── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 280, damping: 20 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => user ? navigate('/meetways/create') : navigate('/login')}
        className="fixed bottom-24 right-4 sm:right-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center z-50 shadow-[0_6px_20px_var(--shadow-glow)] hover:opacity-90 transition-opacity sm:hidden w-12 h-12 sm:w-14 sm:h-14"
        style={{}}
      >
        <Plus className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
