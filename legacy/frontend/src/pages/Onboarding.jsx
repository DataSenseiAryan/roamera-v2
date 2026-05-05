import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Google Fonts ─────────────────────────────────────── */
function useGoogleFonts() {
  useEffect(() => {
    const href =
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap';
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = Object.assign(document.createElement('link'), {
      rel: 'stylesheet',
      href,
    });
    document.head.appendChild(link);
  }, []);
}

/* ─── Design tokens ────────────────────────────────────── */
const AMBER  = '#F59E0B';
const DARK   = 'var(--text)';
const MUTED  = 'var(--text-muted)';
const BORDER = 'var(--border)';

/* ─── Data ─────────────────────────────────────────────── */
const CAROUSEL_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop',
    num: '01 / 04',
    headline: 'Discover Journeys\nFrom Around The World',
    body: 'Browse thousands of travel stories written by real adventurers. Get inspired for your next trip.',
  },
  {
    img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop',
    num: '02 / 04',
    headline: 'Share Your Story\nWith The World',
    body: 'Document every moment of your journey. From hidden gems to iconic landmarks — your story matters.',
  },
  {
    img: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=1200&auto=format&fit=crop',
    num: '03 / 04',
    headline: 'Plan Trips\nEffortlessly',
    body: 'AI-powered itineraries tailored to your style. Day-by-day plans ready in seconds.',
  },
  {
    img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop',
    num: '04 / 04',
    headline: 'Connect With\nFellow Travelers',
    body: 'Find travel companions, share tips, and build lasting friendships with explorers worldwide.',
  },
];

const DESTINATIONS = [
  { emoji: '🏖️', label: 'Beach & Islands' },
  { emoji: '🏔️', label: 'Mountains' },
  { emoji: '🏙️', label: 'City Breaks' },
  { emoji: '🌿', label: 'Nature & Wildlife' },
  { emoji: '🏛️', label: 'Culture & History' },
  { emoji: '🗺️', label: 'Off The Beaten Path' },
];

const TRAVEL_STYLES = [
  { emoji: '🧗', label: 'Adventure' },
  { emoji: '✈️', label: 'Backpacker' },
  { emoji: '💎', label: 'Luxury' },
  { emoji: '🎒', label: 'Budget' },
];

/* ─── Shared SVG Icons ─────────────────────────────────── */
function CompassIcon({ size = 18, color = AMBER }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ stroke: 'var(--text)' }}>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ stroke: 'var(--text-muted)' }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

/* ─── Wordmark (shared) ────────────────────────────────── */
function Wordmark({ dark = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <CompassIcon size={20} color={AMBER} />
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        fontSize: '18px',
        letterSpacing: '-0.3px',
        color: dark ? DARK : 'white',
      }}>
        Roamera
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 1 — Splash / Welcome
═══════════════════════════════════════════════════════════ */
function SplashScreen({ onNext, onSignIn }) {
  return (
    <div className="fixed inset-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero */}
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop"
        alt="Beach at golden hour"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(10,8,6,0.93) 0%, rgba(10,8,6,0.58) 42%, rgba(0,0,0,0.12) 72%, transparent 100%)',
      }} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 px-6 pt-14">
        <Wordmark />
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-12">
        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <span style={{
            background: AMBER,
            color: 'white',
            fontSize: '11px',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '6px 18px',
            borderRadius: 9999,
          }}>
            Travel · Share · Discover
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontWeight: 800,
          fontSize: 'clamp(36px, 10vw, 46px)',
          lineHeight: 1.08,
          color: 'white',
          textAlign: 'center',
          letterSpacing: '-0.03em',
          marginBottom: '16px',
        }}>
          The World Is<br />Waiting
        </h1>

        {/* Subtext */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          fontSize: '15px',
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.72)',
          textAlign: 'center',
          maxWidth: '290px',
          margin: '0 auto 32px',
        }}>
          Discover journals from real travelers.<br />Plan your next adventure.
        </p>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          style={{
            width: '100%',
            height: '56px',
            borderRadius: 9999,
            border: 'none',
            background: AMBER,
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: '17px',
            cursor: 'pointer',
            letterSpacing: '-0.1px',
            boxShadow: '0 8px 28px rgba(245,158,11,0.40)',
          }}
        >
          Get Started
        </motion.button>

        {/* Sign in link */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: 'rgba(255,255,255,0.55)',
          textAlign: 'center',
          marginTop: '18px',
        }}>
          Already have an account?{' '}
          <button onClick={onSignIn} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.88)',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'underline',
            padding: 0,
          }}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 2 — Intro Carousel (4 slides)
═══════════════════════════════════════════════════════════ */
function CarouselScreen({ onNext, onSkip }) {
  const [slide, setSlide] = useState(0);

  const goNext = () => {
    if (slide < CAROUSEL_SLIDES.length - 1) setSlide(s => s + 1);
    else onNext();
  };

  const s = CAROUSEL_SLIDES[slide];

  return (
    <div className="fixed inset-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Background image with crossfade */}
      <AnimatePresence mode="wait">
        <motion.img
          key={slide}
          src={s.img}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      {/* Gradient */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(8,6,4,0.94) 0%, rgba(8,6,4,0.52) 48%, rgba(0,0,0,0.08) 72%, transparent 100%)',
      }} />

      {/* Skip button */}
      <div className="absolute top-0 right-0 pt-14 pr-6">
        <button onClick={onSkip} style={{
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: 9999,
          padding: '8px 18px',
          color: 'rgba(255,255,255,0.88)',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: '14px',
          cursor: 'pointer',
        }}>
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Slide number pill */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <span style={{
                border: `1px solid ${AMBER}`,
                color: AMBER,
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                letterSpacing: '0.06em',
                padding: '5px 16px',
                borderRadius: 9999,
              }}>
                {s.num}
              </span>
            </div>

            {/* Headline */}
            <h2 style={{
              fontWeight: 800,
              fontSize: 'clamp(28px, 8vw, 36px)',
              lineHeight: 1.14,
              color: 'white',
              textAlign: 'center',
              letterSpacing: '-0.025em',
              marginBottom: '14px',
              whiteSpace: 'pre-line',
            }}>
              {s.headline}
            </h2>

            {/* Body */}
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
              maxWidth: '300px',
              margin: '0 auto',
            }}>
              {s.body}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Pagination dots */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px', marginBottom: '20px' }}>
          {CAROUSEL_SLIDES.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setSlide(i)}
              animate={{
                width: i === slide ? 24 : 8,
                background: i === slide ? AMBER : 'rgba(255,255,255,0.32)',
              }}
              transition={{ duration: 0.28 }}
              style={{ height: 8, borderRadius: 9999, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
            />
          ))}
        </div>

        {/* Next / Continue */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={goNext}
          style={{
            width: '100%',
            height: '56px',
            borderRadius: 9999,
            border: 'none',
            background: AMBER,
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: '17px',
            cursor: 'pointer',
            boxShadow: '0 8px 28px rgba(245,158,11,0.38)',
          }}
        >
          {slide < CAROUSEL_SLIDES.length - 1 ? 'Next' : 'Continue'}
        </motion.button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 3 — Personalization
═══════════════════════════════════════════════════════════ */
function PersonalizationScreen({ onNext, onBack }) {
  const [selectedDests, setSelectedDests] = useState(['Beach & Islands', 'Mountains', 'Nature & Wildlife']);
  const [selectedStyle, setSelectedStyle] = useState('Adventure');

  const toggleDest = (label) =>
    setSelectedDests(prev =>
      prev.includes(label) ? prev.filter(d => d !== label) : [...prev, label]
    );

  const handleContinue = () => {
    localStorage.setItem('roamera_interests', JSON.stringify({ destinations: selectedDests, style: selectedStyle }));
    onNext();
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{
      background: 'var(--bg)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* ── Progress bar ── */}
      <div style={{ display: 'flex', gap: '6px', padding: '48px 24px 0' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 9999,
            background: i < 2 ? AMBER : BORDER,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* ── Header ── */}
      <div style={{ padding: '16px 24px 0' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 0', marginBottom: '20px',
          display: 'flex', alignItems: 'center',
        }}>
          <BackIcon />
        </button>
        <h1 style={{
          fontWeight: 800, fontSize: '28px', color: DARK,
          lineHeight: 1.18, letterSpacing: '-0.025em', marginBottom: '8px',
        }}>
          What kind of traveler are you?
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px', color: MUTED, lineHeight: 1.55,
        }}>
          Select all that apply. We'll personalize your feed.
        </p>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 0', scrollbarWidth: 'none' }}>

        {/* Section label */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px', fontWeight: 600, color: MUTED,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: '14px', marginTop: '24px',
        }}>
          Dream Destinations
        </p>

        {/* Destination chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {DESTINATIONS.map(({ emoji, label }) => {
            const on = selectedDests.includes(label);
            return (
              <motion.button
                key={label}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleDest(label)}
                style={{
                  height: '44px',
                  padding: '0 16px',
                  borderRadius: 9999,
                  border: `1.5px solid ${on ? AMBER : 'var(--border)'}`,
                  background: on ? AMBER : 'var(--surface)',
                  color: on ? 'white' : 'var(--text)',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: on ? '0 2px 12px rgba(245,158,11,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'all 0.18s ease',
                }}
              >
                <span role="img" aria-hidden>{emoji}</span>
                <span>{label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Section label */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px', fontWeight: 600, color: MUTED,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: '14px', marginTop: '32px',
        }}>
          Travel Style
        </p>

        {/* Style cards — horizontal scroll */}
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
          {TRAVEL_STYLES.map(({ emoji, label }) => {
            const on = selectedStyle === label;
            return (
              <motion.button
                key={label}
                whileTap={{ scale: 0.94 }}
                onClick={() => setSelectedStyle(label)}
                style={{
                  flexShrink: 0,
                  width: '90px',
                  height: '102px',
                  borderRadius: '16px',
                  border: `2px solid ${on ? AMBER : 'var(--border)'}`,
                  background: on ? '#FEF3C7' : 'var(--surface)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: on ? `0 4px 16px rgba(245,158,11,0.28)` : '0 1px 4px rgba(0,0,0,0.07)',
                  transition: 'all 0.18s ease',
                }}
              >
                <span role="img" aria-hidden style={{ fontSize: '28px', lineHeight: 1 }}>{emoji}</span>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px', fontWeight: 600,
                  color: on ? '#92400E' : MUTED,
                }}>
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div style={{ height: '24px' }} />
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div style={{
        flexShrink: 0,
        padding: '16px 24px 40px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          style={{
            width: '100%', height: '56px', borderRadius: 9999,
            border: 'none', background: AMBER, color: 'white',
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '17px', cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(245,158,11,0.38)',
          }}
        >
          Continue →
        </motion.button>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px', color: MUTED, textAlign: 'center', marginTop: '12px',
        }}>
          You can change this anytime in Settings
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 4 — Sign Up / Login
═══════════════════════════════════════════════════════════ */
function AuthScreen({ onRegister, onLogin, onContinueAsGuest }) {
  const [showPassword, setShowPassword] = useState(false);

  const inputStyle = {
    width: '100%',
    height: '52px',
    borderRadius: '12px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    padding: '0 16px',
    fontFamily: "'Inter', sans-serif",
    fontSize: '15px',
    color: 'var(--text)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{
      background: 'var(--bg)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '48px 24px 48px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <Wordmark dark />
        </div>

        {/* Headline */}
        <h1 style={{
          fontWeight: 800, fontSize: '28px', color: DARK,
          textAlign: 'center', letterSpacing: '-0.025em', marginBottom: '8px',
        }}>
          Join the journey
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px', color: MUTED, textAlign: 'center', marginBottom: '32px',
        }}>
          Create your free account and start exploring.
        </p>

        {/* Social auth */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onRegister}
            style={{
              width: '100%', height: '52px', borderRadius: 9999,
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '15px', color: 'var(--text)',
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onRegister}
            style={{
              width: '100%', height: '52px', borderRadius: 9999,
              border: 'none', background: '#1C1917',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '15px', color: 'white',
              cursor: 'pointer',
            }}
          >
            <AppleIcon />
            Continue with Apple
          </motion.button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: BORDER }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: MUTED }}>or</span>
          <div style={{ flex: 1, height: '1px', background: BORDER }} />
        </div>

        {/* Email form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' }}>
          <div>
            <label style={{
              display: 'block',
              fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: DARK,
              marginBottom: '6px',
            }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: DARK,
              marginBottom: '6px',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                style={{ ...inputStyle, paddingRight: '48px' }}
              />
              <button
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <EyeIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Forgot password */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button onClick={onLogin} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: AMBER,
            padding: 0,
          }}>
            Forgot password?
          </button>
        </div>

        {/* Create account CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRegister}
          style={{
            width: '100%', height: '56px', borderRadius: 9999,
            border: 'none', background: AMBER, color: 'white',
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '17px', cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(245,158,11,0.38)',
            marginBottom: '24px',
          }}
        >
          Create Account
        </motion.button>

        {/* Sign in link */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px', color: MUTED, textAlign: 'center', marginBottom: '16px',
        }}>
          Already have an account?{' '}
          <button onClick={onLogin} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '14px',
            color: AMBER, textDecoration: 'underline', padding: 0,
          }}>
            Sign In
          </button>
        </p>

        {/* Guest link */}
        <p style={{ textAlign: 'center' }}>
          <button onClick={onContinueAsGuest} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '14px',
            color: MUTED, padding: 0,
          }}>
            Continue without account →
          </button>
        </p>

        {/* Terms */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px', color: MUTED, textAlign: 'center', marginTop: '24px',
          lineHeight: 1.6,
        }}>
          By continuing, you agree to our{' '}
          <span style={{ color: AMBER, cursor: 'pointer' }}>Terms</span>
          {' '}&amp;{' '}
          <span style={{ color: AMBER, cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 5 — Final CTA "You're Ready to Explore!"
═══════════════════════════════════════════════════════════ */
function FinalCTAScreen({ onStartExploring, onExploreAsGuest }) {
  return (
    <div className="fixed inset-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Background */}
      <img
        src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop"
        alt="Aerial travel view"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(10,8,6,0.95) 0%, rgba(10,8,6,0.6) 45%, rgba(0,0,0,0.22) 72%, transparent 100%)',
      }} />

      {/* Wordmark */}
      <div className="absolute top-0 left-0 pt-14 pl-6">
        <Wordmark />
      </div>

      {/* Glass card — centered vertically */}
      <div className="absolute left-6 right-6" style={{
        top: '50%', transform: 'translateY(-55%)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'rgba(255,255,255,0.13)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: '28px',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          {/* Check circle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
              style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: AMBER,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(245,158,11,0.5)',
              }}
            >
              <CheckIcon />
            </motion.div>
          </div>

          <h2 style={{
            fontWeight: 800,
            fontSize: '24px',
            color: 'white',
            letterSpacing: '-0.025em',
            marginBottom: '12px',
          }}>
            You're Ready to Explore!
          </h2>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: 'rgba(255,255,255,0.76)',
            lineHeight: 1.65,
            maxWidth: '280px',
            margin: '0 auto 22px',
          }}>
            Your personalized travel feed is waiting. Discover stories, plan trips, and connect with explorers worldwide.
          </p>

          {/* Stat pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {['10K+ Journals', '50+ Countries', 'Real Stories'].map(stat => (
              <span key={stat} style={{
                background: AMBER,
                color: 'white',
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                padding: '5px 14px',
                borderRadius: 9999,
              }}>
                {stat}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom CTAs */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-12">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStartExploring}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          style={{
            width: '100%',
            height: '60px',
            borderRadius: 9999,
            border: 'none',
            background: AMBER,
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: '17px',
            cursor: 'pointer',
            boxShadow: '0 10px 36px rgba(245,158,11,0.50)',
            marginBottom: '16px',
          }}
        >
          Start Exploring →
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onExploreAsGuest}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: '14px',
            color: 'rgba(255,255,255,0.55)',
            padding: '6px',
          }}
        >
          Explore as Guest
        </motion.button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT — Onboarding orchestrator
═══════════════════════════════════════════════════════════ */

const STEP_SPLASH    = 0;
const STEP_CAROUSEL  = 1;

const slideVariants = {
  enter:  { opacity: 0, x: 32 },
  center: { opacity: 1, x: 0 },
  exit:   { opacity: 0, x: -28 },
};
const transition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] };

export default function Onboarding() {
  useGoogleFonts();

  const [step, setStep] = useState(STEP_SPLASH);
  const navigate = useNavigate();

  function markSeen() { localStorage.setItem('roamera_onboarded', '1'); }
  const goRegister = () => { markSeen(); navigate('/register'); };
  const goLogin    = () => { markSeen(); navigate('/login'); };

  const screen = (() => {
    switch (step) {
      case STEP_SPLASH:
        return (
          <SplashScreen
            onNext={() => setStep(STEP_CAROUSEL)}
            onSignIn={goLogin}
          />
        );
      case STEP_CAROUSEL:
        return (
          <CarouselScreen
            onNext={goRegister}
            onSkip={goRegister}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className="fixed inset-0"
      >
        {screen}
      </motion.div>
    </AnimatePresence>
  );
}
