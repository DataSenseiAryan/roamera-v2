'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Loader2,
  Package,
  LayoutTemplate,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  usePackingList,
  useCreatePackingItem,
  useUpdatePackingItem,
  useDeletePackingItem,
  useTogglePacked,
  useCreatePackingCategory,
  usePackingBags,
  useCreatePackingBag,
  useAssignItemToBag,
  useRemoveItemFromBag,
  usePackingTemplates,
  useApplyTemplate,
  useSaveAsTemplate,
  useTripMembers,
} from '@roamera/sdk';
import type { PackingBag, PackingCategory, PackingItem, PackingTemplate } from '@roamera/types';

type BagWithItems = PackingBag & { items?: string[] };

function bagItemIds(bag: BagWithItems): string[] {
  return bag.items ?? bag.itemIds ?? [];
}

function mergeBagRows(listBags: BagWithItems[], apiBags: PackingBag[]): BagWithItems[] {
  const byId = new Map<string, BagWithItems>();
  for (const b of apiBags) {
    byId.set(b.id, { ...b, items: [] });
  }
  for (const b of listBags) {
    const prev = byId.get(b.id);
    const items = bagItemIds(b);
    byId.set(b.id, {
      ...prev,
      ...b,
      name: b.name ?? prev?.name ?? 'Bag',
      color: b.color ?? prev?.color ?? null,
      items,
      itemCount: items.length > 0 ? items.length : prev?.itemCount ?? b.itemCount ?? 0,
    });
  }
  return [...byId.values()].sort((a, z) => a.name.localeCompare(z.name));
}

function labelMember(userId: string | null | undefined, members: { userId: string; username?: string }[]) {
  if (!userId) return null;
  return members.find((m) => m.userId === userId)?.username ?? userId.slice(0, 8);
}

interface Props {
  tripId: string;
  canEdit: boolean;
  myRole: string | null | undefined;
}

export function PackingPanel({ tripId, canEdit, myRole }: Props) {
  const { data: list, isLoading, isError, refetch } = usePackingList(tripId);
  const { data: bagsRemote } = usePackingBags(tripId);
  const { data: templates } = usePackingTemplates();
  const { data: members = [] } = useTripMembers(tripId);

  const createItem = useCreatePackingItem();
  const updateItem = useUpdatePackingItem();
  const deleteItem = useDeletePackingItem();
  const togglePacked = useTogglePacked();
  const createCategory = useCreatePackingCategory();
  const createBag = useCreatePackingBag();
  const assignToBag = useAssignItemToBag();
  const removeFromBag = useRemoveItemFromBag();
  const applyTemplate = useApplyTemplate();
  const saveTemplate = useSaveAsTemplate();

  const [optimisticPacked, setOptimisticPacked] = useState<Record<string, boolean>>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showNewBag, setShowNewBag] = useState(false);

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState<string>('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newCatName, setNewCatName] = useState('');
  const [newBagName, setNewBagName] = useState('');
  const [newBagColor, setNewBagColor] = useState('#0d9488');
  const [tplName, setTplName] = useState('');
  const [tplDescription, setTplDescription] = useState('');
  const [formError, setFormError] = useState('');

  const bagsMerged = useMemo(() => mergeBagRows((list?.bags as BagWithItems[]) ?? [], bagsRemote ?? []), [list, bagsRemote]);

  const findBagForItem = useCallback(
    (itemId: string) => bagsMerged.find((b) => bagItemIds(b).includes(itemId)) ?? null,
    [bagsMerged],
  );

  const displayPacked = useCallback(
    (item: PackingItem) => (item.id in optimisticPacked ? optimisticPacked[item.id] : item.isPacked),
    [optimisticPacked],
  );

  const handleTogglePacked = async (item: PackingItem) => {
    const next = !displayPacked(item);
    setOptimisticPacked((o) => ({ ...o, [item.id]: next }));
    try {
      await togglePacked.mutateAsync({ tripId, itemId: item.id, isPacked: next });
      setOptimisticPacked((o) => {
        const n = { ...o };
        delete n[item.id];
        return n;
      });
    } catch {
      setOptimisticPacked((o) => {
        const n = { ...o };
        delete n[item.id];
        return n;
      });
    }
  };

  const handleBagChange = async (itemId: string, targetBagId: string) => {
    const current = findBagForItem(itemId);
    if (current?.id === targetBagId || (!current && !targetBagId)) return;
    try {
      if (current) await removeFromBag.mutateAsync({ tripId, bagId: current.id, itemId });
      if (targetBagId) await assignToBag.mutateAsync({ tripId, bagId: targetBagId, itemId });
    } catch {
      refetch();
    }
  };

  const submitNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newItemName.trim()) {
      setFormError('Name is required.');
      return;
    }
    try {
      await createItem.mutateAsync({
        tripId,
        data: {
          name: newItemName.trim(),
          quantity: Math.max(1, newItemQty),
          categoryId: newItemCategoryId || null,
        },
      });
      setNewItemName('');
      setNewItemQty(1);
      setShowAddItem(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add item.');
    }
  };

  const submitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newCatName.trim()) return;
    try {
      await createCategory.mutateAsync({ tripId, data: { name: newCatName.trim() } });
      setNewCatName('');
      setShowAddCategory(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add category.');
    }
  };

  const submitBag = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newBagName.trim()) return;
    try {
      await createBag.mutateAsync({
        tripId,
        data: { name: newBagName.trim(), color: newBagColor || null },
      });
      setNewBagName('');
      setNewBagColor('#0d9488');
      setShowNewBag(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add bag.');
    }
  };

  const submitSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!tplName.trim()) return;
    try {
      await saveTemplate.mutateAsync({ tripId, name: tplName.trim(), description: tplDescription.trim() || undefined });
      setTplName('');
      setTplDescription('');
      setShowSaveTemplate(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save template.');
    }
  };

  const applyTpl = async (templateId: string) => {
    setFormError('');
    try {
      await applyTemplate.mutateAsync({ tripId, templateId });
      setShowTemplates(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Apply failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading packing list…</p>
      </div>
    );
  }

  if (isError || !list) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">Could not load packing list.</p>
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

  const { packed, total, percentage } = list.progress;
  const categories = list.categories ?? [];

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto">
      {myRole === 'viewer' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
          You have view-only access to this packing list.
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-teal-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Packing progress</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {packed} of {total} packed ({percentage}%)
              </p>
            </div>
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowAddItem(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-medium hover:bg-teal-700"
              >
                <Plus className="h-3.5 w-3.5" /> Item
              </button>
              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Category
              </button>
              <button
                type="button"
                onClick={() => setShowNewBag(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Bag
              </button>
              <button
                type="button"
                onClick={() => setShowTemplates(true)}
                disabled={applyTemplate.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <LayoutTemplate className="h-3.5 w-3.5" /> Template
              </button>
              <button
                type="button"
                onClick={() => setShowSaveTemplate(true)}
                disabled={saveTemplate.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" /> Save as template
              </button>
            </div>
          )}
        </div>
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-600 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          {categories.map((cat) => (
            <CategoryBlock
              key={cat.id}
              category={cat}
              tripId={tripId}
              canEdit={canEdit}
              members={members}
              displayPacked={displayPacked}
              onTogglePacked={handleTogglePacked}
              onBagChange={handleBagChange}
              bagsMerged={bagsMerged}
              deleteItem={deleteItem}
              updateItem={updateItem}
              togglePending={togglePacked.isPending}
            />
          ))}

          {list.uncategorized.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Uncategorized</h3>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {list.uncategorized.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    tripId={tripId}
                    canEdit={canEdit}
                    members={members}
                    displayPacked={displayPacked}
                    onTogglePacked={handleTogglePacked}
                    onBagChange={handleBagChange}
                    bagsMerged={bagsMerged}
                    deleteItem={deleteItem}
                    updateItem={updateItem}
                    togglePending={togglePacked.isPending}
                  />
                ))}
              </ul>
            </div>
          )}

          {categories.length === 0 && list.uncategorized.length === 0 && (
            <div className="text-center py-14 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm">
              Nothing packed yet. Add a category or item to get started.
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm h-fit lg:sticky lg:top-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-teal-600" /> Bags
          </h3>
          {bagsMerged.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No bags yet.</p>
          ) : (
            <ul className="space-y-3">
              {bagsMerged.map((bag) => {
                const n = bagItemIds(bag).length || bag.itemCount || 0;
                const raw = bag.color && /^#?[0-9a-fA-F]{3,8}$/.test(bag.color) ? bag.color : '#94a3b8';
                const dot = raw.startsWith('#') ? raw : `#${raw}`;
                return (
                  <li key={bag.id} className="flex items-center gap-3 text-sm">
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-slate-900 shadow"
                      style={{ backgroundColor: dot }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{bag.name}</p>
                      <p className="text-xs text-slate-500">{n} item{n !== 1 ? 's' : ''}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>

      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add item</h2>
              <button type="button" onClick={() => setShowAddItem(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={submitNewItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                <input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  placeholder="Passport"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                <select
                  value={newItemCategoryId}
                  onChange={(e) => setNewItemCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddItem(false)} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createItem.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  {createItem.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">New category</h2>
              <button type="button" onClick={() => setShowAddCategory(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={submitCategory} className="p-5 space-y-4">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Toiletries"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm"
              />
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddCategory(false)} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" disabled={createCategory.isPending} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm disabled:opacity-50">
                  {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewBag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">New bag</h2>
              <button type="button" onClick={() => setShowNewBag(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={submitBag} className="p-5 space-y-4">
              <input
                value={newBagName}
                onChange={(e) => setNewBagName(e.target.value)}
                placeholder="Carry-on"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm"
              />
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Color</label>
                <input
                  type="color"
                  value={newBagColor}
                  onChange={(e) => setNewBagColor(e.target.value)}
                  className="h-10 w-full rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewBag(false)} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" disabled={createBag.isPending} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm disabled:opacity-50">
                  {createBag.isPending ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Apply template</h2>
              <button type="button" onClick={() => setShowTemplates(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {(templates ?? []).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No templates saved yet.</p>
              ) : (
                (templates ?? []).map((t: PackingTemplate) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTpl(t.id)}
                    disabled={applyTemplate.isPending}
                    className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition disabled:opacity-50"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">{t.name}</p>
                    {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                  </button>
                ))
              )}
              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>
          </div>
        </div>
      )}

      {showSaveTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Save as template</h2>
              <button type="button" onClick={() => setShowSaveTemplate(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={submitSaveTemplate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                <input
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm"
                  placeholder="Weekend trip"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description (optional)</label>
                <textarea
                  value={tplDescription}
                  onChange={(e) => setTplDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm resize-none"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowSaveTemplate(false)} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" disabled={saveTemplate.isPending} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm disabled:opacity-50">
                  {saveTemplate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryBlock({
  category,
  tripId,
  canEdit,
  members,
  displayPacked,
  onTogglePacked,
  onBagChange,
  bagsMerged,
  deleteItem,
  updateItem,
  togglePending,
}: {
  category: PackingCategory;
  tripId: string;
  canEdit: boolean;
  members: { userId: string; username?: string }[];
  displayPacked: (item: PackingItem) => boolean;
  onTogglePacked: (item: PackingItem) => void;
  onBagChange: (itemId: string, bagId: string) => void;
  bagsMerged: BagWithItems[];
  deleteItem: ReturnType<typeof useDeletePackingItem>;
  updateItem: ReturnType<typeof useUpdatePackingItem>;
  togglePending: boolean;
}) {
  const [open, setOpen] = useState(true);
  const assignee = labelMember(category.assigneeUserId, members);
  const items = category.items ?? [];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{category.name}</h3>
            {assignee && <p className="text-xs text-slate-500 truncate">Assignee: {assignee}</p>}
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500 flex-shrink-0">{items.length} items</span>
      </button>
      {open && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              tripId={tripId}
              canEdit={canEdit}
              members={members}
              displayPacked={displayPacked}
              onTogglePacked={onTogglePacked}
              onBagChange={onBagChange}
              bagsMerged={bagsMerged}
              deleteItem={deleteItem}
              updateItem={updateItem}
              togglePending={togglePending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemRow({
  item,
  tripId,
  canEdit,
  members,
  displayPacked,
  onTogglePacked,
  onBagChange,
  bagsMerged,
  deleteItem,
  updateItem,
  togglePending,
}: {
  item: PackingItem;
  tripId: string;
  canEdit: boolean;
  members: { userId: string; username?: string }[];
  displayPacked: (item: PackingItem) => boolean;
  onTogglePacked: (item: PackingItem) => void;
  onBagChange: (itemId: string, bagId: string) => void;
  bagsMerged: BagWithItems[];
  deleteItem: ReturnType<typeof useDeletePackingItem>;
  updateItem: ReturnType<typeof useUpdatePackingItem>;
  togglePending: boolean;
}) {
  const currentBagId =
    bagsMerged.find((b) => bagItemIds(b).includes(item.id))?.id ?? '';

  const assigned = labelMember(item.assignedToUserId, members);

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          type="button"
          role="checkbox"
          aria-checked={displayPacked(item)}
          disabled={togglePending || !canEdit}
          onClick={() => canEdit && onTogglePacked(item)}
          className={`mt-0.5 h-5 w-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition ${
            displayPacked(item)
              ? 'bg-teal-600 border-teal-600 text-white'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
          } disabled:opacity-50`}
        >
          {displayPacked(item) && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${displayPacked(item) ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}
          >
            {item.name}
            {item.quantity > 1 && <span className="text-slate-400 font-normal ml-1">×{item.quantity}</span>}
          </p>
          {assigned && <p className="text-xs text-slate-500 mt-0.5">Person: {assigned}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end pl-8 sm:pl-0">
        {canEdit && (
          <>
            <select
              value={currentBagId}
              onChange={(e) => onBagChange(item.id, e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5 max-w-[140px]"
            >
              <option value="">No bag</option>
              {bagsMerged.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <QtyInlineEditor item={item} tripId={tripId} updateItem={updateItem} />
            <button
              type="button"
              onClick={() => deleteItem.mutate({ tripId, itemId: item.id })}
              disabled={deleteItem.isPending}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition disabled:opacity-50"
              aria-label="Delete item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function QtyInlineEditor({
  item,
  tripId,
  updateItem,
}: {
  item: PackingItem;
  tripId: string;
  updateItem: ReturnType<typeof useUpdatePackingItem>;
}) {
  const [val, setVal] = useState(String(item.quantity));

  useEffect(() => {
    setVal(String(item.quantity));
  }, [item.quantity, item.id]);

  const commit = () => {
    const q = parseInt(val, 10);
    if (!Number.isFinite(q) || q < 1) {
      setVal(String(item.quantity));
      return;
    }
    if (q !== item.quantity) {
      updateItem.mutate({ tripId, itemId: item.id, data: { quantity: q } });
    }
  };

  return (
    <input
      type="number"
      min={1}
      title="Quantity"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="w-14 text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 bg-white dark:bg-slate-950 text-center"
    />
  );
}
