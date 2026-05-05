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

const BG = 'https://images.unsplash.com/photo-1542401886-65d6c61db217?q=80&w=1600&auto=format&fit=crop';

/* ─── Existing logic — untouched ─────────────────────────── */
const STEPS = [
  { id: 1, label: 'Identity',    hint: 'Pick your explorer name' },
  { id: 2, label: 'Credentials', hint: 'Secure your account'     },
];

function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#22c55e', '#10b981'];

/* ─── SVG icons ──────────────────────────────────────────── */
const User = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ stroke: 'var(--text-muted)' }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
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
const Check = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
    stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const Spinner = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'regSpin 0.75s linear infinite' }}>
    <style>{`@keyframes regSpin{to{transform:rotate(360deg)}}`}</style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

/* ─── Field ──────────────────────────────────────────────── */
function Field({ label, id, icon, end, hint, ...props }) {
  const [on, setOn] = useState(false);
  return (
    <div>
      {label && (
        <label htmlFor={id} style={{
          display: 'block', fontFamily: "'Inter', sans-serif",
          fontSize: 13, fontWeight: 600, color: D, marginBottom: 6,
        }}>
          {label}
        </label>
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
            position: 'absolute', right: 14, top: '50%',
            transform: 'translateY(-50%)', display: 'flex',
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

/* ─── Step bar ────────────────────────────────────────────── */
function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
      {STEPS.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < STEPS.length - 1 ? 1 : 'initial' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 700,
              background: current > s.id ? '#22c55e' : current === s.id ? A : 'var(--surface-hover)',
              color: current >= s.id ? '#fff' : M,
              transition: 'background 0.25s',
            }}>
              {current > s.id ? <Check /> : s.id}
            </div>
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
              color: current === s.id ? D : M,
            }}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              flex: 1, height: 1,
              background: current > s.id ? '#22c55e' : 'var(--border)',
              transition: 'background 0.25s',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Error banner ────────────────────────────────────────── */
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
   REGISTER
════════════════════════════════════════════════════════════ */
export default function Register() {
  useGoogleFonts();

  /* existing state + logic — untouched */
  const [form, setForm]       = useState({ username: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(1);
  const [showPw, setShowPw]   = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const strength = pwStrength(form.password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function handleStep1(e) {
    e.preventDefault();
    if (!form.username.trim()) return;
    setError('');
    setStep(2);
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
        Create an account.
      </h1>
      <p style={{
        fontFamily: "'Inter', sans-serif", fontSize: 15, color: M,
        lineHeight: 1.55, marginBottom: 24,
      }}>
        Start your journey and discover the world.
      </p>

      <StepBar current={step} />

      <ErrorBanner msg={error} />

      {/* ── Step 1 ── */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form
            key="s1"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleStep1}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            <Field
              label="Username"
              id="reg-username"
              type="text"
              required
              autoFocus
              autoComplete="username"
              placeholder="nomad_explorer"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              icon={<User />}
              hint="This is your public name on Roamera."
            />
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', height: 56, borderRadius: 9999,
                border: 'none', background: A, color: '#fff',
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, letterSpacing: '-0.01em',
              }}
            >
              Continue
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </motion.button>
          </motion.form>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <motion.form
            key="s2"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            {/* Username chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 14px', borderRadius: 12,
              background: 'var(--surface-hover)', border: '1px solid var(--border)',
            }}>
              <User />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: M }}>@</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: D, flex: 1 }}>
                {form.username}
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: A,
                }}
              >
                Edit
              </button>
            </div>

            <Field
              label="Email"
              id="reg-email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="explorer@roamera.app"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              icon={<Mail />}
            />

            <div>
              <Field
                label="Password"
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                icon={<Lock />}
                end={eyeBtn}
              />
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 9999,
                        background: i <= strength ? STRENGTH_COLORS[strength] : 'var(--border)',
                        transition: 'background 0.22s',
                      }} />
                    ))}
                  </div>
                  <p style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 12,
                    color: STRENGTH_COLORS[strength],
                  }}>
                    {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
            </div>

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
                opacity: loading ? 0.75 : 1, transition: 'opacity 0.2s',
                letterSpacing: '-0.01em',
              }}
            >
              {loading ? <Spinner /> : (
                <>
                  Create account
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      <p style={{
        fontFamily: "'Inter', sans-serif", fontSize: 14,
        color: M, textAlign: 'center', marginTop: 24,
      }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: A, fontWeight: 600, textDecoration: 'none' }}>
          Sign in
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
          background: 'linear-gradient(160deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 100%)',
        }} />
      </div>

      {/* ══ Mobile layout ═══════════════════════════════════ */}
      <div className="flex flex-col lg:hidden" style={{
        minHeight: '100svh', background: 'var(--bg, #FAFAF9)',
      }}>
        {/* Mobile hero strip */}
        <div style={{ position: 'relative', height: 210, flexShrink: 0 }}>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={A} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
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
