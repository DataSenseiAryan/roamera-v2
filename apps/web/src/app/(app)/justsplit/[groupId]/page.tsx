'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Users,
  TrendingUp,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  DollarSign,
  X,
} from 'lucide-react';
import {
  useExpenseGroup,
  useGroupExpenses,
  useGroupBalances,
  useCreateExpense,
  useDeleteExpense,
  useSettleDebt,
  useAddGroupMember,
} from '@roamera/sdk';
import type { Expense, ExpenseGroupMember, CreateExpense } from '@roamera/types';
import { useAuthStore } from '@/lib/auth-store';

type GroupDetail = {
  id: string;
  name: string;
  currency: string;
  ownerId?: string;
};

const EXPENSE_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;
const CATEGORIES = ['Food', 'Transport', 'Accommodation', 'Activities', 'Entertainment', 'Other'] as const;

function fmt(amount: number | string, currency: string) {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return `0 ${currency}`;
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
  return `${symbols[currency] ?? currency}${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function expenseAmount(e: Expense) {
  return typeof e.amount === 'string' ? parseFloat(e.amount) : Number(e.amount);
}

function formatExpenseDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

function splitBadgeClass(splitType: string) {
  if (splitType === 'equal') return 'bg-teal-100 text-teal-800 dark:bg-teal-900/35 dark:text-teal-300';
  if (splitType === 'weighted') return 'bg-violet-100 text-violet-800 dark:bg-violet-900/35 dark:text-violet-300';
  return 'bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-300';
}

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function weightedPreview(total: number, members: ExpenseGroupMember[], weights: Record<string, number>) {
  let tw = 0;
  for (const m of members) tw += Math.max(0, Number(weights[m.userId] ?? 0));
  if (tw <= 0) return members.map((m) => ({ username: m.username, share: 0 }));
  return members.map((m) => ({
    username: m.username,
    share: (total * Math.max(0, Number(weights[m.userId] ?? 0))) / tw,
  }));
}

function AddExpenseModal({
  groupId,
  groupCurrency,
  members,
  currentUserId,
  onClose,
}: {
  groupId: string;
  groupCurrency: string;
  members: ExpenseGroupMember[];
  currentUserId?: string;
  onClose: () => void;
}) {
  const createExpense = useCreateExpense();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<string>(groupCurrency || 'INR');
  const [paidBy, setPaidBy] = useState(() => {
    const ids = new Set(members.map((m) => m.userId));
    if (currentUserId && ids.has(currentUserId)) return currentUserId;
    return members[0]?.userId ?? '';
  });
  const [splitType, setSplitType] = useState<'equal' | 'weighted' | 'exact'>('equal');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Food');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const defaultWeights = useMemo(() => {
    const w: Record<string, number> = {};
    for (const m of members) w[m.userId] = 1;
    return w;
  }, [members]);

  const [weights, setWeights] = useState<Record<string, number>>(defaultWeights);

  useEffect(() => {
    setWeights(defaultWeights);
  }, [defaultWeights]);

  const equalShare =
    members.length > 0 && amount ? Number(amount) / members.length : members.length > 0 ? 0 : 0;

  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const m of members) o[m.userId] = '';
    return o;
  });

  useEffect(() => {
    setExactAmounts((prev) => {
      const next: Record<string, string> = {};
      for (const m of members) next[m.userId] = prev[m.userId] ?? '';
      return next;
    });
  }, [members]);

  const exactSum = useMemo(() => {
    let s = 0;
    for (const m of members) {
      const v = parseFloat(exactAmounts[m.userId] ?? '0');
      if (!Number.isNaN(v)) s += v;
    }
    return s;
  }, [members, exactAmounts]);

  const targetAmt = parseFloat(amount || '0');
  const exactMismatch = splitType === 'exact' && amount && Math.abs(exactSum - targetAmt) > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (!description.trim() || !Number.isFinite(amtNum) || amtNum <= 0 || !paidBy) return;
    if (splitType === 'exact' && Math.abs(exactSum - amtNum) > 1) return;

    let data: CreateExpense;

    if (splitType === 'equal') {
      data = {
        description: description.trim(),
        amount: String(amtNum),
        currency,
        paidBy,
        splitType: 'equal',
        category,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
    } else if (splitType === 'weighted') {
      data = {
        description: description.trim(),
        amount: String(amtNum),
        currency,
        paidBy,
        splitType: 'weighted',
        splits: members.map((m) => ({ userId: m.userId, weight: Math.max(0.001, Number(weights[m.userId] ?? 1)) })),
        category,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
    } else {
      data = {
        description: description.trim(),
        amount: String(amtNum),
        currency,
        paidBy,
        splitType: 'exact',
        splits: members.map((m) => ({
          userId: m.userId,
          amount: String(parseFloat(exactAmounts[m.userId] ?? '0') || 0),
        })),
        category,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
    }

    await createExpense.mutateAsync({ groupId, data });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-teal-600" />
            Add expense
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              placeholder="Dinner, taxi, hotel…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                {EXPENSE_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Paid by</label>
            <select
              required
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.username}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Split type</span>
            <div className="flex flex-wrap gap-2">
              {(['equal', 'weighted', 'exact'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSplitType(t)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition ${
                    splitType === t
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t === 'equal' ? 'Equal' : t === 'weighted' ? 'Weighted' : 'Exact'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {splitType === 'equal' && (
            <p className="text-sm text-slate-600 dark:text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-800/80 px-3 py-2 border border-slate-100 dark:border-slate-700">
              Split equally among all {members.length} members ·{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{fmt(equalShare, currency)}</span> each
            </p>
          )}

          {splitType === 'weighted' && (
            <div className="space-y-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/80 dark:bg-slate-800/40">
              {members.map((m) => (
                <div key={m.userId}>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                    <span>{m.username}</span>
                    <span>{weights[m.userId] ?? 1}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={Math.min(100, Math.max(1, weights[m.userId] ?? 1))}
                    onChange={(e) =>
                      setWeights((prev) => ({
                        ...prev,
                        [m.userId]: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-teal-600"
                  />
                </div>
              ))}
              <div className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                {weightedPreview(Number(amount) || 0, members, weights).map((row) => (
                  <div key={row.username} className="flex justify-between">
                    <span>{row.username}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{fmt(row.share, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {splitType === 'exact' && (
            <div className="space-y-2 rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/80 dark:bg-slate-800/40">
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 dark:text-slate-400 w-28 shrink-0 truncate">{m.username}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={exactAmounts[m.userId] ?? ''}
                    onChange={(e) =>
                      setExactAmounts((prev) => ({
                        ...prev,
                        [m.userId]: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
              ))}
              <p className={`text-sm font-medium ${exactMismatch ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                Total {fmt(exactSum, currency)} / {fmt(targetAmt || 0, currency)}
                {exactMismatch ? ' · splits must match within ±1' : ''}
              </p>
            </div>
          )}

          <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowNotes((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60"
            >
              Notes (optional)
              {showNotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showNotes && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-white resize-none border-0"
                placeholder="Anything to remember…"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={
              createExpense.isPending ||
              (splitType === 'exact' && amount !== '' && Math.abs(exactSum - targetAmt) > 1)
            }
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium flex items-center justify-center gap-2"
          >
            {createExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save expense
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JustSplitGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const { data: groupData, isLoading: groupLoading } = useExpenseGroup(groupId);
  const { data: expenses = [], isLoading: expLoading } = useGroupExpenses(groupId);
  const { data: balances, isLoading: balLoading } = useGroupBalances(groupId);

  const deleteExpense = useDeleteExpense();
  const settleDebt = useSettleDebt();
  const addMember = useAddGroupMember();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [memberUsername, setMemberUsername] = useState('');
  const [settlingKey, setSettlingKey] = useState<string | null>(null);

  const group = groupData?.group as GroupDetail | undefined;
  const members = groupData?.members ?? [];
  const ownerId = group?.ownerId;
  const isOwner = !!(userId && ownerId && userId === ownerId);

  const groupedExpenses = useMemo(() => {
    if (expenses.length <= 5) return null;
    const m = new Map<string, Expense[]>();
    for (const ex of expenses) {
      const key = ex.category?.trim() || 'Uncategorized';
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(ex);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [expenses]);

  const totalSameCurrency = useMemo(() => {
    const gc = group?.currency ?? 'INR';
    let s = 0;
    for (const ex of expenses) {
      if (ex.currency === gc) s += expenseAmount(ex);
    }
    return { sum: s, currency: gc };
  }, [expenses, group?.currency]);

  const loading = groupLoading || expLoading || balLoading;

  const handleSettle = async (debt: { from: string; to: string; amount: number }) => {
    const key = `${debt.from}-${debt.to}-${debt.amount}`;
    setSettlingKey(key);
    try {
      await settleDebt.mutateAsync({
        groupId,
        data: {
          toUserId: debt.to,
          amount: String(debt.amount),
          currency: balances?.groupCurrency ?? group?.currency ?? 'INR',
        },
      });
    } finally {
      setSettlingKey(null);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberUsername.trim()) return;
    await addMember.mutateAsync({ groupId, username: memberUsername.trim() });
    setMemberUsername('');
  };

  const renderExpenseRow = (ex: Expense) => {
    const canDelete =
      isOwner ||
      (!!user?.username && ex.paidByUsername === user.username);
    const amt = expenseAmount(ex);

    return (
      <div
        key={ex.id}
        className="group relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 py-3 px-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-200 dark:hover:border-teal-900 transition"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-900 dark:text-white">{ex.description}</p>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold ${splitBadgeClass(ex.splitType)}`}>
              {ex.splitType}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {ex.category ?? 'Other'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paid by <span className="font-medium text-slate-700 dark:text-slate-300">{ex.paidByUsername ?? '—'}</span>
            {' · '}
            {formatExpenseDate(ex.date)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
            {fmt(amt, ex.currency)}
          </span>
          {canDelete && (
            <button
              type="button"
              title="Delete expense"
              onClick={() => void deleteExpense.mutateAsync({ groupId, expenseId: ex.id })}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (groupLoading && !group) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600 dark:text-slate-400">Group not found.</p>
        <Link href="/justsplit" className="mt-4 inline-block text-teal-600 font-medium">
          Back to JustSplit
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Link
            href="/justsplit"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{group.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {members.length} members
                </span>
                <span>·</span>
                <span>{group.currency}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddExpense(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-teal-600" />
              Expenses
            </h2>
            {loading && expenses.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
              </div>
            ) : expenses.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No expenses yet.</p>
            ) : groupedExpenses ? (
              <div className="space-y-6">
                {groupedExpenses.map(([cat, list]) => (
                  <div key={cat}>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{cat}</h3>
                    <div className="space-y-2">{list.map(renderExpenseRow)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">{expenses.map(renderExpenseRow)}</div>
            )}

            {expenses.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total ({totalSameCurrency.currency})</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{fmt(totalSameCurrency.sum, totalSameCurrency.currency)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              Members ({members.length})
            </h2>
            <ul className="space-y-3">
              {members.map((m) => (
                <li key={m.userId} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 text-xs font-bold">
                    {initials(m.username)}
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.username}</span>
                </li>
              ))}
            </ul>
            {isOwner && (
              <form onSubmit={(e) => void handleAddMember(e)} className="mt-4 flex gap-2">
                <input
                  value={memberUsername}
                  onChange={(e) => setMemberUsername(e.target.value)}
                  placeholder="Username"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
                <button
                  type="submit"
                  disabled={addMember.isPending}
                  className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium disabled:opacity-60 shrink-0"
                >
                  Add
                </button>
              </form>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-600" />
              Balances
            </h2>
            {balLoading && !balances ? (
              <Loader2 className="h-6 w-6 text-teal-600 animate-spin mx-auto" />
            ) : (
              <ul className="space-y-2 mb-6">
                {(balances?.members ?? []).map((m) => (
                  <li key={m.userId} className="flex justify-between items-center text-sm">
                    <span className="text-slate-700 dark:text-slate-300 truncate pr-2">{m.username}</span>
                    <span
                      className={`font-semibold shrink-0 ${
                        m.netBalance > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : m.netBalance < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {m.netBalance > 0 ? 'owed ' : m.netBalance < 0 ? 'owes ' : ''}
                      {fmt(Math.abs(m.netBalance), m.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Simplified debts
            </h3>
            {!balances?.simplifiedDebts?.length ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                All settled
              </p>
            ) : (
              <ul className="space-y-2">
                {balances.simplifiedDebts.map((d) => {
                  const gc = d.currency;
                  const label = `${d.fromUsername ?? d.from} → ${d.toUsername ?? d.to}`;
                  const showSettle = !!(userId && d.from === userId);
                  const key = `${d.from}-${d.to}-${d.amount}`;
                  return (
                    <li
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2"
                    >
                      <span className="text-slate-800 dark:text-slate-200">
                        {label}: <span className="font-semibold">{fmt(d.amount, gc)}</span>
                      </span>
                      {showSettle && (
                        <button
                          type="button"
                          disabled={settlingKey === key || settleDebt.isPending}
                          onClick={() => void handleSettle(d)}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium disabled:opacity-60 shrink-0"
                        >
                          {settlingKey === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Settle'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {showAddExpense && (
        <AddExpenseModal
          groupId={groupId}
          groupCurrency={group.currency}
          members={members}
          currentUserId={userId}
          onClose={() => setShowAddExpense(false)}
        />
      )}
    </div>
  );
}
