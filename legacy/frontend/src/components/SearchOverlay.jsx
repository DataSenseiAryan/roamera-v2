import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, X } from 'lucide-react';
import api from '../lib/api';

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  function go(path) {
    onClose();
    navigate(path);
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, borderRadius: '50%',
            color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </button>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search style={{
            position: 'absolute', left: 12,
            width: 15, height: 15,
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations, users…"
            style={{
              width: '100%', height: 42,
              paddingLeft: 38, paddingRight: query ? 36 : 14,
              borderRadius: 12,
              border: '1.5px solid var(--border)',
              background: 'var(--surface-hover)',
              color: 'var(--text)',
              fontSize: '0.95rem', outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 4, display: 'flex',
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!query && (
          <p style={{
            textAlign: 'center', padding: '64px 16px',
            color: 'var(--text-muted)', fontSize: '0.875rem',
          }}>
            Search for destinations, journals, or people
          </p>
        )}

        {loading && (
          <p style={{
            textAlign: 'center', padding: '40px 16px',
            color: 'var(--text-muted)', fontSize: '0.875rem',
          }}>
            Searching…
          </p>
        )}

        {!loading && results && results.users?.length === 0 && results.journals?.length === 0 && (
          <p style={{
            textAlign: 'center', padding: '40px 16px',
            color: 'var(--text-muted)', fontSize: '0.875rem',
          }}>
            No results for "{query}"
          </p>
        )}

        {!loading && results?.users?.length > 0 && (
          <div>
            <p style={{
              padding: '12px 20px 6px',
              fontSize: '0.62rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.09em',
              color: 'var(--text-muted)',
            }}>
              People
            </p>
            {results.users.map((u) => (
              <button
                key={u.id}
                onClick={() => go(`/users/${u.id}`)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {u.avatar ? (
                  <img
                    src={u.avatar}
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    alt=""
                  />
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--primary-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)',
                  }}>
                    {u.username[0].toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                    {u.username}
                  </p>
                  {u.bio && (
                    <p style={{
                      margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {u.bio}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && results?.journals?.length > 0 && (
          <div>
            <p style={{
              padding: '12px 20px 6px',
              fontSize: '0.62rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.09em',
              color: 'var(--text-muted)',
            }}>
              Journals
            </p>
            {results.journals.map((j) => (
              <button
                key={j.id}
                onClick={() => go(`/journals/${j.id}`)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {j.photos?.[0] ? (
                  <img
                    src={j.photos[0]}
                    style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                    alt=""
                  />
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                    background: 'var(--surface-hover)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem',
                  }}>
                    🗺️
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {j.title}
                  </p>
                  {j.destination && (
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                      📍 {j.destination}
                    </p>
                  )}
                  {j.user?.username && (
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      by {j.user.username}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
