import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  ChevronLeft, ChevronRight, Plane, MapPin, Calendar,
  Edit2, Trash2, Home, DollarSign, Loader2, Send,
  MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react';


const serif  = { fontFamily: "'Playfair Display', Georgia, serif" };
const sansOf = { fontFamily: "'Inter', system-ui, sans-serif" };

/* ─── Small helpers ─────────────────────────────────────────── */
function GoldLabel({ children, className = '' }) {
  return (
    <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${className}`}
       style={{ color: 'var(--primary)', ...sansOf }}>
      {children}
    </p>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <GoldLabel>{children}</GoldLabel>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}

/* ─── Timeline item with expand/collapse ────────────────────── */
function TimelineItem({ stop, index, isLast }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-4 relative"
    >
      {/* line */}
      {!isLast && (
        <div className="absolute left-[17px] top-9 bottom-0 w-px"
             style={{ background: `linear-gradient(to bottom, var(--primary), transparent)` }} />
      )}
      {/* node */}
      <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black z-10 border"
           style={{ background: 'var(--primary-dim)', borderColor: 'var(--primary)', color: 'var(--primary)', ...sansOf }}>
        D{stop.day}
      </div>
      {/* content */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex-1 text-left rounded-2xl p-3 px-4 mb-3 transition-all"
        style={{ background: 'var(--surface)', border: `1px solid ${open ? 'var(--primary)' : 'var(--border)'}` }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm leading-snug" style={{ color: 'var(--text)', ...sansOf }}>
            {stop.activity}
          </p>
          {(stop.notes || stop.location) &&
            (open
              ? <ChevronUp className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--primary)' }} />
              : <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
            )
          }
        </div>
        {stop.location && (
          <p className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <MapPin className="w-3 h-3" style={{ color: 'var(--primary)' }} /> {stop.location}
          </p>
        )}
        <AnimatePresence>
          {open && stop.notes && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 text-[12px] italic leading-relaxed overflow-hidden"
              style={{ color: 'var(--text-muted)' }}
            >
              {stop.notes}
            </motion.p>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

/* ─── Reaction pill ─────────────────────────────────────────── */
function ReactionPill({ emoji, label, count, active, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all"
      style={{
        background:   active ? 'var(--primary-dim)' : 'var(--surface)',
        border:       `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        color:        active ? 'var(--primary)' : 'var(--text-muted)',
        ...sansOf,
      }}
    >
      <span className="text-sm">{emoji}</span>
      {label}
      {count > 0 && (
        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md font-bold"
              style={{ background: active ? 'var(--primary-dim)' : 'var(--surface-hover)', color: active ? 'var(--primary)' : 'var(--text-muted)' }}>
          {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function JournalDetail() {
  const { id }    = useParams();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [journal,     setJournal]     = useState(null);
  const [myReactions, setMyReactions] = useState(new Set());
  const [reactions,   setReactions]   = useState({ love: 0, epic: 0, wanna_go: 0 });
  const [comment,     setComment]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [slideIndex,  setSlideIndex]  = useState(0);
  const [dialog,      setDialog]      = useState(null);
  const slideRef = useRef(null);

  /* ── data fetching (unchanged) ── */
  useEffect(() => {
    api.get(`/journals/${id}`).then((res) => setJournal(res.data));
    api.get(`/journals/${id}/likes`).then((res) => {
      const counts = { love: 0, epic: 0, wanna_go: 0 };
      res.data.forEach((l) => { if (counts[l.type] !== undefined) counts[l.type]++; });
      setReactions(counts);
      if (user) {
        const mine = new Set(res.data.filter((l) => l.user.id === user.id).map((l) => l.type));
        setMyReactions(mine);
      }
    });
  }, [id, user]);

  /* ── handlers (unchanged) ── */
  async function toggleReaction(type) {
    if (!user) return navigate('/login');
    const res = await api.post(`/journals/${id}/like`, { type });
    setMyReactions((prev) => {
      const next = new Set(prev);
      res.data.liked ? next.add(type) : next.delete(type);
      return next;
    });
    setReactions((r) => ({ ...r, [type]: Math.max(0, r[type] + (res.data.liked ? 1 : -1)) }));
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!user) return navigate('/login');
    setSubmitting(true);
    try {
      const res = await api.post(`/journals/${id}/comments`, { content: comment });
      setJournal((j) => ({ ...j, comments: [...j.comments, res.data] }));
      setComment('');
    } finally {
      setSubmitting(false);
    }
  }

  function deleteJournal() {
    setDialog({
      title: 'Delete Journal Entry',
      message: 'This will permanently delete this entry, all its photos, and comments.',
      danger: true,
      onConfirm: async () => {
        await api.delete(`/journals/${id}`);
        navigate('/');
      },
    });
  }

  function goTo(i) {
    const next = Math.max(0, Math.min(i, total - 1));
    setSlideIndex(next);
    slideRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  /* ── loading state ── */
  if (!journal) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-7 h-7" style={{ color: 'var(--primary)' }} />
      </motion.div>
    </div>
  );

  const isOwner = user?.id === journal.user.id;
  const slides  = journal.photos;
  const total   = slides.length;
  const sortedItinerary = [...(journal.itinerary ?? [])].sort((a, b) => a.day - b.day);

  /* ── paragraph split for story content ── */
  const paragraphs = journal.content
    ? journal.content.split('\n').filter(p => p.trim())
    : [];

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', ...sansOf }}>

      {/* ╔══════════════════════════════════╗
          ║  1. HERO CAROUSEL                ║
          ╚══════════════════════════════════╝ */}
      <div className="relative overflow-hidden" style={{ height: 'min(65vh, 480px)', minHeight: 280 }}>

        {/* slides */}
        <div
          ref={slideRef}
          className="flex h-full overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {slides.map((p, i) => (
            <div key={i} className="flex-[0_0_100%] snap-start h-full relative">
              <img src={p} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* top gradient (status bar readability) */}
        <div className="absolute inset-x-0 top-0 h-32 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' }} />

        {/* bottom gradient (title card readability) */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
             style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.80) 25%, transparent)' }} />

        {/* ← back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-20 w-9 h-9 flex items-center justify-center rounded-full transition-all btn-glass"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: '#fff' }} />
        </button>

        {/* ✈ Plan Trip pill */}
        <button
          onClick={() => navigate(`/plan/${encodeURIComponent(journal.destination)}`)}
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 btn-glass"
          style={{ color: '#fff' }}
        >
          <Plane className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} /> Plan Trip
        </button>

        {/* prev / next arrows */}
        {slideIndex > 0 && (
          <button
            onClick={() => goTo(slideIndex - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full transition-all btn-glass"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {slideIndex < total - 1 && (
          <button
            onClick={() => goTo(slideIndex + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full transition-all btn-glass"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}

        {/* dot indicators */}
        {total > 1 && (
          <div className="absolute bottom-[170px] left-0 right-0 flex justify-center gap-1.5 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="h-1 rounded-full border-none transition-all"
                style={{
                  width:      i === slideIndex ? '20px' : '6px',
                  background: i === slideIndex ? 'var(--primary)' : 'rgba(255,255,255,0.45)',
                }}
              />
            ))}
          </div>
        )}

        {/* ── FLOATING TITLE CARD (overlaps bottom of hero) ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-0 left-4 right-4 z-20 p-5 rounded-t-3xl glass"
          style={{ borderBottom: 'none' }}
        >
          {/* destination */}
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-3 h-3" style={{ color: 'var(--primary)' }} />
            <GoldLabel>{journal.destination}</GoldLabel>
          </div>

          {/* title */}
          <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-2"
              style={{ color: 'var(--text)', ...serif }}>
            {journal.title}
          </h1>

          {/* dates */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Calendar className="w-3.5 h-3.5" />
            {new Date(journal.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' – '}
            {new Date(journal.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </motion.div>
      </div>
      {/* end hero */}

      {/* ╔══════════════════════════════════╗
          ║  SCROLLABLE CONTENT              ║
          ╚══════════════════════════════════╝ */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-8">

        {/* ── 2. AUTHOR BAR ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between py-5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <Link to={`/users/${journal.user.id}`} className="flex items-center gap-3 group">
            {journal.user.avatar ? (
              <img src={journal.user.avatar}
                   className="w-10 h-10 rounded-full object-cover border-2"
                   style={{ borderColor: 'var(--primary)' }}
                   alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border"
                   style={{ background: 'var(--primary-dim)', borderColor: 'var(--primary)', color: 'var(--primary)', ...sansOf }}>
                {journal.user.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{journal.user.username}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Author</p>
            </div>
          </Link>

          {isOwner ? (
            <div className="flex gap-2">
              <Link
                to={`/journals/${id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all btn-glass"
                style={{ color: 'var(--text-muted)' }}
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </Link>
              <button
                onClick={deleteJournal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          ) : (
            <Link
              to={`/users/${journal.user.id}`}
              className="text-xs font-semibold transition-all"
              style={{ color: 'var(--primary)' }}
            >
              View Profile →
            </Link>
          )}
        </motion.div>

        {/* ── 2.5. BUDGET & PACKING SHORTCUTS ── */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <Link
              to={`/journals/${id}/budget`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              💰 Budget Tracker
            </Link>
            <Link
              to={`/journals/${id}/packing`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              🎒 Packing List
            </Link>
          </motion.div>
        )}

        {/* ── 3. INFO TILES ── */}
        {(journal.accommodation || journal.budget != null) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 xs:grid-cols-2 gap-3 py-6 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            {journal.accommodation && (
              <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <GoldLabel>Where I Stayed</GoldLabel>
                </div>
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                  {journal.accommodation}
                </p>
              </div>
            )}
            {journal.budget != null && (
              <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <GoldLabel>Trip Budget</GoldLabel>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  ${journal.budget.toLocaleString()}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── 4. ACTIVITIES ── */}
        {journal.activities && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="py-6 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <SectionHeading>Activities</SectionHeading>
            <div className="pl-4" style={{ borderLeft: '2px solid var(--primary)' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)', ...sansOf }}>
                {journal.activities}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── 5. JOURNEY TIMELINE ── */}
        {sortedItinerary.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="py-6 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <SectionHeading>Journey Timeline</SectionHeading>
            <div className="flex flex-col">
              {sortedItinerary.map((stop, idx) => (
                <TimelineItem
                  key={idx}
                  stop={stop}
                  index={idx}
                  isLast={idx === sortedItinerary.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── 6. STORY CONTENT ── */}
        {paragraphs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="py-6 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <SectionHeading>The Story</SectionHeading>
            <div className="space-y-5">
              {paragraphs.map((para, idx) => {
                /* Drop cap on first non-empty paragraph */
                if (idx === 0) {
                  const firstChar = para[0];
                  const rest      = para.slice(1);
                  return (
                    <p key={idx} className="text-[15px] leading-[1.85]" style={{ color: 'var(--text)' }}>
                      <span
                        className="float-left text-6xl font-black leading-none mr-2 mt-1"
                        style={{ color: 'var(--primary)', ...serif, lineHeight: '0.8' }}
                      >
                        {firstChar}
                      </span>
                      {rest}
                    </p>
                  );
                }
                /* Block-quote style for lines starting with " */
                if (para.startsWith('"') || para.startsWith('"')) {
                  return (
                    <blockquote
                      key={idx}
                      className="pl-4 py-1 italic text-[15px] leading-[1.85]"
                      style={{
                        borderLeft: '3px solid var(--primary)',
                        color: 'var(--text-muted)',
                        ...sansOf,
                      }}
                    >
                      {para}
                    </blockquote>
                  );
                }
                return (
                  <p key={idx} className="text-[15px] leading-[1.85]" style={{ color: 'var(--text)' }}>
                    {para}
                  </p>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── 7. REACTION BAR ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 py-6 border-b flex-wrap"
          style={{ borderColor: 'var(--border)' }}
        >
          <ReactionPill
            emoji="❤️" label="Love"     count={reactions.love}
            active={myReactions.has('love')}
            onClick={() => toggleReaction('love')}
          />
          <ReactionPill
            emoji="🔥" label="Epic"     count={reactions.epic}
            active={myReactions.has('epic')}
            onClick={() => toggleReaction('epic')}
          />
          <ReactionPill
            emoji="📍" label="Wanna Go" count={reactions.wanna_go}
            active={myReactions.has('wanna_go')}
            onClick={() => toggleReaction('wanna_go')}
          />

          <div className="ml-auto flex items-center gap-1.5 text-xs"
               style={{ color: 'var(--text-muted)' }}>
            <MessageCircle className="w-3.5 h-3.5" />
            {journal.comments.length} {journal.comments.length === 1 ? 'comment' : 'comments'}
          </div>
        </motion.div>

        {/* ── 8. COMMENTS SECTION ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-6 pb-10"
        >
          <SectionHeading>Discussion</SectionHeading>

          {journal.comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                Be the first to share your thoughts ✈️
              </p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {journal.comments.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex gap-3"
                >
                  {/* avatar */}
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-1"
                       style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary)', color: 'var(--primary)', ...sansOf }}>
                    {c.user.username[0].toUpperCase()}
                  </div>
                  {/* bubble */}
                  <div className="flex-1 rounded-2xl rounded-tl-sm p-3 px-4 glass">
                    <Link
                      to={`/users/${c.user.id}`}
                      className="text-[11px] font-bold block mb-1 transition-colors hover:opacity-80"
                      style={{ color: 'var(--primary)' }}
                    >
                      @{c.user.username}
                    </Link>
                    <p className="text-sm leading-relaxed m-0" style={{ color: 'var(--text)' }}>
                      {c.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── COMMENT INPUT (inline, below comments) ── */}
          {user && (
            <form onSubmit={submitComment} className="flex gap-2 items-center mt-4">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts…"
                className="flex-1 rounded-full pl-5 pr-4 py-3 text-sm outline-none transition-all"
                style={{ ...sansOf }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="submit"
                disabled={!comment.trim() || submitting}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40 btn-glow"
              >
                {submitting
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white ml-0.5" />
                }
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
      {/* end scrollable content */}
      <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
