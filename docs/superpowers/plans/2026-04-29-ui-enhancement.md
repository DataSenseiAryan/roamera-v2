# UI Enhancement — JustSplit, Budget Tracker, Packing List, TravelLens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle four feature pages to use the app's unified CSS variable token system, making them fully theme-aware (day/light + night/dark), responsive on all screen sizes, and replace all inline expanding forms with centered modal overlays — without changing any logic, API calls, or functionality.

**Architecture:** Inline refactor only — no new shared components. Each file is reworked in place by substituting hardcoded dark colors (`text-white`, `rgba(255,255,255,0.04)`, `bg-slate-800`, etc.) with CSS variable equivalents (`var(--text)`, `var(--surface)`, `var(--border)`) and wrapping form UIs in a `fixed inset-0` modal overlay. TravelLens already uses the token system and only needs two minor fixes.

**Tech Stack:** React 19, Tailwind CSS v4, CSS custom properties (`index.css` defines `--bg`, `--text`, `--text-muted`, `--surface`, `--surface-hover`, `--border`, `--primary`, `--primary-dim`, `--primary-rgb`, `--accent`, `--glass-bg`), Vite dev server on port 5200.

---

## CSS Token Reference (memorise before starting)

```
var(--bg)            page background
var(--text)          primary text
var(--text-muted)    secondary / label text
var(--surface)       card / panel background
var(--surface-hover) hover bg, input bg, inactive pill bg
var(--border)        border color
var(--primary)       accent color (blue in both themes)
var(--primary-dim)   dimmed primary (active pill bg, badge bg)
var(--primary-rgb)   rgb triplet for rgba() — e.g. rgba(var(--primary-rgb),0.12)
var(--accent)        green accent
var(--glass-bg)      glass card background
```

**Common class pattern:**
```jsx
// card
<div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

// glass card
<div className="glass rounded-2xl p-4">   // .glass is defined in index.css

// label
<label style={{ color: 'var(--text-muted)' }} className="text-xs font-bold uppercase tracking-wide">

// form input
<input className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }} />

// select
<select className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />

// primary button
<button style={{ background: 'var(--primary)' }} className="px-4 py-2 rounded-xl text-sm font-bold text-white">

// ghost button
<button className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
```

**Modal wrapper pattern (used in every feature):**
```jsx
{showModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
  >
    <div className="w-full max-w-md rounded-[1.5rem] p-6 shadow-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Modal Title</h3>
      {/* form fields */}
      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'var(--primary)' }}>Submit</button>
        <button type="button" onClick={() => setShowModal(false)}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
```

---

## How to verify after each task

1. Frontend must be running: `cd frontend && npm run dev` → http://localhost:5200
2. Open the relevant page in the browser
3. Toggle theme: click the theme button in the navbar (switches `data-theme` between `day` and `night`)
4. In **Day (light) mode**: text must be dark, backgrounds must be light/white — no white-on-white, no invisible text
5. In **Night (dark) mode**: existing look is baseline — check nothing regressed
6. Resize browser to 375px width (mobile) — no horizontal overflow, no broken layouts
7. Open a modal — it must appear centered with a dark backdrop, close on backdrop click

---

## Task 1: JustSplit.jsx — groups list page

**Files:**
- Modify: `frontend/src/pages/JustSplit.jsx`

- [ ] **Step 1: Replace the entire file with the themed version**

```jsx
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
  const [form, setForm] = useState({ name: '', description: '', currency: 'USD' });
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
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:5200/justsplit

**Day mode checks:**
- Page background is light (not dark)
- "JustSplit" heading is dark text
- Group cards have white/light background with subtle border
- "New Group" button is blue
- Click "+ New Group" → centered modal appears with dark backdrop, form fields have light background
- Click backdrop → modal closes

**Night mode checks:**
- Heading is light text on dark background
- Cards are dark surface
- Modal backdrop + card look correct

**Mobile (375px):**
- No horizontal scroll
- Modal fills most of the screen width with padding on sides

---

## Task 2: JustSplitDetail.jsx — group detail page

**Files:**
- Modify: `frontend/src/pages/JustSplitDetail.jsx`

- [ ] **Step 1: Replace the entire file with the themed version**

```jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

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

  const deleteExpense = async (expId) => {
    if (!confirm('Delete this expense?')) return;
    await api.delete(`/justsplit/${id}/expenses/${expId}`);
    fetchGroup();
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
      alert(err.response?.data?.error || 'Error adding member');
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
      alert(err.response?.data?.error || 'Error sending request');
    }
    setRequesting(false);
  };

  const handleJoinRequest = async (requestId, action) => {
    await api.put(`/justsplit/${id}/requests/${requestId}`, { action });
    fetchGroup();
  };

  const deleteGroup = async () => {
    if (!confirm('Delete this group and all its data?')) return;
    await api.delete(`/justsplit/${id}`);
    navigate('/justsplit');
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
                <button onClick={async () => { await api.delete(`/justsplit/${id}/members/${m.id}`); fetchGroup(); }}
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
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:5200/justsplit (log in first if needed)

**Day mode checks:**
- All text is dark on light background — no white-on-white
- Group detail page: header, tabs, balance rows all use theme colors
- Click "+ Add Expense" → centered modal opens, all fields visible and readable
- Click "+ Member" → centered modal opens
- Tabs switch cleanly with primary color active state
- Expense rows have hover effect

**Night mode checks:**
- Everything matches original dark look
- Modals have correct dark surface background

**Mobile (375px):**
- 4-tab bar: all tabs fit, text is readable (xs size)
- Modals fill width with side padding
- 2-col form grids in modal stack gracefully (they stay 2-col but are narrow — acceptable at 375px; if they look cramped, they can be `grid-cols-1 sm:grid-cols-2` but the current 2-col at 375px is fine)

---

## Task 3: JournalBudget.jsx — budget tracker

**Files:**
- Modify: `frontend/src/pages/JournalBudget.jsx`

- [ ] **Step 1: Replace the entire file with the themed version**

```jsx
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
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>${spent.toLocaleString()}</p>
        </div>
        {budget && (
          <>
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Budget</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>${budget.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl p-4"
              style={remaining >= 0
                ? { background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }
                : { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                {remaining >= 0 ? 'Remaining' : 'Over Budget'}
              </p>
              <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                ${Math.abs(remaining).toLocaleString()}
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
                  formatter={(v) => `$${v.toLocaleString()}`}
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
                    <span style={{ color: 'var(--text-muted)' }}>${amount.toLocaleString()}</span>
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
                    <p className="font-semibold shrink-0" style={{ color: 'var(--text)' }}>${e.amount.toLocaleString()}</p>
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
```

- [ ] **Step 2: Verify in browser**

Navigate to any journal then append `/budget` to the URL (e.g. http://localhost:5200/journals/1/budget)

**Day mode checks:**
- Stat cards are white with dark text — readable
- Progress bar track is light grey, fill is blue
- Pie chart tooltip has white/light background with dark text
- Category breakdown labels are dark
- Expense list rows have light background, dark text
- Click "Add Expense" → centered modal, all fields readable

**Night mode checks:**
- Stat cards are dark surface
- Remaining card green tint is subtle, not garish
- Pie chart tooltip is dark with light text

**Mobile (375px):**
- Stat cards stack to 1 column
- Pie chart + breakdown stack to 1 column
- Modal is full width with side padding

---

## Task 4: JournalPacking.jsx — packing list

**Files:**
- Modify: `frontend/src/pages/JournalPacking.jsx`

- [ ] **Step 1: Replace the entire file with the themed version**

```jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

const CATEGORIES = [
  { id: 'clothing',    label: 'Clothing',    icon: '👕' },
  { id: 'toiletries',  label: 'Toiletries',  icon: '🪥' },
  { id: 'electronics', label: 'Electronics', icon: '🔌' },
  { id: 'documents',   label: 'Documents',   icon: '📄' },
  { id: 'health',      label: 'Health',      icon: '💊' },
  { id: 'general',     label: 'General',     icon: '📦' },
];

const TRIP_TYPES = ['general', 'beach', 'mountain', 'city'];

export default function JournalPacking() {
  const { id } = useParams();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [journalTitle, setJournalTitle] = useState('');
  const [showNewList, setShowNewList] = useState(false);
  const [newListForm, setNewListForm] = useState({ name: '', template: '' });
  const [addItemForList, setAddItemForList] = useState(null); // listId | null
  const [itemForm, setItemForm] = useState({ name: '', category: 'general', quantity: 1, essential: false });
  const [creatingList, setCreatingList] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchLists = () => api.get(`/journals/${id}/packing`).then(({ data }) => setLists(data));

  useEffect(() => {
    Promise.all([
      fetchLists(),
      api.get(`/journals/${id}`).then(({ data }) => setJournalTitle(data.title)),
    ]).finally(() => setLoading(false));
  }, [id]);

  const createList = async (e) => {
    e.preventDefault();
    setCreatingList(true);
    try {
      await api.post(`/journals/${id}/packing`, newListForm);
      setNewListForm({ name: '', template: '' });
      setShowNewList(false);
      fetchLists();
    } catch {}
    setCreatingList(false);
  };

  const toggleItem = async (listId, itemId) => {
    await api.patch(`/journals/${id}/packing/${listId}/items/${itemId}/toggle`);
    fetchLists();
  };

  const addItem = async (e) => {
    e.preventDefault();
    setAddingItem(true);
    try {
      await api.post(`/journals/${id}/packing/${addItemForList}/items`, itemForm);
      setItemForm({ name: '', category: 'general', quantity: 1, essential: false });
      setAddItemForList(null);
      fetchLists();
    } catch {}
    setAddingItem(false);
  };

  const deleteItem = async (listId, itemId) => {
    await api.delete(`/journals/${id}/packing/${listId}/items/${itemId}`);
    fetchLists();
  };

  const deleteList = async (listId) => {
    if (!confirm('Delete this packing list?')) return;
    await api.delete(`/journals/${id}/packing/${listId}`);
    fetchLists();
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="animate-pulse h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
    </div>
  );

  const totalItems = lists.reduce((s, l) => s + l.items.length, 0);
  const packedItems = lists.reduce((s, l) => s + l.items.filter((i) => i.packed).length, 0);
  const overallProgress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={`/journals/${id}`} className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
            ← {journalTitle}
          </Link>
          <h1 className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>Packing Lists</h1>
        </div>
        <button onClick={() => setShowNewList(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-colors"
          style={{ background: 'var(--primary)' }}>
          <span>+</span> New List
        </button>
      </div>

      {/* New List modal */}
      {showNewList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewList(false); }}>
          <div className="w-full max-w-md rounded-[1.5rem] p-6 shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Create Packing List</h3>
            <form onSubmit={createList} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>List Name</label>
                <input
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  value={newListForm.name}
                  onChange={(e) => setNewListForm({ ...newListForm, name: e.target.value })}
                  placeholder="Main Packing List" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Start from Template</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setNewListForm({ ...newListForm, template: '' })}
                    className="py-2.5 px-3 rounded-xl text-sm font-medium transition-colors"
                    style={!newListForm.template
                      ? { background: 'var(--primary-dim)', border: '1px solid var(--primary)', color: 'var(--primary)' }
                      : { background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    📦 Empty
                  </button>
                  {TRIP_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => setNewListForm({ ...newListForm, template: t })}
                      className="py-2.5 px-3 rounded-xl text-sm font-medium transition-colors capitalize"
                      style={newListForm.template === t
                        ? { background: 'var(--primary-dim)', border: '1px solid var(--primary)', color: 'var(--primary)' }
                        : { background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      {t === 'beach' ? '🏖️' : t === 'mountain' ? '🏔️' : t === 'city' ? '🏙️' : '📦'} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={creatingList}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}>
                  {creatingList ? 'Creating…' : 'Create List'}
                </button>
                <button type="button" onClick={() => setShowNewList(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item modal */}
      {addItemForList !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setAddItemForList(null); }}>
          <div className="w-full max-w-md rounded-[1.5rem] p-6 shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text)' }}>Add Item</h3>
            <form onSubmit={addItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Item Name *</label>
                <input
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="Sunscreen" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                  <select
                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Qty</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    type="number" value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) || 1 })}
                    min="1" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text)' }}>
                <input type="checkbox" checked={itemForm.essential}
                  onChange={(e) => setItemForm({ ...itemForm, essential: e.target.checked })} />
                Mark as essential
              </label>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={addingItem}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}>
                  {addingItem ? 'Adding…' : 'Add Item'}
                </button>
                <button type="button" onClick={() => setAddItemForList(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overall progress */}
      {totalItems > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Overall Progress</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{packedItems} / {totalItems} items</p>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%`, background: overallProgress === 100 ? '#10b981' : 'var(--primary)' }}
            />
          </div>
          {overallProgress === 100 && (
            <p className="text-green-500 text-sm mt-2">🎉 All packed! You're ready to go!</p>
          )}
        </div>
      )}

      {/* Filter pills */}
      {totalItems > 0 && (
        <div className="flex gap-2 mb-4">
          {['all', 'unpacked', 'packed'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize"
              style={filter === f
                ? { background: 'var(--primary)', color: '#fff' }
                : { color: 'var(--text-muted)' }}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Lists */}
      {lists.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🎒</p>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>No packing lists yet</h2>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Create a packing list with a template for beach, mountain, or city trips.</p>
          <button onClick={() => setShowNewList(true)}
            className="px-8 py-3 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ background: 'var(--primary)' }}>
            Create First List
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => {
            const filtered = list.items.filter((item) =>
              filter === 'all' || (filter === 'packed' ? item.packed : !item.packed)
            );
            const byCategory = CATEGORIES
              .map((cat) => ({ ...cat, items: filtered.filter((i) => i.category === cat.id) }))
              .filter((cat) => cat.items.length > 0);
            const packed = list.items.filter((i) => i.packed).length;
            const progress = list.items.length > 0 ? Math.round((packed / list.items.length) * 100) : 0;

            return (
              <div key={list.id} className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {/* List header (comfortable) */}
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold" style={{ color: 'var(--text)' }}>{list.name}</h3>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{packed}/{list.items.length}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, background: progress === 100 ? '#10b981' : 'var(--primary)' }} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{progress}%</span>
                    <button onClick={() => { setAddItemForList(list.id); setItemForm({ name: '', category: 'general', quantity: 1, essential: false }); }}
                      className="text-xs font-medium transition-colors"
                      style={{ color: 'var(--primary)' }}>
                      + Item
                    </button>
                    <button onClick={() => deleteList(list.id)}
                      className="text-xs transition-colors hover:text-red-400"
                      style={{ color: 'var(--text-muted)' }}>
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Items by category (compact) */}
                <div>
                  {byCategory.map((cat) => (
                    <div key={cat.id}>
                      <div className="px-5 py-2" style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{cat.icon} {cat.label}</p>
                      </div>
                      {cat.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-5 py-2.5 transition-colors"
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <button
                            onClick={() => toggleItem(list.id, item.id)}
                            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0"
                            style={item.packed
                              ? { background: 'var(--primary)', borderColor: 'var(--primary)' }
                              : { borderColor: 'var(--border)' }}>
                            {item.packed && <span className="text-white text-xs">✓</span>}
                          </button>
                          <span className={`flex-1 text-sm transition-colors ${item.packed ? 'line-through' : ''}`}
                            style={{ color: item.packed ? 'var(--text-muted)' : 'var(--text)' }}>
                            {item.name}
                            {item.quantity > 1 && <span style={{ color: 'var(--text-muted)' }} className="ml-1">×{item.quantity}</span>}
                          </span>
                          {item.essential && (
                            <span className="text-xs rounded px-1.5 py-0.5"
                              style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
                              essential
                            </span>
                          )}
                          <button onClick={() => deleteItem(list.id, item.id)}
                            className="text-xs ml-1 transition-colors hover:text-red-400"
                            style={{ color: 'var(--text-muted)' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  ))}
                  {filtered.length === 0 && filter !== 'all' && (
                    <div className="px-5 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No {filter} items
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to a journal then append `/packing` (e.g. http://localhost:5200/journals/1/packing)

**Day mode checks:**
- All text is dark on light backgrounds
- Progress bars: track is light grey, fill is primary blue (green when 100%)
- Category section headers have a slightly tinted background
- Checkboxes: unchecked = light grey border, checked = primary blue fill with white tick
- Filter pills: active is primary blue, inactive is muted text
- Click "New List" → centered modal, template buttons are readable with correct active state
- Click "+ Item" on a list header → centered modal for that list, all fields readable

**Night mode checks:**
- Matches original look
- Modal and all fields correct

**Mobile (375px):**
- List card header controls wrap or stay readable — progress bar shrinks, all items fit
- Modal Add Item form: 2-col grid (category/qty) is OK at this width

---

## Task 5: TravelLens.jsx — minor fixes only

**Files:**
- Modify: `frontend/src/pages/TravelLens.jsx`

- [ ] **Step 1: Add focus ring to all search inputs**

In `TravelLens.jsx`, every `<input>` inside the search form has:
```jsx
style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
```

Add a `onFocus`/`onBlur` inline handler to show a primary-colored border on focus. Apply to all 6 inputs (origin, destination, flightDate, checkin, checkout, guests):

```jsx
// Before (example — origin input):
<input
  value={origin}
  onChange={(e) => setOrigin(e.target.value)}
  placeholder="e.g. London, New York"
  required
  className="w-full px-4 py-2.5 rounded-xl text-sm"
  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
/>

// After:
<input
  value={origin}
  onChange={(e) => setOrigin(e.target.value)}
  placeholder="e.g. London, New York"
  required
  className="w-full px-4 py-2.5 rounded-xl text-sm transition-all"
  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
  onFocus={(e) => { e.target.style.border = '1px solid var(--primary)'; e.target.style.outline = 'none'; }}
  onBlur={(e) => { e.target.style.border = '1px solid var(--border)'; }}
/>
```

Apply the same `onFocus`/`onBlur` pattern to all 6 inputs in the search form.

- [ ] **Step 2: Fix mobile date grid**

Find the 4-column date/guests grid in the search form:

```jsx
// Before:
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
```

Change to stack to a single column below `sm` (already 2-col at `sm`):

```jsx
// After:
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
```

This gives: 1 col on mobile → 2 col on tablet → 4 col on desktop.

- [ ] **Step 3: Verify in browser**

Open http://localhost:5200/travellens

**Focus ring check:**
- Click into the "From" input → border turns primary blue
- Tab through all fields → each gets blue border on focus, reverts on blur

**Mobile (375px):**
- Date fields stack to 1 column — no cramped grid
- At 640px (sm) they go to 2 columns
- At 768px (md) they go to 4 columns

**Theme check:**
- Already works in both themes — confirm no regression

---

## Self-Review

**Spec coverage:**
- ✅ CSS token replacements — covered in all Tasks 1–4 via complete file rewrites
- ✅ Centered modal pattern — Tasks 1 (New Group), 2 (Add Expense, Add Member, Settle), 3 (Add Expense), 4 (New List, Add Item)
- ✅ Comfortable primary cards (group cards, stat cards, list headers) — Tasks 1, 2, 3, 4
- ✅ Compact detail rows (expenses, members, packing items) — Tasks 2, 3, 4
- ✅ Pie chart tooltip CSS vars — Task 3
- ✅ `showAddItem` → `addItemForList` rename — Task 4
- ✅ TravelLens focus ring — Task 5
- ✅ TravelLens mobile date grid — Task 5
- ✅ Day mode (light theme) readability — verified in every task
- ✅ Night mode (dark theme) regression — verified in every task
- ✅ Mobile 375px responsiveness — verified in every task
- ✅ No logic/API/functionality changes — all form handlers, state, and routes preserved exactly

**Placeholder scan:** No TBDs, no "similar to above", all code blocks complete. ✅

**Type consistency:** `addItemForList` used consistently in Task 4 — state declaration, modal condition, form submit, and "+ Item" click handler all reference `addItemForList`. ✅
