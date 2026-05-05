import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Fonts ──────────────────────────────────────────────── */
function useGoogleFonts() {
  useEffect(() => {
    const href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap';
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }, []);
}

/* ─── Tokens ─────────────────────────────────────────────── */
const A = '#F59E0B';
const D = 'var(--text)';
const M = 'var(--text-muted)';
const B = 'var(--border)';

const BG = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&auto=format&fit=crop';

/* ─── SVG icons ──────────────────────────────────────────── */
const Compass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={A} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);
const Mail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ stroke: 'var(--text-muted)' }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const Lock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ stroke: 'var(--text-muted)' }}>
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const Eye = ({ crossed }) => crossed ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const Spinner = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'authSpin 0.75s linear infinite' }}>
    <style>{`@keyframes authSpin{to{transform:rotate(360deg)}}`}</style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

/* ─── Field ──────────────────────────────────────────────── */
function Field({ label, id, aside, icon, end, hint, ...props }) {
  const [on, setOn] = useState(false);
  return (
    <div>
      {(label || aside) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          {label && (
            <label htmlFor={id} style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: D,
            }}>
              {label}
            </label>
          )}
          {aside}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', display: 'flex',
          }}>
            {icon}
          </span>
        )}
        <input
          id={id}
          {...props}
          onFocus={e => { setOn(true); props.onFocus?.(e); }}
          onBlur={e => { setOn(false); props.onBlur?.(e); }}
          style={{
            width: '100%', height: 54, borderRadius: 14,
            border: `1.5px solid ${on ? A : B}`,
            boxShadow: on ? `0 0 0 3.5px rgba(245,158,11,0.13)` : 'none',
            background: 'var(--surface, #fff)',
            paddingLeft: icon ? 44 : 16,
            paddingRight: end ? 46 : 16,
            fontFamily: "'Inter', sans-serif", fontSize: 15, color: D,
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />
        {end && (
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            display: 'flex',
          }}>
            {end}
          </span>
        )}
      </div>
      {hint && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: M, marginTop: 5 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/* ─── Primary button ─────────────────────────────────────── */
function PrimaryBtn({ loading, children, ...props }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileTap={{ scale: 0.97 }}
      style={{
        width: '100%', height: 56, borderRadius: 9999,
        border: 'none', background: A, color: '#fff',
        fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16,
        cursor: loading ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: loading ? 0.75 : 1,
        transition: 'opacity 0.2s',
        letterSpacing: '-0.01em',
      }}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </motion.button>
  );
}

/* ─── Error banner ───────────────────────────────────────── */
function ErrorBanner({ msg }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{ overflow: 'hidden', marginBottom: 16 }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(220,38,38,0.07)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 12, padding: '11px 14px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#dc2626', lineHeight: 1.4 }}>
              {msg}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════════════════════ */
export default function Login() {
  useGoogleFonts();

  /* existing state + logic — untouched */
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email || form.email)}`);
        return;
      }
      setError(data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  const eyeBtn = (
    <button type="button" onClick={() => setShowPw(v => !v)}
      aria-label={showPw ? 'Hide password' : 'Show password'}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: M, padding: 4, display: 'flex' }}>
      <Eye crossed={showPw} />
    </button>
  );

  /* form content — shared between mobile and desktop card */
  const formContent = (
    <>
      <h1 style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em',
        lineHeight: 1.12, color: D, marginBottom: 6,
      }}>
        Welcome back.
      </h1>
      <p style={{
        fontFamily: "'Inter', sans-serif", fontSize: 15, color: M,
        lineHeight: 1.55, marginBottom: 28,
      }}>
        Sign in to continue your journey.
      </p>

      <ErrorBanner msg={error} />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field
          label="Email or username"
          id="login-email"
          type="text"
          required
          autoComplete="username"
          placeholder="explorer@roamera.app"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          icon={<Mail />}
        />

        <Field
          label="Password"
          id="login-password"
          type={showPw ? 'text' : 'password'}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          icon={<Lock />}
          end={eyeBtn}
          aside={
            <a href="#" style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
              color: A, textDecoration: 'none',
            }}>
              Forgot?
            </a>
          }
        />

        <PrimaryBtn loading={loading}>
          Sign in
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </PrimaryBtn>
      </form>

      <p style={{
        fontFamily: "'Inter', sans-serif", fontSize: 14,
        color: M, textAlign: 'center', marginTop: 24,
      }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: A, fontWeight: 600, textDecoration: 'none' }}>
          Sign up
        </Link>
      </p>

      <p style={{
        fontFamily: "'Inter', sans-serif", fontSize: 12, color: M,
        textAlign: 'center', marginTop: 16, lineHeight: 1.6,
      }}>
        By continuing you agree to our{' '}
        <a href="#" style={{ color: M, textDecoration: 'underline' }}>Terms</a>
        {' '}&amp;{' '}
        <a href="#" style={{ color: M, textDecoration: 'underline' }}>Privacy</a>.
      </p>
    </>
  );

  return (
    <div style={{ minHeight: '100svh', position: 'relative', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ══ Desktop: full-bleed fixed background ════════════ */}
      <div className="hidden lg:block" style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <img
          src={BG}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.58) 100%)',
        }} />
      </div>

      {/* ══ Mobile layout ═══════════════════════════════════ */}
      <div className="flex flex-col lg:hidden" style={{
        minHeight: '100svh', background: 'var(--bg, #FAFAF9)',
      }}>
        {/* Mobile hero strip */}
        <div style={{ position: 'relative', height: 220, flexShrink: 0 }}>
          <img
            src={BG}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 55%, rgba(249,249,248,0.98) 100%)',
          }} />
          <div style={{ position: 'absolute', top: 0, left: 0, padding: '52px 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 19, letterSpacing: '-0.3px' }}>Roamera</span>
          </div>
        </div>

        {/* Mobile form */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '24px 16px 40px', overflowY: 'auto',
        }}>
          <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {formContent}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ══ Desktop: centered glass card ════════════════════ */}
      <div className="hidden lg:flex" style={{
        position: 'relative', zIndex: 1,
        minHeight: '100svh',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'var(--surface)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: 24,
            padding: '44px 40px',
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 24px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.18)',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 28 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: A,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.3px', color: D }}>Roamera</span>
          </div>

          {formContent}
        </motion.div>
      </div>
    </div>
  );
}
