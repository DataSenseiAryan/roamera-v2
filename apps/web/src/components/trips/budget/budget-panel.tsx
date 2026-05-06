'use client';

import { useState } from 'react';
import {
  Plus,
  ArrowRightLeft,
  Loader2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  useBudgetSummary,
  useCreateBudgetItem,
  useDeleteBudgetItem,
  useSetBudgetSplits,
  useTogglePaid,
  useCreateSettlement,
  useTripMembers,
} from '@roamera/sdk';
import type { BudgetSummary, CreateBudgetItem, SimplifiedDebt, TripMember } from '@roamera/types';

type BudgetItemRow = BudgetSummary['categories'][number]['items'][number] & {
  splits?: { userId: string; amount: number | string; isPaid: boolean }[];
};

function fmtMoney(amount: number | string, currency: string) {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  const safe = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.length === 3 ? currency : 'USD',
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `${safe.toFixed(2)} ${currency}`;
  }
}

function labelForUser(userId: string, members: TripMember[], fallback?: string) {
  const m = members.find((x) => x.userId === userId);
  return m?.username || fallback || userId.slice(0, 8);
}

function BalanceSummary({
  balances,
  debts,
  currency,
  members,
}: {
  balances: BudgetSummary['balances'];
  debts: SimplifiedDebt[];
  currency: string;
  members: TripMember[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
        <ArrowRightLeft className="h-4 w-4 text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Balances & settlements</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {balances.map((b) => (
            <div
              key={b.userId}
              className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm"
            >
              <span className="text-slate-700 dark:text-slate-200 truncate pr-2">
                {labelForUser(b.userId, members, b.username)}
              </span>
              <span
                className={`font-medium tabular-nums flex-shrink-0 ${
                  b.balance > 0.005
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : b.balance < -0.005
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500'
                }`}
              >
                {b.balance > 0 ? '+' : ''}
                {fmtMoney(b.balance, currency)}
              </span>
            </div>
          ))}
        </div>
        {debts.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Simplified debts
            </p>
            <ul className="space-y-2">
              {debts.map((d, i) => (
                <li
                  key={`${d.from}-${d.to}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 dark:border-slate-700 px-3 py-2 text-sm"
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{labelForUser(d.from, members, d.fromUsername)}</span>
                    <span className="mx-1.5 text-slate-400">→</span>
                    <span className="font-medium">{labelForUser(d.to, members, d.toUsername)}</span>
                  </span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
                    {fmtMoney(d.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">Everyone is square.</p>
        )}
      </div>
    </div>
  );
}

function AddBudgetItemModal({
  tripId,
  defaultCurrency,
  onClose,
}: {
  tripId: string;
  defaultCurrency: string;
  onClose: () => void;
}) {
  const createItem = useCreateBudgetItem();
  const presets = ['Transport', 'Accommodation', 'Food', 'Activities', 'Shopping'];
  const [category, setCategory] = useState(presets[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency || 'INR');
  const [persons, setPersons] = useState(1);
  const [days, setDays] = useState(1);
  const [error, setError] = useState('');

  const catValue = category === '__custom__' ? customCategory.trim() : category;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !catValue) {
      setError('Name and category are required.');
      return;
    }
    const p = parseFloat(price);
    if (!Number.isFinite(p) || p < 0) {
      setError('Enter a valid price.');
      return;
    }
    const body: CreateBudgetItem = {
      category: catValue,
      name: name.trim(),
      totalPrice: String(p),
      currency: currency.trim() || defaultCurrency,
      persons: Math.max(1, persons),
      days: Math.max(1, days),
    };
    try {
      await createItem.mutateAsync({ tripId, data: body });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not add expense.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add expense</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              {presets.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="__custom__">Custom…</option>
            </select>
            {category === '__custom__' && (
              <input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Category name"
                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              placeholder="Flight to Jaipur"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Price</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Currency</label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={8}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm uppercase"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Persons</label>
              <input
                type="number"
                min={1}
                value={persons}
                onChange={(e) => setPersons(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Days</label>
              <input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createItem.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {createItem.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettlementModal({
  tripId,
  currency,
  members,
  onClose,
}: {
  tripId: string;
  currency: string;
  members: TripMember[];
  onClose: () => void;
}) {
  const settle = useCreateSettlement();
  const [picked, setPicked] = useState<{ from?: string; to?: string }>({});
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const fallbackFrom = members[0]?.userId ?? '';
  const fromUserId = picked.from ?? fallbackFrom;
  const fallbackTo =
    members.find((m) => m.userId !== fromUserId)?.userId ?? members[1]?.userId ?? fallbackFrom;
  const toUserId = picked.to ?? fallbackTo;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (fromUserId === toUserId) {
      setError('Choose two different people.');
      return;
    }
    const a = parseFloat(amount);
    if (!Number.isFinite(a) || a <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    try {
      await settle.mutateAsync({
        tripId,
        data: { fromUserId, toUserId, amount: String(a), currency },
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Settlement failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record settlement</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From</label>
            <select
              value={fromUserId}
              onChange={(e) => {
                const nextFrom = e.target.value;
                setPicked((s) => ({
                  from: nextFrom,
                  to: s.to === nextFrom ? undefined : s.to,
                }));
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.username ?? m.userId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">To</label>
            <select
              value={toUserId}
              onChange={(e) => setPicked((s) => ({ ...s, to: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.username ?? m.userId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Amount ({currency})</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={settle.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {settle.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategorySection({
  category,
  tripId,
  canEdit,
  members,
  summaryCurrency,
}: {
  category: BudgetSummary['categories'][number];
  tripId: string;
  canEdit: boolean;
  members: TripMember[];
  summaryCurrency: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
          )}
          <span className="font-semibold text-slate-900 dark:text-white truncate">{category.name}</span>
        </div>
        <span className="text-sm font-medium text-teal-600 dark:text-teal-400 tabular-nums flex-shrink-0">
          {fmtMoney(category.total, summaryCurrency)}
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {category.items.map((raw) => (
            <BudgetItemRow
              key={raw.id}
              item={raw as BudgetItemRow}
              tripId={tripId}
              canEdit={canEdit}
              members={members}
              summaryCurrency={summaryCurrency}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function BudgetItemRow({
  item,
  tripId,
  canEdit,
  members,
  summaryCurrency,
}: {
  item: BudgetItemRow;
  tripId: string;
  canEdit: boolean;
  members: TripMember[];
  summaryCurrency: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const deleteItem = useDeleteBudgetItem();
  const setSplits = useSetBudgetSplits();
  const togglePaid = useTogglePaid();
  const splits = item.splits ?? [];
  const itemCurrency = item.currency || summaryCurrency;
  const priceNum =
    typeof item.totalPrice === 'number' ? item.totalPrice : parseFloat(String(item.totalPrice));

  const [draftSplits, setDraftSplits] = useState<Record<string, string>>({});
  const [splitError, setSplitError] = useState('');

  const initDraftFromSplits = () => {
    const d: Record<string, string> = {};
    for (const m of members) d[m.userId] = '';
    for (const s of splits) d[s.userId] = String(s.amount);
    setDraftSplits(d);
  };

  const applyEqualSplit = () => {
    if (!members.length || !Number.isFinite(priceNum)) return;
    const each = (priceNum / members.length).toFixed(2);
    const d: Record<string, string> = {};
    for (const m of members) d[m.userId] = each;
    setDraftSplits(d);
  };

  const saveSplits = async () => {
    setSplitError('');
    const rows = members
      .map((m) => ({
        userId: m.userId,
        amount: parseFloat(draftSplits[m.userId] || '0'),
      }))
      .filter((r) => r.amount > 0);
    const sum = rows.reduce((a, r) => a + r.amount, 0);
    if (Math.abs(sum - priceNum) > 0.02) {
      setSplitError(`Splits must sum to ${fmtMoney(priceNum, itemCurrency)} (${itemCurrency}).`);
      return;
    }
    try {
      await setSplits.mutateAsync({
        tripId,
        itemId: item.id,
        splits: rows.map((r) => ({ userId: r.userId, amount: String(r.amount) })),
      });
      setExpanded(false);
    } catch (err: unknown) {
      setSplitError(err instanceof Error ? err.message : 'Could not save splits.');
    }
  };

  return (
    <li className="px-4 py-3 bg-white dark:bg-slate-900">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => {
            setExpanded(!expanded);
            if (!expanded) initDraftFromSplits();
          }}
          className="mt-0.5 text-slate-400 hover:text-teal-600"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
            <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
              {fmtMoney(priceNum, itemCurrency)}
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {item.persons} persons × {item.days} days · {itemCurrency}
          </p>
          {splits.length > 0 && !expanded && (
            <p className="text-xs text-slate-400 mt-1">{splits.length} split{splits.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => deleteItem.mutate({ tripId, itemId: item.id })}
            disabled={deleteItem.isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
            aria-label="Delete expense"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 ml-6 pl-2 border-l-2 border-teal-200 dark:border-teal-800 space-y-3">
          {splits.length > 0 ? (
            <ul className="space-y-2">
              {splits.map((sp) => (
                <li
                  key={sp.userId}
                  className="flex items-center justify-between gap-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2"
                >
                  <span className="text-slate-700 dark:text-slate-200 truncate">
                    {labelForUser(sp.userId, members)}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="tabular-nums font-medium">{fmtMoney(sp.amount, itemCurrency)}</span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          togglePaid.mutate({ tripId, itemId: item.id, userId: sp.userId })
                        }
                        disabled={togglePaid.isPending}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${
                          sp.isPaid
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {sp.isPaid ? (
                          <>
                            <Check className="h-3 w-3" /> Paid
                          </>
                        ) : (
                          'Unpaid'
                        )}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No splits yet — add shares below.</p>
          )}

          {canEdit && (
            <div className="space-y-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applyEqualSplit}
                  className="text-xs font-medium px-2 py-1 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                >
                  Split equally
                </button>
              </div>
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2">
                  <span className="text-xs w-28 truncate text-slate-600 dark:text-slate-300">
                    {m.username ?? m.userId}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={draftSplits[m.userId] ?? ''}
                    onChange={(e) =>
                      setDraftSplits((prev) => ({ ...prev, [m.userId]: e.target.value }))
                    }
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 text-sm"
                  />
                </div>
              ))}
              {splitError && <p className="text-xs text-red-600">{splitError}</p>}
              <button
                type="button"
                onClick={saveSplits}
                disabled={setSplits.isPending}
                className="text-xs font-semibold text-teal-600 hover:underline disabled:opacity-50"
              >
                {setSplits.isPending ? 'Saving…' : 'Save splits'}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

interface Props {
  tripId: string;
  canEdit: boolean;
  myRole: string | null | undefined;
}

export function BudgetPanel({ tripId, canEdit, myRole }: Props) {
  const { data: summary, isLoading, isError, refetch } = useBudgetSummary(tripId);
  const { data: members = [] } = useTripMembers(tripId);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showSettle, setShowSettle] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading budget…</p>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-300 text-sm">Could not load budget.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const catTotals = summary.categories.slice().sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {myRole === 'viewer' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
          You have view-only access to this budget.
        </div>
      )}
      <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-teal-100 text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Trip total
            </p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{fmtMoney(summary.grandTotal, summary.currency)}</p>
            <p className="text-teal-100 text-xs mt-1 uppercase tracking-wide">{summary.currency}</p>
          </div>
        </div>
        {catTotals.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {catTotals.slice(0, 6).map((c) => (
              <div key={c.name}>
                <p className="text-teal-100 text-xs truncate">{c.name}</p>
                <p className="text-sm font-semibold tabular-nums">{fmtMoney(c.total, summary.currency)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BalanceSummary
        balances={summary.balances}
        debts={summary.simplifiedDebts}
        currency={summary.currency}
        members={members}
      />

      <div className="space-y-3">
        {summary.categories.map((cat) => (
          <CategorySection
            key={cat.name}
            category={cat}
            tripId={tripId}
            canEdit={canEdit}
            members={members}
            summaryCurrency={summary.currency}
          />
        ))}
      </div>

      {summary.categories.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm">
          No expenses yet. Add your first line item to track this trip&apos;s spend.
        </div>
      )}

      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAddItem(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Add expense
          </button>
          <button
            type="button"
            onClick={() => setShowSettle(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Record settlement
          </button>
        </div>
      )}

      {showAddItem && (
        <AddBudgetItemModal tripId={tripId} defaultCurrency={summary.currency} onClose={() => setShowAddItem(false)} />
      )}
      {showSettle && members.length >= 2 && (
        <SettlementModal
          tripId={tripId}
          currency={summary.currency}
          members={members}
          onClose={() => setShowSettle(false)}
        />
      )}
      {showSettle && members.length < 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm shadow-xl text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Add more trip members to record settlements.</p>
            <button
              type="button"
              onClick={() => setShowSettle(false)}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
