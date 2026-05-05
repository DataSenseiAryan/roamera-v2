import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, MapPin, Plane, Copy, Sparkles, PlusCircle, Globe, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';

const PLANE_OPTIONS = [
  {
    id: 'copy',
    label: 'Copy Existing Itinerary',
    sub: 'Browse & clone a trip',
    icon: <Copy size={15} />,
    path: '/meetways',
  },
  {
    id: 'create',
    label: 'Create Your Itinerary',
    sub: 'Build from scratch',
    icon: <PlusCircle size={15} />,
    path: '/meetways/create',
  },
  {
    id: 'ai',
    label: 'AI Trip Planner',
    sub: 'Let AI plan for you',
    icon: <Sparkles size={15} />,
    path: '/meetways',
    accent: true,
  },
];

function PlaneMenu({ onClose, buttonRef, journal }) {
  const navigate = useNavigate();
  const menuRef  = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, buttonRef]);

  function handleOption(e, opt) {
    e.stopPropagation();
    onClose();
    if (opt.id === 'copy') {
      navigate('/meetways/create', {
        state: {
          prefill: {
            journalId:   journal.id,
            sourceTitle: journal.title,
            title:       `Journey to ${journal.destination}`,
            destination: journal.destination,
            dateStart:   journal.startDate ? new Date(journal.startDate).toISOString().slice(0, 10) : '',
            dateEnd:     journal.endDate   ? new Date(journal.endDate).toISOString().slice(0, 10)   : '',
          },
        },
      });
    } else {
      navigate(opt.path);
    }
  }

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 44,
        right: 0,
        zIndex: 200,
        width: 236,
        background: 'var(--surface-hover)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 6,
        boxShadow: '0 16px 40px rgba(0,0,0,0.16)',
        animation: 'fadeSlideDown 0.18s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>

      <p style={{
        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.09em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
        padding: '6px 10px 5px',
      }}>
        Plan your trip
      </p>

      {PLANE_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={(e) => handleOption(e, opt)}
          className="flex items-center gap-3 w-full p-2.5 bg-transparent border-none cursor-pointer rounded-xl transition-colors text-left hover:bg-[var(--surface-hover)]"
        >
          <span
            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border transition-all"
            style={{
              background:  opt.accent ? 'var(--primary-dim)' : 'var(--surface)',
              borderColor: opt.accent ? 'var(--primary)'     : 'var(--border)',
              color:       opt.accent ? 'var(--primary)'     : 'var(--text-muted)',
            }}
          >
            {opt.icon}
          </span>
          <span className="flex flex-col gap-0.5">
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: opt.accent ? 'var(--primary)' : 'var(--text)' }}>
              {opt.label}
            </span>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              {opt.sub}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

export default function JournalCard({ journal }) {
  const { id, title, destination, startDate, endDate, photos, user, _count } = journal;
  const navigate   = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef  = useRef(null);

  const dateRange = startDate && endDate
    ? `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : null;

  function handlePlaneClick(e) {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  }

  return (
    <motion.div
      onClick={() => navigate(`/journals/${id}`)}
      whileHover={{
        y: -4,
        boxShadow: '0 14px 36px rgba(0,0,0,0.11)',
        transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
      }}
      whileTap={{ scale: 0.985 }}
      className="cursor-pointer rounded-[20px] overflow-visible relative flex flex-col group h-full"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 10px rgba(0,0,0,0.05)',
        transition: 'border-color 0.22s ease',
      }}
    >
      {/* ── IMAGE ──────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-t-[20px] shrink-0 aspect-[4/3] sm:aspect-[4/3]"
        style={{ minHeight: 180 }}
      >
        {photos && photos.length > 0 ? (
          <>
            <motion.img
              src={photos[0]}
              alt={title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            {/* Gradient overlay: subtle top, rich bottom for legibility */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, transparent 30%, rgba(0,0,0,0.48) 100%)',
              }}
            />
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--primary-dim), var(--surface-hover))' }}
          >
            <Globe style={{ width: 44, height: 44, opacity: 0.24, color: 'var(--primary)' }} />
          </div>
        )}

        {/* Location pill — top left */}
        {destination && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(0,0,0,0.42)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            <MapPin style={{ width: 10, height: 10, color: '#fff', flexShrink: 0 }} />
            <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.01em' }}>
              {destination}
            </span>
          </div>
        )}

        {/* Plane action button — top right */}
        <div className="absolute top-3 right-3 z-10">
          <button
            ref={buttonRef}
            onClick={handlePlaneClick}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
            style={{
              background: menuOpen ? 'var(--primary)' : 'rgba(0,0,0,0.36)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: `1px solid ${menuOpen ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
              color: '#fff',
              boxShadow: menuOpen ? '0 3px 16px var(--shadow-glow)' : 'none',
            }}
          >
            <Plane style={{ width: 12, height: 12 }} />
          </button>

          {menuOpen && (
            <PlaneMenu onClose={() => setMenuOpen(false)} buttonRef={buttonRef} journal={journal} />
          )}
        </div>

        {/* Bookmark — bottom right, visible on hover */}
        <motion.button
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.85 }}
          whileHover={{ scale: 1.08 }}
          className="absolute bottom-3 right-3 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: 'rgba(0,0,0,0.36)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.16)',
            color: '#fff',
          }}
          title="Save"
        >
          <Bookmark style={{ width: 10, height: 10 }} />
        </motion.button>
      </div>

      {/* ── CARD BODY ──────────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-4 flex flex-col flex-1">

        {/* Title */}
        <h2
          className="leading-snug line-clamp-2 mb-1"
          style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}
        >
          {title}
        </h2>

        {/* Date */}
        {dateRange && (
          <p style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.75rem' }}>
            {dateRange}
          </p>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: '0.7rem' }} />

        {/* Author + Stats */}
        <div className="flex items-center justify-between mt-auto">
          <Link
            to={`/users/${user.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity min-w-0"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                className="w-6 h-6 rounded-full object-cover shrink-0"
                style={{ border: '1.5px solid var(--border)' }}
                alt=""
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{ fontSize: '0.56rem', background: 'var(--primary)' }}
              >
                {user.username[0].toUpperCase()}
              </div>
            )}
            <span
              className="truncate"
              style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--text-muted)' }}
            >
              {user.username}
            </span>
          </Link>

          <div
            className="flex items-center gap-3 shrink-0"
            style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}
          >
            <span className="flex items-center gap-1">
              <Heart style={{ width: 11, height: 11 }} />
              {_count.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare style={{ width: 11, height: 11 }} />
              {_count.comments}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
