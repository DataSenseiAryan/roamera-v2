import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Users, Plane, Receipt, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';
import SearchOverlay from './SearchOverlay';

const BASE_TABS = [
  { id: 'compass',    label: 'Compass',   path: '/',           icon: Compass },
  { id: 'meetways',   label: 'Meetways',  path: '/meetways',   icon: Users   },
  { id: 'travellens', label: 'Flights',   path: '/travellens', icon: Plane   },
  { id: 'justsplit',  label: 'JustSplit', path: '/justsplit',  icon: Receipt },
];

const SEARCH_TAB = { id: 'search', label: 'Search', path: null, icon: Search };
const MILES_TAB  = { id: 'miles',  label: 'Miles',  path: null, icon: User   };

export default function BottomNav() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (
    ['/login', '/register', '/welcome', '/meetways/create', '/create'].includes(location.pathname) ||
    location.pathname.endsWith('/edit')
  ) return null;

  const tabs = isMobile
    ? [...BASE_TABS, SEARCH_TAB]
    : [...BASE_TABS, MILES_TAB];

  function isActive(tab) {
    if (tab.id === 'search') return searchOpen;
    if (tab.id === 'miles')  return location.pathname.startsWith('/users/');
    if (tab.path === '/')    return location.pathname === '/';
    return location.pathname.startsWith(tab.path);
  }

  function handleClick(tab) {
    if (tab.id === 'search') { setSearchOpen(true); return; }
    if (tab.id === 'miles')  { navigate(user ? `/users/${user.id}` : '/login'); return; }
    navigate(tab.path);
  }

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <nav
        className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-[100]"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid var(--border)',
          borderRadius: 9999,
          padding: '5px 4px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.08) inset',
          width: 'min(340px, calc(100vw - 1.5rem))',
        }}
      >
        <div className="flex items-center">
          {tabs.map((tab) => {
            const active = isActive(tab);
            const Icon   = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleClick(tab)}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-full transition-colors duration-200"
                style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavBubble"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{
                      background: 'var(--primary-dim)',
                      border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.55 }}
                  />
                )}
                <Icon
                  style={{
                    width: 19, height: 19,
                    strokeWidth: active ? 2.5 : 1.8,
                    transform: active ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s',
                  }}
                />
                <span
                  className="uppercase"
                  style={{
                    fontSize: '0.5rem',
                    letterSpacing: '0.06em',
                    fontWeight: active ? 800 : 600,
                    opacity: active ? 1 : 0.65,
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
