import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD'];

export default function JustSplit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', currency: 'INR' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return navigate('/login');
    api.get('/justsplit').then(({ data }) => setGroups(data)).finally(() => setLoading(false));
  }, [user]);

  const createGroup = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/justsplit', form);
      navigate(`/justsplit/${data.id}`);
    } catch {}
    setCreating(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>JustSplit</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Split expenses with friends, zero drama</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'var(--primary)' }}
        >
          + New Group
        </button>
      </div>

      {/* Create group modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div className="w-full max-w-md rounded-[1.5rem] p-6 shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Create a new group</h2>
            <form onSubmit={createGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Group Name *</label>
                <input
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Goa Trip, Flat Expenses…" required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
                <input
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Currency</label>
                <select
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={creating}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}>
                  {creating ? 'Creating…' : 'Create Group'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🤝</p>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>No groups yet</h2>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Create a group and start splitting expenses with your travel crew.</p>
          <button onClick={() => setShowCreate(true)}
            className="px-8 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}>
            Create First Group
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => navigate(`/justsplit/${g.id}`)}
              className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{ background: `rgba(var(--primary-rgb),0.12)`, color: 'var(--primary)' }}>
                    {g.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{g.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {g.members?.length || 0} members · {g._count?.expenses || 0} expenses · {g.currency}
                    </p>
                  </div>
                </div>
                <span className="text-lg" style={{ color: 'var(--text-muted)' }}>›</span>
              </div>
              {g.description && (
                <p className="text-xs mt-2 ml-13" style={{ color: 'var(--text-muted)' }}>{g.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
