import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';

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
  const [dialog, setDialog] = useState(null);

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

  const deleteList = (listId) => {
    setDialog({
      title: 'Delete Packing List',
      message: 'This will permanently delete the list and all its items.',
      danger: true,
      onConfirm: async () => {
        await api.delete(`/journals/${id}/packing/${listId}`);
        fetchLists();
      },
    });
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
      <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
