import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bell, Search, LogOut } from 'lucide-react';
import api from '../lib/api';

const NOTIF_LABELS = {
  follow:             (actor) => `${actor} started following you`,
  comment:            (actor) => `${actor} commented on your journal`,
  reaction_love:      (actor) => `${actor} loved your journal ❤️`,
  reaction_epic:      (actor) => `${actor} found your journal epic 🔥`,
  reaction_wanna_go:  (actor) => `${actor} wants to go there 📍`,
  justsplit_added:    (actor) => `${actor} added you to a JustSplit group 🤝`,
  justsplit_request:  (actor) => `${actor} requested to join your JustSplit group`,
  justsplit_approved: (actor) => `${actor} approved your request to join the group ✅`,
  justsplit_declined: (actor) => `${actor} declined your join request`,
};

function NotifDropdown({ notifs, onClose, onMarkRead }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
      width: 'min(340px, calc(100vw - 1rem))',
      background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 16,
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)', zIndex: 200, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
        {notifs.some((n) => !n.read) && (
          <button onClick={onMarkRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
            Mark all read
          </button>
        )}
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {notifs.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No notifications yet
          </div>
        )}
        {notifs.map((n) => {
          const label = NOTIF_LABELS[n.type]?.(n.actor.username) ?? `${n.actor.username} interacted with your post`;
          const href = n.justsplitGroup
            ? `/justsplit/${n.justsplitGroup.id}`
            : n.journal
              ? `/journals/${n.journal.id}`
              : `/users/${n.actor.id}`;
          return (
            <Link key={n.id} to={href} onClick={onClose}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
                borderBottom: '1px solid var(--border)', textDecoration: 'none',
                background: n.read ? 'transparent' : 'var(--shadow-glow)',
                transition: 'background 0.15s',
              }}>
              {n.actor.avatar ? (
                <img src={n.actor.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>
                  {n.actor.username[0].toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.8rem', lineHeight: 1.4, fontWeight: n.read ? 400 : 500 }}>{label}</p>
                {n.journal && (
                  <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📔 {n.journal.title}
                  </p>
                )}
                {n.justsplitGroup && (
                  <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    🤝 {n.justsplitGroup.name}
                  </p>
                )}
                <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!n.read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const bellRef = useRef(null);

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  // Poll unread count every 30s
  useEffect(() => {
    if (!user) return;
    function fetchCount() {
      api.get('/notifications/unread-count').then((res) => setUnread(res.data.count)).catch(() => {});
    }
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, [user]);

  async function openNotifs() {
    if (showNotifs) { setShowNotifs(false); return; }
    const res = await api.get('/notifications');
    setNotifs(res.data);
    setShowNotifs(true);
  }

  async function markAllRead() {
    await api.put('/notifications/read');
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  // Close on outside click
  useEffect(() => {
    if (!showNotifs) return;
    function handler(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifs(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  return (
    <nav className="glass sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link to="/" className="text-xl font-black tracking-[-0.04em] shrink-0 select-none" style={{ color: 'var(--primary)' }}>
          Roamera <span className="opacity-50 font-normal">✧</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-sm nav-search ml-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search destinations, users..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-2xl transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-4 ml-auto shrink-0">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-[var(--surface-hover)] transition-colors" style={{ color: 'var(--text)' }}>
            {theme === 'night' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {user ? (
            <>
              <Link to="/create" className="btn-glow text-sm px-4 py-2 rounded-xl font-semibold hide-mobile">
                + Draft Journal
              </Link>

              {/* Bell */}
              <div ref={bellRef} style={{ position: 'relative' }} className="flex items-center justify-center">
                <button onClick={openNotifs} className="p-2 rounded-full hover:bg-[var(--surface-hover)] transition-colors relative" style={{ color: 'var(--text)' }}>
                  <Bell size={20} />
                  {unread > 0 && (
                    <span style={{
                      position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16,
                      background: 'var(--accent)', borderRadius: 999, fontSize: '0.65rem',
                      fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', padding: '0 3px', lineHeight: 1,
                    }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <NotifDropdown
                    notifs={notifs}
                    onClose={() => setShowNotifs(false)}
                    onMarkRead={markAllRead}
                  />
                )}
              </div>

              <Link to={`/users/${user.id}`}>
                 {user.avatar ? (
                    <img src={user.avatar} className="w-8 h-8 rounded-full border border-[var(--border)]" alt="Avatar"/>
                 ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-sm font-bold" style={{ color: 'var(--primary)' }}>
                      {user.username[0].toUpperCase()}
                    </div>
                 )}
              </Link>
              <button onClick={handleLogout} className="hide-mobile p-2 rounded-full hover:bg-[var(--surface-hover)] transition-colors" style={{ color: 'var(--text-muted)' }}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Sign In</Link>
              <Link to="/register" className="btn-glow text-sm px-4 py-2 rounded-xl font-semibold">
                Start Exploring
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

