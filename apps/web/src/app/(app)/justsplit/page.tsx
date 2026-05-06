'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Receipt, Plus, Users, TrendingUp, TrendingDown, Loader2, Globe, Check, X } from 'lucide-react';
import { useExpenseGroups, useCreateExpenseGroup } from '@roamera/sdk';
import type { ExpenseGroup, CreateExpenseGroup } from '@roamera/types';

const BASE_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD'] as const;

function fmt(amount: number, currency: string) {
  const n = amount;
  if (Number.isNaN(n)) return `0 ${currency}`;
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
  return `${symbols[currency] ?? currency}${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function GroupCard({ group }: { group: ExpenseGroup }) {
  const bal = group.myBalance ?? 0;
  const cur = group.currency;

  let balanceLine: React.ReactNode;
  let icon: React.ReactNode;

  if (bal > 0) {
    balanceLine = <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">You are owed {fmt(bal, cur)}</span>;
    icon = <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
  } else if (bal < 0) {
    balanceLine = (
      <span className="text-sm font-medium text-red-600 dark:text-red-400">You owe {fmt(Math.abs(bal), cur)}</span>
    );
    icon = <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />;
  } else {
    balanceLine = <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Settled up</span>;
    icon = <Check className="h-5 w-5 text-slate-400 shrink-0" />;
  }

  return (
    <Link
      href={`/justsplit/${group.id}`}
      className="block bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate">{group.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
              <Users className="h-3.5 w-3.5" />
              {group.memberCount ?? 0} members
            </span>
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              {cur}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">{icon}</div>
          <div className="mt-1">{balanceLine}</div>
        </div>
        <Receipt className="h-8 w-8 text-teal-600 dark:text-teal-400 shrink-0 opacity-80" />
      </div>
    </Link>
  );
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const createGroup = useCreateExpenseGroup();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<(typeof BASE_CURRENCIES)[number]>('INR');
  const [linkedCircleId, setLinkedCircleId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload: CreateExpenseGroup = {
      name: name.trim(),
      currency,
      linkedCircleId: linkedCircleId.trim() || undefined,
    };
    await createGroup.mutateAsync(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">New expense group</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              placeholder="Weekend trip"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Base currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as (typeof BASE_CURRENCIES)[number])}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              {BASE_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Link to Circle ID (optional)
            </label>
            <input
              value={linkedCircleId}
              onChange={(e) => setLinkedCircleId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              placeholder="Circle UUID"
            />
          </div>
          <button
            type="submit"
            disabled={createGroup.isPending}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium flex items-center justify-center gap-2"
          >
            {createGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create group
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JustSplitPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: groups, isLoading } = useExpenseGroups();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-7 w-7 text-teal-600" />
            JustSplit
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Split bills fairly across your crew</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Group
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
          <Receipt className="h-14 w-14 text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No expense groups yet</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            No expense groups yet. Create one to start splitting costs!
          </p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition"
          >
            <Plus className="h-4 w-4" />
            New Group
          </button>
        </div>
      )}

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
