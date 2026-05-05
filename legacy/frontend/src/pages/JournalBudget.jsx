import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../lib/api';

const CATEGORIES = [
  { id: 'accommodation', label: 'Accommodation', icon: '🏨', color: '#0ea5e9' },
  { id: 'food',          label: 'Food & Dining', icon: '🍜', color: '#f59e0b' },
  { id: 'transport',     label: 'Transport',     icon: '✈️', color: '#8b5cf6' },
  { id: 'activities',   label: 'Activities',    icon: '🎭', color: '#10b981' },
  { id: 'shopping',     label: 'Shopping',      icon: '🛍️', color: '#f43f5e' },
  { id: 'other',        label: 'Other',         icon: '💼', color: '#64748b' },
];

export default function JournalBudget() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0], notes: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');

  const fetchBudget = () => api.get(`/journals/${id}/budget`).then(({ data }) => setData(data));

  useEffect(() => {
    Promise.all([
      fetchBudget(),
      api.get(`/journals/${id}`).then(({ data }) => setJournalTitle(data.title)),
    ]).finally(() => setLoading(false));
  }, [id]);

  const addExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/journals/${id}/budget`, form);
      setForm({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0], notes: '' });
      setShowForm(false);
      fetchBudget();
    } catch {}
    setSubmitting(false);
  };

  const deleteExpense = async (entryId) => {
    await api.delete(`/journals/${id}/budget/${entryId}`);
    fetchBudget();
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="animate-pulse h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
    </div>
  );

  const spent = data?.totalSpent || 0;
  const budget = data?.totalBudget;
  const remaining = budget ? budget - spent : null;
  const progress = budget ? Math.min((spent / budget) * 100, 100) : 0;

  const pieData = CATEGORIES
    .filter((c) => data?.byCategory?.[c.id])
    .map((c) => ({ name: c.label, value: data.byCategory[c.id], color: c.color }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={`/journals/${id}`} className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
            ← {journalTitle}
          </Link>
          <h1 className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>Budget Tracker</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-colors"
          style={{ background: 'var(--primary)' }}>
          <span>+</span> Add Expense
        </button>
      </div>

      {/* Add Expense modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-md rounded-[1.5rem] p-6 shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Add Expense</h3>
            <form onSubmit={addExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Description *</label>
                <input
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Hotel booking, dinner, taxi…" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Amount *</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    type="number" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00" min="0" step="0.01" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                  <select
                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Date</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    type="date" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Notes</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Optional note" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}>
                  {submitting ? 'Adding…' : 'Add Expense'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Total Spent</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>₹{spent.toLocaleString()}</p>
        </div>
        {budget && (
          <>
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Budget</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>₹{budget.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl p-4"
              style={remaining >= 0
                ? { background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }
                : { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                {remaining >= 0 ? 'Remaining' : 'Over Budget'}
              </p>
              <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                ₹{Math.abs(remaining).toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Progress bar */}
      {budget && (
        <div className="mb-6">
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-yellow-500' : ''}`}
              style={{ width: `${progress}%`, background: progress <= 70 ? 'var(--primary)' : undefined }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{progress.toFixed(1)}% of budget used</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pie chart */}
        {pieData.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>By Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  formatter={(v) => `₹${v.toLocaleString()}`}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    color: 'var(--text)',
                  }}
                />
                <Legend wrapperStyle={{ color: 'var(--text-muted)', fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category breakdown */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Breakdown</h3>
          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const amount = data?.byCategory?.[cat.id] || 0;
              const pct = spent > 0 ? (amount / spent) * 100 : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                      <span>{cat.icon}</span>{cat.label}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>₹{amount.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expense list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-bold" style={{ color: 'var(--text)' }}>Expenses ({data?.entries?.length || 0})</h3>
        </div>
        {data?.entries?.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <p className="text-3xl mb-2">💸</p>
            <p>No expenses yet. Add your first one!</p>
          </div>
        ) : (
          <div>
            {data?.entries?.map((e, idx) => {
              const cat = CATEGORIES.find((c) => c.id === e.category);
              return (
                <div key={e.id}>
                  {idx > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 1.25rem' }} />}
                  <div className="flex items-center gap-3 px-5 py-3 transition-colors"
                    onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}>
                    <span className="text-xl w-8 text-center">{cat?.icon || '💼'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{e.title}</p>
                      <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        <span>{new Date(e.date).toLocaleDateString()}</span>
                        {e.notes && <span>· {e.notes}</span>}
                        <span>· {e.user?.username}</span>
                      </p>
                    </div>
                    <p className="font-semibold shrink-0" style={{ color: 'var(--text)' }}>₹{e.amount.toLocaleString()}</p>
                    <button onClick={() => deleteExpense(e.id)}
                      className="ml-2 text-sm transition-colors hover:text-red-400"
                      style={{ color: 'var(--text-muted)' }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
