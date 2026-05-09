'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';

import { useUnreadCount } from '@roamera/sdk';
import { NotificationDrawer } from './notification-drawer';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: count = 0 } = useUnreadCount();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <NotificationDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
