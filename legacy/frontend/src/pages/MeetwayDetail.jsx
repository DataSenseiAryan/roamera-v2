import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  ChevronLeft, Share2, MapPin, Calendar, Users, Lock,
  ChevronDown, MessageSquare, Send,
  CheckCircle2, XCircle, Loader2, Star, Wallet,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS  — maps to app CSS variables
───────────────────────────────────────────────────────────────── */
const T = {
  get bg()       { return 'var(--bg)'; },
  get ink()      { return 'var(--text)'; },
  get muted()    { return 'var(--text-muted)'; },
  get coral()    { return 'var(--primary)'; },
  get amber()    { return 'var(--accent)'; },
  get card()     { return 'var(--surface)'; },
  get cardAlt()  { return 'var(--surface-hover)'; },
  get border()   { return 'var(--border)'; },
  get coralBg()  { return 'var(--primary-dim)'; },
};

const SANS  = "'Inter', system-ui, sans-serif";

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
function fmt(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Monogram({ name, size = 40, style = {} }) {
  const hue = name ? (name.charCodeAt(0) * 37) % 360 : 200;
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: `hsl(${hue},55%,88%)`,
        color: `hsl(${hue},55%,32%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: SANS, fontWeight: 800, fontSize: size * 0.38,
        flexShrink: 0,
        ...style,
      }}
    >
      {name ? name[0].toUpperCase() : '?'}
    </div>
  );
}

function Rule({ className = '' }) {
  return <div className={`h-px ${className}`} style={{ background: T.border }} />;
}

function SectionHeading({ serif, children, sub }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {serif ? (
        <h2 style={{ fontFamily: SANS, fontSize: '1.55rem', fontWeight: 700, color: T.ink, margin: 0, lineHeight: 1.2 }}>
          {children}
        </h2>
      ) : (
        <p style={{ fontFamily: SANS, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, margin: 0 }}>
          {children}
        </p>
      )}
      {sub && (
        <p style={{ fontFamily: SANS, fontSize: '0.75rem', color: T.muted, margin: '4px 0 0', fontWeight: 500 }}>{sub}</p>
      )}
      <div style={{ width: 40, height: 2, background: T.coral, marginTop: serif ? 10 : 8, borderRadius: 2 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────────────────────────────── */
const rise = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

const pop = {
  hidden:  { opacity: 0, scale: 0.93, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function MeetwayDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  /* ── State (unchanged) ── */
  const [meetway, setMeetway]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [itinOpen, setItinOpen]     = useState(false);
  const [joinBusy, setJoinBusy]     = useState(false);
  const [joinStatus, setJoinStatus] = useState('open');
  const [messages, setMessages]     = useState([]);
  const [chatMsg, setChatMsg]       = useState('');
  const [sendBusy, setSendBusy]     = useState(false);
  const [dialog, setDialog]         = useState(null);

  const heroRef    = useRef(null);
  const chatEndRef = useRef(null);

  /* ── Data fetch (unchanged) ── */
  useEffect(() => {
    setLoading(true);
    api.get(`/meetways/${id}`)
      .then(res => {
        const m = res.data;
        setMeetway(m);
        setMessages((m.messages || []).slice().reverse());
        if (user) {
          const isHost = m.host?.id === user.id;
          if (isHost) { setJoinStatus('host'); return; }
          const mine = (m.participants || []).find(p => p.user?.id === user.id);
          if (mine) setJoinStatus(mine.status === 'approved' ? 'joined' : 'requested');
          else if ((m.spotsLeft ?? 0) <= 0) setJoinStatus('full');
        }
      })
      .catch(() => setError('Could not load this meetway.'))
      .finally(() => setLoading(false));
  }, [id, user]);

  /* ── Auto-scroll chat ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Handlers (unchanged) ── */
  async function handleJoin() {
    if (!user) { navigate('/login'); return; }
    setJoinBusy(true);
    try {
      await api.post(`/meetways/${id}/join`);
      setJoinStatus(meetway.privacy === 'private' ? 'requested' : 'joined');
      const res = await api.get(`/meetways/${id}`);
      setMeetway(res.data);
    } catch (err) {
      if (err.response?.status === 400) setJoinStatus(err.response.data.status || 'joined');
    } finally { setJoinBusy(false); }
  }

  function handleLeave() {
    setDialog({
      title: 'Leave Meetway',
      message: 'You will be removed from this meetway and lose access to the chat.',
      danger: true,
      confirmLabel: 'Leave',
      icon: '👋',
      onConfirm: async () => {
        try {
          await api.delete(`/meetways/${id}/participants/${user.id}`);
          setJoinStatus('open');
          const res = await api.get(`/meetways/${id}`);
          setMeetway(res.data);
        } catch {/* ignore */}
      },
    });
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!chatMsg.trim() || sendBusy) return;
    setSendBusy(true);
    try {
      const res = await api.post(`/meetways/${id}/messages`, { content: chatMsg.trim() });
      setMessages(prev => [...prev, res.data]);
      setChatMsg('');
    } catch {/* ignore */}
    finally { setSendBusy(false); }
  }

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: T.bg }}>
      <Loader2 style={{ width: 36, height: 36, color: T.coral, animation: 'spin 1s linear infinite' }} />
      <p style={{ fontFamily: SANS, fontSize: '0.85rem', color: T.muted, margin: 0 }}>Loading story…</p>
    </div>
  );

  if (error || !meetway) return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: T.bg, padding: '0 24px', textAlign: 'center' }}>
      <span style={{ fontSize: '4rem' }}>🌏</span>
      <p style={{ fontFamily: SANS, fontSize: '1.3rem', fontWeight: 700, color: T.ink, margin: 0 }}>Can't find this journey</p>
      <p style={{ fontFamily: SANS, fontSize: '0.85rem', color: T.muted, margin: 0 }}>{error || 'Meetway not found.'}</p>
      <button
        onClick={() => navigate('/meetways')}
        style={{ marginTop: 12, background: T.coral, color: '#fff', border: 'none', borderRadius: 999, padding: '10px 28px', fontFamily: SANS, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
      >
        Back to Meetways
      </button>
    </div>
  );

  /* ── Derived values (unchanged) ── */
  const tags      = meetway.tags || [];
  const approved  = (meetway.participants || []).filter(p => p.status === 'approved');
  const spotsLeft = meetway.spotsLeft ?? (meetway.maxPeople - approved.length);
  const spotsPct  = (approved.length / meetway.maxPeople) * 100;
  const isHost    = meetway.host?.id === user?.id;
  const hasBudget = meetway.budgetMin || meetway.budgetMax;

  /* ── CTA button (logic unchanged) ── */
  function CtaButton({ compact = false }) {
    const s = {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      borderRadius: 999, fontFamily: SANS, fontWeight: 700, cursor: 'pointer',
      fontSize: compact ? '0.78rem' : '0.875rem',
      padding: compact ? '8px 20px' : '11px 28px',
      transition: 'all .18s ease', border: 'none',
    };
    if (isHost) return (
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={() => navigate(`/meetways/${id}/edit`)}
        style={{ ...s, background: T.cardAlt, color: T.ink, border: `1.5px solid ${T.border}` }}
      >Edit Details</motion.button>
    );
    if (joinStatus === 'joined') return (
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={handleLeave}
        style={{ ...s, background: '#FEE2E2', color: '#DC2626', border: '1.5px solid #FECACA' }}
      >Leave</motion.button>
    );
    if (joinStatus === 'requested') return (
      <button disabled style={{ ...s, background: '#EFF6FF', color: '#3B82F6', border: '1.5px solid #BFDBFE', opacity: 0.8, cursor: 'not-allowed' }}>
        <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Pending
      </button>
    );
    if (joinStatus === 'full') return (
      <button disabled style={{ ...s, background: '#FFF7ED', color: '#EA580C', border: '1.5px solid #FED7AA', opacity: 0.8, cursor: 'not-allowed' }}>
        Fully Booked
      </button>
    );
    return (
      <motion.button onClick={handleJoin} disabled={joinBusy}
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        style={{ ...s, background: T.coral, color: '#fff', opacity: joinBusy ? 0.7 : 1 }}
      >
        {joinBusy ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Joining…</> :
          meetway.privacy === 'private' ? <><Lock style={{ width: 13, height: 13 }} />Request to Join</> :
          <>Join Meetway ✦</>}
      </motion.button>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: T.bg, maxWidth: 672, margin: '0 auto', paddingBottom: 120, minHeight: '100vh', fontFamily: SANS, paddingLeft: 'max(0px, env(safe-area-inset-left))', paddingRight: 'max(0px, env(safe-area-inset-right))' }}>

      {/* ══════════════════════════════════════
          §1  MAGAZINE COVER HERO
      ══════════════════════════════════════ */}
      <div style={{ position: 'relative' }} ref={heroRef}>

        {/* Full-bleed photo */}
        <div style={{ position: 'relative', height: '46vw', maxHeight: 320, minHeight: 220, overflow: 'hidden' }}>
          {meetway.coverPhoto ? (
            <motion.img
              src={meetway.coverPhoto} alt="Cover"
              initial={{ scale: 1.06 }} animate={{ scale: 1 }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${T.coral}, ${T.amber})` }} />
          )}

          {/* Minimal vignette — bottom only */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)' }} />

          {/* Nav buttons */}
          <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/meetways')}
              style={{ width: 40, height: 40, borderRadius: '50%', background: T.card, border: `1.5px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
              <ChevronLeft style={{ width: 18, height: 18, color: T.ink }} />
            </motion.button>
            <div style={{ display: 'flex', gap: 8 }}>
              {meetway.privacy === 'private' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 999, padding: '6px 12px', fontFamily: SANS, fontSize: '0.6rem', fontWeight: 700, color: T.ink, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                  <Lock style={{ width: 10, height: 10 }} /> Private
                </span>
              )}
              <motion.button whileTap={{ scale: 0.88 }}
                onClick={() => navigator.share?.({ title: meetway.title, url: window.location.href })}
                style={{ width: 40, height: 40, borderRadius: '50%', background: T.card, border: `1.5px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
                <Share2 style={{ width: 15, height: 15, color: T.ink }} />
              </motion.button>
            </div>
          </div>

          {/* Location pill at bottom of image */}
          <div style={{ position: 'absolute', bottom: 12, left: 16, zIndex: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 999, padding: '5px 12px', fontFamily: SANS, fontSize: '0.65rem', fontWeight: 600, color: T.ink, boxShadow: '0 1px 8px rgba(0,0,0,0.12)' }}>
              <MapPin style={{ width: 10, height: 10, color: T.coral }} />
              {meetway.destination}{meetway.country ? `, ${meetway.country}` : ''}
            </span>
          </div>
        </div>

        {/* ── Text content BELOW the image ── */}
        <motion.div
          custom={0} variants={rise} initial="hidden" animate="visible"
          style={{ padding: '24px 20px 20px', background: T.bg }}
        >
          <h1 style={{ fontFamily: SANS, fontSize: 'clamp(1.65rem, 6vw, 2.2rem)', fontWeight: 900, color: T.ink, margin: '0 0 10px', lineHeight: 1.15 }}>
            {meetway.title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: SANS, fontSize: '0.78rem', color: T.muted, fontWeight: 500 }}>
              <Calendar style={{ width: 13, height: 13, color: T.coral }} />
              {fmt(meetway.startDate)}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: T.border, display: 'inline-block' }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: SANS, fontSize: '0.78rem', color: T.muted, fontWeight: 500 }}>
              <Users style={{ width: 13, height: 13, color: T.coral }} />
              {approved.length} of {meetway.maxPeople} travelers
            </span>
          </div>
          {/* Italic byline */}
          <p style={{ fontFamily: SANS, fontStyle: 'italic', fontSize: '0.88rem', color: T.muted, margin: '10px 0 0' }}>
            A journey by <span
              onClick={() => meetway.host?.id && navigate(`/users/${meetway.host.id}`)}
              style={{ color: T.coral, cursor: 'pointer', fontStyle: 'normal', fontWeight: 700 }}
            >@{meetway.host?.username}</span>
          </p>
        </motion.div>
      </div>

      <Rule />

      {/* ══════════════════════════════════════
          §2  HOST BYLINE ROW
      ══════════════════════════════════════ */}
      <motion.div custom={1} variants={rise} initial="hidden" animate="visible">
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Monogram name={meetway.host?.username} size={52}
            style={{ border: `2.5px solid ${T.border}`, cursor: 'pointer' }}
            onClick={() => meetway.host?.id && navigate(`/users/${meetway.host.id}`)}
          />
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
            onClick={() => meetway.host?.id && navigate(`/users/${meetway.host.id}`)}>
            <p style={{ fontFamily: SANS, fontWeight: 800, fontSize: '0.95rem', color: T.ink, margin: 0 }}>
              @{meetway.host?.username}
            </p>
            <p style={{ fontFamily: SANS, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, margin: '2px 0 0' }}>
              Story Curator
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isHost && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FFFBEB', color: T.amber, border: `1.5px solid #FDE68A`, borderRadius: 999, padding: '5px 10px', fontFamily: SANS, fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <Star style={{ width: 9, height: 9, fill: T.amber, color: T.amber }} /> Hosting
              </span>
            )}
            <CtaButton />
          </div>
        </div>
      </motion.div>

      <Rule />

      {/* ══════════════════════════════════════
          §3  THE STORY  (editorial body)
      ══════════════════════════════════════ */}
      {meetway.description && (
        <motion.div custom={2} variants={rise} initial="hidden" animate="visible"
          style={{ padding: '36px 20px' }}>
          <SectionHeading serif>The Story</SectionHeading>

          {meetway.description.split('\n\n').map((para, i) => {
            if (i === 0) return (
              <p key={i} style={{ fontFamily: SANS, fontSize: '1rem', lineHeight: 1.9, color: T.ink, margin: '0 0 20px', fontWeight: 400 }}>
                <span style={{ fontFamily: SANS, fontSize: '3.8rem', fontWeight: 900, color: T.coral, float: 'left', lineHeight: 0.78, marginRight: 8, marginTop: 6 }}>
                  {para[0]}
                </span>
                {para.slice(1)}
              </p>
            );
            if (i === 1) return (
              <p key={i} style={{ fontFamily: SANS, fontSize: '1.02rem', lineHeight: 1.9, color: T.ink, margin: '0 0 20px', borderLeft: '3px solid var(--primary)', paddingLeft: 16, fontStyle: 'italic', fontWeight: 400 }}>
                {para}
              </p>
            );
            return (
              <p key={i} style={{ fontFamily: SANS, fontSize: '1rem', lineHeight: 1.9, color: T.ink, margin: '0 0 20px', fontWeight: 400 }}>
                {para}
              </p>
            );
          })}
          <div style={{ clear: 'both' }} />
        </motion.div>
      )}

      {meetway.description && <Rule />}

      {/* ══════════════════════════════════════
          §4  INTERESTS / VIBES
      ══════════════════════════════════════ */}
      {(tags.length > 0 || meetway.privacy === 'private') && (
        <motion.div custom={3} variants={rise} initial="hidden" animate="visible"
          style={{ padding: '28px 20px' }}>
          <SectionHeading>Interests</SectionHeading>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.map(t => (
              <motion.span key={t} whileHover={{ y: -2, scale: 1.04 }}
                style={{ fontFamily: SANS, fontSize: '0.75rem', fontWeight: 600, color: T.coral, background: T.coralBg, border: '1.5px solid rgba(var(--primary-rgb),0.22)', borderRadius: 999, padding: '6px 14px', cursor: 'default', letterSpacing: '0.01em' }}>
                #{t}
              </motion.span>
            ))}
            {meetway.privacy === 'private' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: SANS, fontSize: '0.75rem', fontWeight: 600, color: T.muted, background: T.cardAlt, border: `1.5px solid ${T.border}`, borderRadius: 999, padding: '6px 14px' }}>
                <Lock style={{ width: 11, height: 11 }} /> Private
              </span>
            )}
          </div>
        </motion.div>
      )}

      {(tags.length > 0 || meetway.privacy === 'private') && <Rule />}

      {/* ══════════════════════════════════════
          §5  THE ITINERARY
      ══════════════════════════════════════ */}
      {meetway.itinerary?.length > 0 && (
        <motion.div custom={4} variants={rise} initial="hidden" animate="visible"
          style={{ padding: '28px 20px' }}>
          <button
            onClick={() => setItinOpen(v => !v)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}
          >
            <SectionHeading serif style={{ margin: 0 }}>
              The Itinerary
            </SectionHeading>
            <motion.div animate={{ rotate: itinOpen ? 180 : 0 }} transition={{ duration: 0.25 }}
              style={{ width: 32, height: 32, borderRadius: 8, background: T.cardAlt, border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChevronDown style={{ width: 15, height: 15, color: T.muted }} />
            </motion.div>
          </button>
          <p style={{ fontFamily: SANS, fontSize: '0.75rem', color: T.muted, margin: '0 0 4px', fontWeight: 500 }}>
            {meetway.itinerary.length} stop{meetway.itinerary.length !== 1 ? 's' : ''} · tap to expand
          </p>

          <AnimatePresence initial={false}>
            {itinOpen && (
              <motion.div key="itin"
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ marginTop: 20, position: 'relative', paddingLeft: 44 }}>
                  {/* Timeline line */}
                  <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 1.5, background: `linear-gradient(to bottom, ${T.coral}, ${T.border})` }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[...meetway.itinerary].sort((a, b) => a.day - b.day).map((stop, idx) => (
                      <motion.div key={idx}
                        initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.07 }}
                        style={{ position: 'relative' }}
                      >
                        {/* Day circle */}
                        <div style={{ position: 'absolute', left: -44, width: 30, height: 30, borderRadius: '50%', background: T.coral, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: '0.55rem', fontWeight: 900, boxShadow: `0 0 0 3px ${T.bg}, 0 2px 8px rgba(0,0,0,0.18)`, top: 10 }}>
                          D{stop.day}
                        </div>
                        {/* Card */}
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
                          <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.9rem', color: T.ink, margin: '0 0 4px' }}>{stop.activity}</p>
                          {stop.location && (
                            <p style={{ fontFamily: SANS, fontSize: '0.68rem', fontWeight: 600, color: T.muted, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPin style={{ width: 10, height: 10, color: T.coral, flexShrink: 0 }} />{stop.location}
                            </p>
                          )}
                          {stop.notes && (
                            <p style={{ fontFamily: SANS, fontStyle: 'italic', fontSize: '0.72rem', color: T.muted, margin: '8px 0 0', borderLeft: '2px solid rgba(var(--primary-rgb),0.25)', paddingLeft: 10, lineHeight: 1.6 }}>
                              {stop.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {meetway.itinerary?.length > 0 && <Rule />}

      {/* ══════════════════════════════════════
          §6  ATTACHMENTS
      ══════════════════════════════════════ */}
      {meetway.documents?.length > 0 && (
        <motion.div custom={5} variants={rise} initial="hidden" animate="visible"
          style={{ padding: '28px 20px' }}>
          <SectionHeading>Attachments</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {meetway.documents.map((doc, idx) => {
              const isImg = doc.type?.startsWith('image/');
              const isPdf = doc.type === 'application/pdf';
              return (
                <motion.a key={idx} whileHover={{ y: -2 }}
                  href={doc.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: `1px solid ${T.border}`, background: T.card, textDecoration: 'none' }}>
                  <span style={{ fontSize: '1.4rem', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.cardAlt, borderRadius: 10, border: `1px solid ${T.border}`, flexShrink: 0 }}>
                    {isImg ? '🖼️' : isPdf ? '📄' : '📝'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.85rem', color: T.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                    {doc.size && <p style={{ fontFamily: SANS, fontSize: '0.62rem', color: T.muted, fontWeight: 600, margin: '2px 0 0' }}>{(doc.size / 1024).toFixed(0)} KB</p>}
                  </div>
                </motion.a>
              );
            })}
          </div>
        </motion.div>
      )}

      {meetway.documents?.length > 0 && <Rule />}

      {/* ══════════════════════════════════════
          §7  FELLOW TRAVELERS
      ══════════════════════════════════════ */}
      <motion.div custom={6} variants={rise} initial="hidden" animate="visible"
        style={{ padding: '28px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <SectionHeading serif style={{ marginBottom: 0 }}>Fellow Travelers</SectionHeading>
          <span style={{ fontFamily: SANS, fontSize: '0.72rem', fontWeight: 700, color: spotsLeft > 0 ? T.coral : 'var(--accent)', background: spotsLeft > 0 ? T.coralBg : 'var(--surface-hover)', border: `1.5px solid ${spotsLeft > 0 ? 'rgba(var(--primary-rgb),0.22)' : 'var(--border)'}`, borderRadius: 999, padding: '4px 12px', whiteSpace: 'nowrap', marginTop: 2 }}>
            {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} open` : 'Fully booked'}
          </span>
        </div>

        {/* Avatar scroll */}
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, marginBottom: 16 }}>
          {approved.map(p => (
            <motion.div key={p.id} whileHover={{ y: -4 }}
              onClick={() => p.user?.id && navigate(`/users/${p.user.id}`)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer', width: 58 }}>
              <Monogram name={p.user?.username} size={48}
                style={{ border: `2.5px solid ${p.role === 'host' ? T.amber : T.coral}` }} />
              <span style={{ fontFamily: SANS, fontSize: '0.52rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', background: p.role === 'host' ? T.amber : T.coral, borderRadius: 999, padding: '2px 7px', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.role.toUpperCase()}
              </span>
            </motion.div>
          ))}
          {spotsLeft > 0 && Array.from({ length: Math.min(spotsLeft, 4) }).map((_, i) => (
            <div key={`open-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, width: 58, opacity: 0.35 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2px dashed ${T.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.cardAlt }}>
                <Users style={{ width: 14, height: 14, color: T.muted }} />
              </div>
              <span style={{ fontFamily: SANS, fontSize: '0.52rem', fontWeight: 700, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Open</span>
            </div>
          ))}
        </div>

        {/* Capacity bar */}
        <div style={{ height: 4, borderRadius: 4, background: T.cardAlt, overflow: 'hidden', border: `1px solid ${T.border}` }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${Math.min(spotsPct, 100)}%` }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 }}
            style={{ height: '100%', background: spotsPct >= 100 ? `linear-gradient(to right,#F97316,#EF4444)` : T.coral, borderRadius: 4 }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: SANS, fontSize: '0.62rem', color: T.muted, fontWeight: 600 }}>{approved.length} joined</span>
          <span style={{ fontFamily: SANS, fontSize: '0.62rem', color: T.muted, fontWeight: 600 }}>{meetway.maxPeople} max</span>
        </div>
      </motion.div>

      <Rule />

      {/* ══════════════════════════════════════
          §8  EXPECTED SPEND
      ══════════════════════════════════════ */}
      {hasBudget && (
        <motion.div custom={7} variants={rise} initial="hidden" animate="visible"
          style={{ margin: '0 20px', marginTop: 28, marginBottom: 28 }}>
          <div style={{ border: '2px solid rgba(var(--primary-rgb),0.19)', borderRadius: 18, padding: '20px 22px', background: T.coralBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: SANS, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.coral, margin: '0 0 6px' }}>Expected Spend</p>
              <p style={{ fontFamily: SANS, fontSize: '1.85rem', fontWeight: 900, color: T.ink, margin: 0, lineHeight: 1 }}>
                ₹{meetway.budgetMin ?? '?'} – ₹{meetway.budgetMax ?? '?'}
              </p>
              <p style={{ fontFamily: SANS, fontSize: '0.72rem', color: T.muted, margin: '6px 0 0', fontWeight: 500 }}>Per person</p>
            </div>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(var(--primary-rgb),0.09)', border: '1.5px solid rgba(var(--primary-rgb),0.19)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wallet style={{ width: 24, height: 24, color: T.coral }} />
            </div>
          </div>
        </motion.div>
      )}

      {hasBudget && <Rule />}

      {/* ══════════════════════════════════════
          §9  HOST CONTROLS — PENDING
      ══════════════════════════════════════ */}
      {isHost && (() => {
        const pending = (meetway.participants || []).filter(p => p.status === 'pending');
        if (!pending.length) return null;
        return (
          <motion.div custom={8} variants={rise} initial="hidden" animate="visible"
            style={{ margin: '0 20px 28px', padding: '20px', borderRadius: 16, background: '#FFFBEB', border: `1.5px solid #FDE68A` }}>
            <p style={{ fontFamily: SANS, fontWeight: 800, fontSize: '0.85rem', color: T.amber, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⏳ Pending Requests ({pending.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.card, padding: '10px 14px', borderRadius: 12, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Monogram name={p.user?.username} size={36} />
                    <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.875rem', color: T.ink }}>@{p.user?.username}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button
                      onClick={() => api.patch(`/meetways/${id}/participants/${p.user.id}`, { status: 'approved' }).then(() => window.location.reload())}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontFamily: SANS, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                      <CheckCircle2 style={{ width: 13, height: 13 }} /> <span className="hidden sm:inline">Approve</span>
                    </button>
                    <button
                      onClick={() => api.patch(`/meetways/${id}/participants/${p.user.id}`, { status: 'declined' }).then(() => window.location.reload())}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontFamily: SANS, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                      <XCircle style={{ width: 13, height: 13 }} /> <span className="hidden sm:inline">Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* ══════════════════════════════════════
          §10  THE LOUNGE  (chat)
      ══════════════════════════════════════ */}
      <motion.div custom={9} variants={rise} initial="hidden" animate="visible"
        style={{ padding: '28px 20px 32px' }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.coralBg, border: '1.5px solid rgba(var(--primary-rgb),0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare style={{ width: 16, height: 16, color: T.coral }} />
          </div>
          <div>
            <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: '1.35rem', color: T.ink, margin: 0, lineHeight: 1.2 }}>
              The Lounge <span style={{ color: T.coral }}>✦</span>
            </h2>
            <p style={{ fontFamily: SANS, fontSize: '0.68rem', color: T.muted, margin: '2px 0 0', fontWeight: 500 }}>
              Travel Discussion · {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
          {messages.length > 0 && (
            <span style={{ marginLeft: 'auto', fontFamily: SANS, fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.coral, background: T.coralBg, border: '1px solid rgba(var(--primary-rgb),0.22)', borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap' }}>
              Active
            </span>
          )}
        </div>

        {(joinStatus === 'joined' || joinStatus === 'host') ? (
          <div style={{ borderRadius: 20, border: `1px solid ${T.border}`, background: T.card, overflow: 'hidden' }}>

            {/* Messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '18px 16px', maxHeight: 400, overflowY: 'auto' }}>
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ padding: '40px 0', textAlign: 'center' }}>
                  <p style={{ fontSize: '2.5rem', margin: '0 0 10px' }}>✈️</p>
                  <p style={{ fontFamily: SANS, fontStyle: 'italic', fontSize: '1rem', color: T.ink, margin: '0 0 6px' }}>Be the first to share your story</p>
                  <p style={{ fontFamily: SANS, fontSize: '0.78rem', color: T.muted, margin: 0, maxWidth: 200, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                    Break the ice — your travel story begins here.
                  </p>
                </motion.div>
              )}

              {messages.map((msg, i) => {
                const isMine = msg.user?.id === user?.id;
                return (
                  <motion.div key={msg.id || i} variants={pop} initial="hidden" animate="visible"
                    style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isMine ? 'row-reverse' : 'row' }}>
                    <Monogram name={msg.user?.username} size={28} style={{ flexShrink: 0, marginBottom: 2 }} />
                    <motion.div whileHover={{ y: -1 }}
                      style={{
                        maxWidth: '74%', borderRadius: 16,
                        borderBottomRightRadius: isMine ? 4 : 16,
                        borderBottomLeftRadius: isMine ? 16 : 4,
                        padding: '10px 14px',
                        background: isMine ? T.coral : T.cardAlt,
                        border: isMine ? 'none' : `1px solid ${T.border}`,
                        boxShadow: isMine ? 'var(--shadow-glow)' : '0 1px 6px rgba(0,0,0,0.06)',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexDirection: isMine ? 'row-reverse' : 'row', marginBottom: 4 }}>
                        <span style={{ fontFamily: SANS, fontSize: '0.58rem', fontWeight: 800, color: isMine ? 'rgba(255,255,255,0.7)' : T.coral }}>
                          @{msg.user?.username}
                        </span>
                        <span style={{ fontFamily: SANS, fontSize: '0.5rem', fontWeight: 500, color: isMine ? 'rgba(255,255,255,0.45)' : T.muted }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontFamily: SANS, fontSize: '0.875rem', lineHeight: 1.55, color: isMine ? '#fff' : T.ink, margin: 0, fontWeight: 400 }}>
                        {msg.content}
                      </p>
                    </motion.div>
                  </motion.div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: T.border }} />

            {/* Input */}
            <div style={{ padding: '12px 14px' }}>
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  placeholder="Say something about this journey…"
                  style={{
                    flex: 1, borderRadius: 999, padding: '11px 18px',
                    fontFamily: SANS, fontSize: '0.875rem', fontWeight: 400, color: T.ink,
                    background: T.bg, border: `1.5px solid ${T.border}`,
                    outline: 'none', transition: 'border-color .2s, box-shadow .2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = T.coral; e.target.style.boxShadow = '0 0 0 3px rgba(var(--primary-rgb),0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
                />
                <motion.button type="submit" disabled={sendBusy || !chatMsg.trim()}
                  whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.08 }}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: T.coral, border: 'none', cursor: sendBusy || !chatMsg.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: sendBusy || !chatMsg.trim() ? 0.4 : 1, boxShadow: '0 2px 10px rgba(var(--primary-rgb),0.28)', transition: 'opacity .2s' }}>
                  {sendBusy
                    ? <Loader2 style={{ width: 15, height: 15, color: '#fff', animation: 'spin 1s linear infinite' }} />
                    : <Send style={{ width: 15, height: 15, color: '#fff', marginLeft: 1 }} />
                  }
                </motion.button>
              </form>
            </div>
          </div>

        ) : (
          /* Locked state */
          <motion.div whileHover={{ scale: 1.01 }}
            style={{ padding: '48px 24px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.card, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: T.cardAlt, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Lock style={{ width: 24, height: 24, color: T.muted }} />
            </div>
            <p style={{ fontFamily: SANS, fontStyle: 'italic', fontSize: '1.2rem', color: T.ink, margin: '0 0 8px', fontWeight: 700 }}>
              {joinStatus === 'requested' ? 'Request Pending' : 'Join the Journey'}
            </p>
            <p style={{ fontFamily: SANS, fontSize: '0.82rem', color: T.muted, margin: '0 auto', maxWidth: 220, lineHeight: 1.65, fontWeight: 400 }}>
              {joinStatus === 'requested'
                ? "Your request is under review. You'll get access once approved."
                : 'Be part of this journey — join to read and send messages.'}
            </p>
            {joinStatus !== 'requested' && (
              <div style={{ marginTop: 22 }}>
                <CtaButton compact />
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ══════════════════════════════════════
          §11  STICKY BOTTOM BAR
      ══════════════════════════════════════ */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 16px', background: 'rgba(var(--bg-rgb),0.96)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div style={{ maxWidth: 672, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              {hasBudget && (
                <>
                  <p style={{ fontFamily: SANS, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, margin: '0 0 2px' }}>Starting from</p>
                  <p style={{ fontFamily: SANS, fontSize: '1.25rem', fontWeight: 900, color: T.ink, margin: 0, lineHeight: 1 }}>₹{meetway.budgetMin}</p>
                </>
              )}
              <p style={{ fontFamily: SANS, fontSize: '0.6rem', fontWeight: 600, color: T.muted, margin: hasBudget ? '3px 0 0' : 0, letterSpacing: '0.04em' }}>
                {spotsLeft > 0
                  ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left · ${meetway.maxPeople} total`
                  : `All ${meetway.maxPeople} spots filled`}
              </p>
            </div>
            <CtaButton />
          </div>
        </div>
      </div>

      <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
