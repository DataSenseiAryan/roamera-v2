import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';

const CATEGORIES = [
  { id: 'food',          label: 'Food',        icon: '🍜' },
  { id: 'transport',     label: 'Transport',   icon: '🚗' },
  { id: 'accommodation', label: 'Stay',        icon: '🏨' },
  { id: 'activities',    label: 'Activities',  icon: '🎭' },
  { id: 'shopping',      label: 'Shopping',    icon: '🛍️' },
  { id: 'general',       label: 'General',     icon: '💼' },
];

const TAB = { BALANCES: 'balances', EXPENSES: 'expenses', MEMBERS: 'members', REQUESTS: 'requests' };

export default function JustSplitDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TAB.BALANCES);

  const [showExpense, setShowExpense] = useState(false);
  const [expForm, setExpForm] = useState({ title: '', amount: '', category: 'general', date: new Date().toISOString().split('T')[0], notes: '', paidByMemberId: '', splitAmong: [] });
  const [addingExp, setAddingExp] = useState(false);

  const [showMember, setShowMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ username: '', name: '' });
  const [addingMember, setAddingMember] = useState(false);

  const [showSettle, setShowSettle] = useState(null);
  const [settling, setSettling] = useState(false);

  const [requesting, setRequesting] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [dialog, setDialog] = useState(null);

  const fetchGroup = () =>
    api.get(`/justsplit/${id}`).then(({ data }) => {
      setGroup(data);
      if (data.isMember && !expForm.paidByMemberId) {
        const me = data.members?.find((m) => m.userId === user?.id);
        if (me) setExpForm((f) => ({ ...f, paidByMemberId: String(me.id), splitAmong: data.members.map((m) => m.id) }));
      }
      if (!data.isMember && data.joinRequests?.length > 0) setRequestSent(true);
    });

  useEffect(() => {
    if (!user) return navigate('/login');
    fetchGroup().finally(() => setLoading(false));
  }, [id, user]);

  const addExpense = async (e) => {
    e.preventDefault();
    setAddingExp(true);
    try {
      await api.post(`/justsplit/${id}/expenses`, {
        ...expForm,
        amount: parseFloat(expForm.amount),
        paidByMemberId: parseInt(expForm.paidByMemberId),
        splitAmong: expForm.splitAmong,
      });
      setShowExpense(false);
      setExpForm((f) => ({ ...f, title: '', amount: '', notes: '' }));
      fetchGroup();
    } catch {}
    setAddingExp(false);
  };

  const deleteExpense = (expId) => {
    setDialog({
      title: 'Delete Expense',
      message: 'This expense will be removed and balances recalculated.',
      danger: true,
      onConfirm: async () => {
        await api.delete(`/justsplit/${id}/expenses/${expId}`);
        fetchGroup();
      },
    });
  };

  const addMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      await api.post(`/justsplit/${id}/members`, memberForm);
      setMemberForm({ username: '', name: '' });
      setShowMember(false);
      fetchGroup();
    } catch (err) {
      setDialog({
        title: 'Could not add member',
        message: err.response?.data?.error || 'Something went wrong. Please try again.',
        danger: false,
        hideCancel: true,
        confirmLabel: 'OK',
        icon: '⚠️',
      });
    }
    setAddingMember(false);
  };

  const settle = async (debt) => {
    setSettling(true);
    try {
      await api.post(`/justsplit/${id}/settle`, {
        fromMemberId: debt.from.id,
        toMemberId: debt.to.id,
        amount: debt.amount,
        note: 'Settled up',
      });
      setShowSettle(null);
      fetchGroup();
    } catch {}
    setSettling(false);
  };

  const sendJoinRequest = async () => {
    setRequesting(true);
    try {
      await api.post(`/justsplit/${id}/request`, { message: requestMsg });
      setRequestSent(true);
    } catch (err) {
      setDialog({
        title: 'Could not send request',
        message: err.response?.data?.error || 'Something went wrong. Please try again.',
        danger: false,
        hideCancel: true,
        confirmLabel: 'OK',
        icon: '⚠️',
      });
    }
    setRequesting(false);
  };

  const handleJoinRequest = async (requestId, action) => {
    await api.put(`/justsplit/${id}/requests/${requestId}`, { action });
    fetchGroup();
  };

  const deleteGroup = () => {
    setDialog({
      title: 'Delete Group',
      message: 'This will permanently delete the group, all expenses, and member data.',
      danger: true,
      onConfirm: async () => {
        await api.delete(`/justsplit/${id}`);
        navigate('/justsplit');
      },
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  );
  if (!group) return <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>Group not found</div>;

  // ── Non-member view ──────────────────────────────────────────────────────────
  if (!group.isMember) {
    const existingRequest = group.joinRequests?.[0];
    return (
      <>
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4"
          style={{ background: `rgba(var(--primary-rgb),0.12)`, color: 'var(--primary)' }}>
          {group.name[0].toUpperCase()}
        </div>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>{group.name}</h1>
        {group.description && <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{group.description}</p>}
        <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
          {group._count?.members} members · {group._count?.expenses} expenses · {group.currency}
        </p>

        {existingRequest ? (
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {existingRequest.status === 'pending' && (
              <>
                <p className="text-2xl mb-2">⏳</p>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>Request sent</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Waiting for the group owner to approve.</p>
              </>
            )}
            {existingRequest.status === 'approved' && (
              <p className="font-semibold text-green-500">✅ Request approved — refreshing…</p>
            )}
            {existingRequest.status === 'declined' && (
              <p className="font-semibold text-red-500">❌ Your request was declined.</p>
            )}
          </div>
        ) : requestSent ? (
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-2xl mb-2">⏳</p>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>Request sent!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Waiting for the group owner to approve.</p>
          </div>
        ) : (
          <div className="rounded-2xl p-5 text-left" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Request to Join</p>
            <textarea
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
              rows={2} placeholder="Add a message (optional)…"
              value={requestMsg} onChange={(e) => setRequestMsg(e.target.value)}
            />
            <button onClick={sendJoinRequest} disabled={requesting}
              className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
              style={{ background: 'var(--primary)' }}>
              {requesting ? 'Sending…' : 'Send Join Request'}
            </button>
          </div>
        )}
        <button onClick={() => navigate('/justsplit')}
          className="mt-6 text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          ← Back to my groups
        </button>
      </div>
      <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
      </>
    );
  }

  // ── Member view ───────────────────────────────────────────────────────────────
  const isOwner = group.createdById === user?.id;
  const sym = group.currency;
  const pendingRequests = group.joinRequests?.length || 0;

  const toggleSplitMember = (memberId) => {
    setExpForm((f) => ({
      ...f,
      splitAmong: f.splitAmong.includes(memberId)
        ? f.splitAmong.filter((mid) => mid !== memberId)
        : [...f.splitAmong, memberId],
    }));
  };

  const tabs = isOwner
    ? [TAB.BALANCES, TAB.EXPENSES, TAB.MEMBERS, TAB.REQUESTS]
    : [TAB.BALANCES, TAB.EXPENSES, TAB.MEMBERS];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header nav */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => navigate('/justsplit')}
          className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>← Back</button>
        {isOwner && (
          <button onClick={deleteGroup} className="text-xs text-red-400 hover:text-red-300 transition-colors">Delete Group</button>
        )}
      </div>

      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{group.name}</h1>
        {group.description && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{group.description}</p>}
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{group.members.length} members · {group.currency}</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setShowExpense(true)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'var(--primary)' }}>
          + Add Expense
        </button>
        <button onClick={() => setShowMember(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          + Member
        </button>
      </div>

      {/* Add Expense modal */}
      {showExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowExpense(false); }}>
          <div className="w-full max-w-md rounded-[1.5rem] p-6 shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Add Expense</h3>
            <form onSubmit={addExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Description *</label>
                <input className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                  placeholder="Dinner at Taj, Cab to airport…" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Amount *</label>
                  <input className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    type="number" min="0" step="0.01"
                    value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                    placeholder="0.00" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                  <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Paid by *</label>
                  <select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    value={expForm.paidByMemberId} onChange={(e) => setExpForm({ ...expForm, paidByMemberId: e.target.value })} required>
                    <option value="">Select…</option>
                    {group.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Date</label>
                  <input className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Split among</label>
                <div className="flex flex-wrap gap-2">
                  {group.members.map((m) => (
                    <button key={m.id} type="button" onClick={() => toggleSplitMember(m.id)}
                      className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                      style={expForm.splitAmong.includes(m.id)
                        ? { background: 'var(--primary-dim)', border: '1px solid var(--primary)', color: 'var(--primary)' }
                        : { background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={addingExp}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}>
                  {addingExp ? 'Adding…' : 'Add Expense'}
                </button>
                <button type="button" onClick={() => setShowExpense(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member modal */}
      {showMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowMember(false); }}>
          <div className="w-full max-w-md rounded-[1.5rem] p-6 shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Add Member</h3>
            <form onSubmit={addMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>App Username</label>
                <input className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  value={memberForm.username} onChange={(e) => setMemberForm({ ...memberForm, username: e.target.value })}
                  placeholder="Search by username" />
              </div>
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>— or add someone without an account —</p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Name</label>
                <input className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="Priya, Rahul…" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={addingMember}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}>
                  {addingMember ? 'Adding…' : 'Add Member'}
                </button>
                <button type="button" onClick={() => setShowMember(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle confirm modal */}
      {showSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettle(null); }}>
          <div className="w-full max-w-sm rounded-[1.5rem] p-6 shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>Confirm Settlement</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Record that <span style={{ color: 'var(--text)' }} className="font-medium">{showSettle.from.name}</span> paid{' '}
              <span style={{ color: 'var(--text)' }} className="font-medium">{sym} {showSettle.amount.toFixed(2)}</span> to{' '}
              <span style={{ color: 'var(--text)' }} className="font-medium">{showSettle.to.name}</span>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => settle(showSettle)} disabled={settling}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: '#10b981' }}>
                {settling ? 'Recording…' : 'Yes, Settled'}
              </button>
              <button onClick={() => setShowSettle(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all relative"
            style={tab === t
              ? { background: 'var(--primary)', color: '#fff' }
              : { color: 'var(--text-muted)' }}>
            {t}
            {t === TAB.REQUESTS && pendingRequests > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                style={{ background: '#ef4444', fontSize: '0.6rem', fontWeight: 700 }}>
                {pendingRequests}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── BALANCES TAB ── */}
      {tab === TAB.BALANCES && (
        <div className="space-y-3">
          {group.debts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>All settled up!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>No outstanding balances in this group.</p>
            </div>
          ) : (
            group.debts.map((debt, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold text-red-400">{debt.from.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}> owes </span>
                    <span className="font-semibold text-green-500">{debt.to.name}</span>
                  </p>
                  <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--text)' }}>{sym} {debt.amount.toFixed(2)}</p>
                </div>
                {(debt.from.userId === user?.id || debt.to.userId === user?.id) && (
                  <button onClick={() => setShowSettle(debt)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
                    Settle
                  </button>
                )}
              </div>
            ))
          )}

          {group.members.length > 0 && (
            <div className="mt-4 rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Net Balances</p>
              <div className="space-y-2">
                {group.members.map((m) => {
                  const net = group.net[m.id] || 0;
                  return (
                    <div key={m.id} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{m.name}</span>
                      <span className={`text-sm font-semibold ${net > 0 ? 'text-green-500' : net < 0 ? 'text-red-400' : ''}`}
                        style={net === 0 ? { color: 'var(--text-muted)' } : {}}>
                        {net > 0 ? '+' : ''}{sym} {net.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EXPENSES TAB ── */}
      {tab === TAB.EXPENSES && (
        <div>
          {group.expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">💸</p>
              <p style={{ color: 'var(--text-muted)' }}>No expenses yet. Add the first one!</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {group.expenses.map((exp, idx) => {
                const cat = CATEGORIES.find((c) => c.id === exp.category);
                return (
                  <div key={exp.id}>
                    {idx > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 1rem' }} />}
                    <div className="flex items-center gap-3 px-4 py-3 transition-colors"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <span className="text-xl w-8 text-center shrink-0">{cat?.icon || '💼'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{exp.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Paid by <span style={{ color: 'var(--text)' }}>{exp.paidBy.name}</span> · {new Date(exp.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>Split: {exp.splits.map((s) => s.member.name).join(', ')}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{sym} {exp.amount.toFixed(2)}</p>
                        <button onClick={() => deleteExpense(exp.id)}
                          className="text-xs mt-1 transition-colors hover:text-red-400"
                          style={{ color: 'var(--text-muted)' }}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MEMBERS TAB ── */}
      {tab === TAB.MEMBERS && (
        <div className="space-y-2">
          {group.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{ background: `rgba(var(--primary-rgb),0.12)`, color: 'var(--primary)' }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{m.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.userId ? 'App user' : 'Guest'}</p>
                </div>
              </div>
              {isOwner && m.userId !== user?.id && (
                <button onClick={() => setDialog({ title: 'Remove Member', message: `Remove ${m.name} from this group?`, danger: true, onConfirm: async () => { await api.delete(`/justsplit/${id}/members/${m.id}`); fetchGroup(); } })}
                  className="text-xs transition-colors hover:text-red-400"
                  style={{ color: 'var(--text-muted)' }}>Remove</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── REQUESTS TAB (owner only) ── */}
      {tab === TAB.REQUESTS && isOwner && (
        <div className="space-y-3">
          {group.joinRequests?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📭</p>
              <p style={{ color: 'var(--text-muted)' }}>No pending join requests.</p>
            </div>
          ) : (
            group.joinRequests?.map((req) => (
              <div key={req.id} className="p-4 rounded-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: `rgba(var(--primary-rgb),0.12)`, color: 'var(--primary)' }}>
                      {req.user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{req.user.username}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleJoinRequest(req.id, 'approve')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
                      Approve
                    </button>
                    <button onClick={() => handleJoinRequest(req.id, 'decline')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                      Decline
                    </button>
                  </div>
                </div>
                {req.message && (
                  <p className="text-xs ml-12 italic" style={{ color: 'var(--text-muted)' }}>"{req.message}"</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
      <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
