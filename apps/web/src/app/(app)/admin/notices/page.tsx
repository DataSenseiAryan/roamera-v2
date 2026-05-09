'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@roamera/sdk';
import { useAuthStore } from '@/lib/auth-store';
import type { SystemNotice } from '@roamera/types';

export default function AdminNoticesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', type: 'info' });

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/home');
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'notices'],
    queryFn: async () => {
      const res = await getApiClient().get<{ notices: SystemNotice[] }>('/api/v1/admin/notices');
      return res.data.notices;
    },
    enabled: user?.role === 'admin',
  });

  const createNotice = useMutation({
    mutationFn: async (body: { title: string; body?: string; type: string }) => {
      await getApiClient().post('/api/v1/admin/notices', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'notices'] });
      setCreating(false);
      setForm({ title: '', body: '', type: 'info' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await getApiClient().patch(`/api/v1/admin/notices/${id}`, { isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'notices'] }),
  });

  const deleteNotice = useMutation({
    mutationFn: async (id: string) => {
      await getApiClient().delete(`/api/v1/admin/notices/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'notices'] }),
  });

  if (user?.role !== 'admin') return null;

  const notices = data ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="h-5 w-5 text-teal-600" />
          System Notices
        </h1>
        <button
          onClick={() => setCreating(!creating)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition"
        >
          <Plus className="h-4 w-4" />
          New Notice
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="mb-6 bg-white dark:bg-slate-800/60 rounded-2xl border border-teal-200 dark:border-teal-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">New System Notice</h3>
          <div className="space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title *"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Body (optional)"
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => createNotice.mutate({ title: form.title, body: form.body || undefined, type: form.type })}
                disabled={!form.title || createNotice.isPending}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                Publish
              </button>
              <button
                onClick={() => setCreating(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notices list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>
        ) : notices.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No notices yet</div>
        ) : notices.map((n) => (
          <div
            key={n.id}
            className={`bg-white dark:bg-slate-800/60 rounded-2xl border p-4 flex items-start gap-4 ${
              n.isActive
                ? 'border-teal-200 dark:border-teal-700'
                : 'border-slate-200 dark:border-slate-700 opacity-60'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  n.type === 'warning' ? 'bg-orange-100 text-orange-700' :
                  n.type === 'error' ? 'bg-red-100 text-red-600' :
                  n.type === 'success' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-600'
                }`}>{n.type}</span>
                {n.isActive && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700 font-medium">Live</span>
                )}
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{n.title}</p>
              {n.body && <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleActive.mutate({ id: n.id, isActive: !n.isActive })}
                disabled={toggleActive.isPending}
                title={n.isActive ? 'Deactivate' : 'Activate'}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                {n.isActive ? <X className="h-4 w-4 text-slate-400" /> : <Check className="h-4 w-4 text-teal-500" />}
              </button>
              <button
                onClick={() => deleteNotice.mutate(n.id)}
                disabled={deleteNotice.isPending}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
