'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@roamera/sdk';
import { useAuthStore } from '@/lib/auth-store';

interface AuditEntry {
  id: string;
  action: string;
  userId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  details: string | null;
  createdAt: number;
}

export default function AuditLogPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/home');
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log', page],
    queryFn: async () => {
      const res = await getApiClient().get<{ entries: AuditEntry[]; total: number; page: number; limit: number }>(
        `/api/v1/admin/audit-log?page=${page}&limit=50`,
      );
      return res.data;
    },
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') return null;

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  function formatTime(ts: number) {
    return new Date(ts * 1000).toLocaleString();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-teal-600" />
          Audit Log
        </h1>
        <span className="ml-auto text-sm text-slate-500">{total} entries</span>
      </div>

      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 text-left">
              <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase">Action</th>
              <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase">Actor</th>
              <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase">Resource</th>
              <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-12 text-slate-400">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-slate-400">No audit entries yet</td></tr>
            ) : entries.map((e) => (
              <tr key={e.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                <td className="px-4 py-3">
                  <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {e.action}
                  </code>
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                  {e.userId ? e.userId.slice(0, 8) + '...' : '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {e.resourceType && e.resourceId
                    ? `${e.resourceType}/${e.resourceId.slice(0, 8)}...`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{formatTime(e.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
