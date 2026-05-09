'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users, FileText, Bell, BarChart2, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@roamera/sdk';
import { useAuthStore } from '@/lib/auth-store';

interface AdminStats {
  users: number;
  posts: number;
  trips: number;
  circles: number;
  dau: number;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
          <Icon className="h-5 w-5 text-teal-600" />
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/home');
  }, [user, router]);

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await getApiClient().get<AdminStats>('/api/v1/admin/stats');
      return res.data;
    },
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') return null;

  const navItems = [
    { href: '/admin/users', icon: Users, label: 'User Management', desc: 'Manage roles, suspend accounts' },
    { href: '/admin/audit-log', icon: FileText, label: 'Audit Log', desc: 'Track all admin actions' },
    { href: '/admin/notices', icon: Bell, label: 'System Notices', desc: 'Broadcast announcements' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
          <Shield className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-slate-500">Roamera platform management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats?.users ?? 0} icon={Users} />
        <StatCard label="Total Posts" value={stats?.posts ?? 0} icon={BarChart2} />
        <StatCard label="Total Trips" value={stats?.trips ?? 0} icon={BarChart2} />
        <StatCard label="Active Today" value={stats?.dau ?? 0} icon={BarChart2} />
      </div>

      {/* Navigation */}
      <div className="grid md:grid-cols-3 gap-4">
        {navItems.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 transition flex items-center gap-4"
          >
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 transition">
              <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300 group-hover:text-teal-600 transition" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500 transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}
