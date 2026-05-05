import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const A = '#F59E0B';
const D = 'var(--text)';
const M = 'var(--text-muted)';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const { login } = useAuth();
  const token     = params.get('token');
  const email     = params.get('email');

  const [status,    setStatus]    = useState(token ? 'verifying' : 'pending');
  const [error,     setError]     = useState('');
  const [resending, setResending] = useState(false);
  const [resent,    setResent]    = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get(`/auth/verify-email?token=${token}`)
      .then(res => {
        login(res.data.user, res.data.token);
        setStatus('success');
        setTimeout(() => navigate('/'), 2000);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Verification failed');
        setStatus('error');
      });
  }, [token]);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setResent(true);
    } catch {
      setError('Could not resend. Try again.');
    } finally {
      setResending(false);
    }
  }

  const card = (content) => (
    <div style={{
      minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'var(--surface)', borderRadius: 24, padding: '40px 36px',
          maxWidth: 400, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid var(--border)',
        }}
      >
        {content}
      </motion.div>
    </div>
  );

  if (status === 'verifying') return card(
    <>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
      <p style={{ fontFamily: 'Inter, sans-serif', color: M }}>Verifying your email…</p>
    </>
  );

  if (status === 'success') return card(
    <>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, color: D, marginBottom: 8 }}>
        Email verified!
      </h2>
      <p style={{ fontFamily: 'Inter, sans-serif', color: M }}>Redirecting you to the app…</p>
    </>
  );

  if (status === 'error') return card(
    <>
      <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
      <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, color: D, marginBottom: 8 }}>
        Link expired
      </h2>
      <p style={{ fontFamily: 'Inter, sans-serif', color: M, marginBottom: 24 }}>{error}</p>
      {email && !resent && (
        <button
          onClick={handleResend}
          disabled={resending}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 9999, border: 'none',
            background: A, color: '#fff', fontWeight: 700, fontSize: 15,
            cursor: resending ? 'default' : 'pointer', opacity: resending ? 0.7 : 1,
          }}
        >
          {resending ? 'Sending…' : 'Resend verification email'}
        </button>
      )}
      {resent && <p style={{ color: '#22c55e', fontFamily: 'Inter, sans-serif' }}>New link sent! Check your inbox.</p>}
      <Link to="/login" style={{ display: 'block', marginTop: 16, color: M, fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
        Back to login
      </Link>
    </>
  );

  // status === 'pending' — no token, came here from register redirect
  return card(
    <>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
      <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, color: D, marginBottom: 8 }}>
        Check your inbox
      </h2>
      <p style={{ fontFamily: 'Inter, sans-serif', color: M, lineHeight: 1.6, marginBottom: 24 }}>
        We sent a verification link to <strong style={{ color: D }}>{email || 'your email'}</strong>.
        Click it to activate your account.
      </p>
      {!resent ? (
        <button
          onClick={handleResend}
          disabled={!email || resending}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 9999, border: '1px solid var(--border)',
            background: 'var(--surface-hover)', color: D, fontWeight: 600, fontSize: 14,
            cursor: (!email || resending) ? 'default' : 'pointer', opacity: resending ? 0.6 : 1,
          }}
        >
          {resending ? 'Sending…' : 'Resend email'}
        </button>
      ) : (
        <p style={{ color: '#22c55e', fontFamily: 'Inter, sans-serif' }}>Sent! Check your inbox.</p>
      )}
      <Link to="/login" style={{ display: 'block', marginTop: 16, color: M, fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
        Back to login
      </Link>
    </>
  );
}
