'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { Navbar } from '@/components/navbar';
import { useSystemNotices } from '@roamera/sdk';
import type { SystemNotice } from '@roamera/types';
import { Loader2 } from 'lucide-react';

const NOTICE_ICONS = {
  info: <Info className="h-4 w-4 flex-shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 flex-shrink-0" />,
  success: <CheckCircle className="h-4 w-4 flex-shrink-0" />,
  error: <AlertCircle className="h-4 w-4 flex-shrink-0" />,
};

const NOTICE_STYLES = {
  info: 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  warning: 'bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  success: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800',
  error: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800',
};

function SystemNoticeBanner({ notice, onDismiss }: { notice: SystemNotice; onDismiss: () => void }) {
  const type = (notice.type as keyof typeof NOTICE_ICONS) in NOTICE_ICONS
    ? (notice.type as keyof typeof NOTICE_ICONS)
    : 'info';

  return (
    <div className={`px-4 py-2.5 border-b flex items-center gap-3 ${NOTICE_STYLES[type]}`}>
      {NOTICE_ICONS[type]}
      <div className="flex-1 text-sm">
        <span className="font-semibold">{notice.title}</span>
        {notice.body && <span className="ml-2 opacity-80">{notice.body}</span>}
      </div>
      <button onClick={onDismiss} className="p-1 hover:opacity-70 transition">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      return new Set(JSON.parse(localStorage.getItem('dismissed_notices') ?? '[]'));
    } catch {
      return new Set();
    }
  });

  const { data: notices = [] } = useSystemNotices();
  const activeNotices = notices.filter((n) => n.isActive && !dismissedIds.has(n.id));

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const dismissNotice = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dismissed_notices', JSON.stringify([...next]));
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      {activeNotices.map((notice) => (
        <SystemNoticeBanner
          key={notice.id}
          notice={notice}
          onDismiss={() => dismissNotice(notice.id)}
        />
      ))}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
