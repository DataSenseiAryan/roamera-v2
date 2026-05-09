'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Shield, Ban } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@roamera/sdk';
import { useAuthStore } from '@/lib/auth-store';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  isSuspended: boolean;
  emailVerified: boolean;
  createdAt: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/home');
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: async () => {
      const res = await getApiClient().get<{ users: AdminUser[]; total: number; page: number; limit: number }>(
        `/api/v1/admin/users?page=${page}&limit=20${search ? `&q=${encodeURIComponent(search)}` : ''}`,
      );
      return res.data;
    },
    enabled: user?.role === 'admin',
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, ...body }: { id: string; role?: string; isSuspended?: boolean }) => {
      await getApiClient().patch(`/api/v1/admin/users/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  if (user?.role !== 'admin') return null;

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">User Management</h1>
        <span className="ml-auto text-sm text-slate-500">{total} total</span>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by username or email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 text-left">
              <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase">User</th>
              <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase">Email</th>
              <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase">Role</th>
              <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-800 dark:text-slate-100">@{u.username}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    u.role === 'admin' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                    u.role === 'deleted' ? 'bg-red-100 text-red-600' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    u.isSuspended ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                  }`}>
                    {u.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => updateUser.mutate({ id: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                      disabled={updateUser.isPending}
                      title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                      <Shield className={`h-4 w-4 ${u.role === 'admin' ? 'text-orange-500' : 'text-slate-400'}`} />
                    </button>
                    <button
                      onClick={() => updateUser.mutate({ id: u.id, isSuspended: !u.isSuspended })}
                      disabled={updateUser.isPending}
                      title={u.isSuspended ? 'Unsuspend' : 'Suspend'}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                      <Ban className={`h-4 w-4 ${u.isSuspended ? 'text-red-500' : 'text-slate-400'}`} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
