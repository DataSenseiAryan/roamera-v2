import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import JournalCard from '../components/JournalCard';
import { Search as SearchIcon, Users, Map, Telescope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState({ journals: [], users: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api.get(`/search?q=${encodeURIComponent(q)}`)
      .then((res) => setResults(res.data))
      .finally(() => setLoading(false));
  }, [q]);

  const total = results.journals.length + results.users.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto px-4 py-8 pb-24">
      <AnimatePresence mode="popLayout">
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-[var(--primary)] font-semibold mb-6 text-sm bg-[var(--primary-dim)] px-4 py-2.5 rounded-full inline-flex w-max mx-auto shadow-sm">
            <SearchIcon className="w-4 h-4 animate-spin" /> Searching the cosmos for "{q}"…
          </motion.div>
        ) : q ? (
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-sm font-semibold mb-8 text-center" style={{ color: 'var(--text-muted)' }}>
            Found <span className="px-2 py-0.5 rounded-md bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)]">{total}</span> result{total !== 1 ? 's' : ''} for <span className="text-[var(--primary)]">"{q}"</span>
          </motion.p>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-hover)] flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
                <SearchIcon className="w-8 h-8 text-[var(--primary)] opacity-50 relative z-10" />
                <div className="absolute inset-0 bg-[var(--primary-dim)] blur-2xl opacity-30 rounded-full animate-pulse" />
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>Start Your Search</p>
            <p className="text-sm max-w-sm mt-2" style={{ color: 'var(--text-muted)' }}>Type a destination, country, or a fellow explorer's username in the bar above.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout>
        {/* Users */}
        {results.users.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
              <Users className="w-4 h-4 text-[var(--primary)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider m-0" style={{ color: 'var(--text-muted)' }}>People</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.users.map((u, i) => (
                <motion.div key={u.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                  <Link
                    to={`/users/${u.id}`}
                    className="glass flex items-center gap-4 rounded-2xl px-5 py-4 hover:border-[var(--primary)] hover:bg-[var(--surface-hover)] transition-all group"
                  >
                    {u.avatar ? (
                      <img src={u.avatar} className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--border)] group-hover:ring-[var(--primary)] transition-all" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary-dim)] to-[var(--primary)] border border-[var(--border)] flex items-center justify-center text-base font-bold text-white shadow-md group-hover:scale-105 transition-transform">
                        {u.username[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate m-0" style={{ color: 'var(--text)' }}>{u.username}</p>
                      {u.bio && <p className="text-xs truncate m-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>{u.bio}</p>}
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end pl-2">
                      <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--surface-hover)]" style={{ color: 'var(--text-muted)' }}>
                        {u._count.followers} Followers
                      </span>
                      <span className="text-[0.65rem] font-medium mt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                        {u._count.journals} entries
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Journals */}
        {results.journals.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-2">
              <Map className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider m-0" style={{ color: 'var(--text-muted)' }}>Places & Itineraries</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.journals.map((j, i) => (
                <motion.div key={j.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 + 0.1 }}>
                   <JournalCard journal={j} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {!loading && q && total === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-[var(--surface)] border border-[var(--border)] rounded-3xl xl:mx-10 mt-10 shadow-sm relative overflow-hidden group hover:border-[var(--primary)] transition-colors">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary-dim)] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
            <div className="w-16 h-16 mx-auto bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-inner">
                 <Telescope className="w-8 h-8 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
            </div>
            <p className="font-bold text-lg mb-1 relative z-10" style={{ color: 'var(--text)' }}>No results found for "{q}"</p>
            <p className="text-sm cursor-text relative z-10" style={{ color: 'var(--text-muted)' }}>We scoured the entire globe, but couldn't find a match.</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
