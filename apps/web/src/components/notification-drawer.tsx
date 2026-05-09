'use client';

import { X, CheckCheck, Bell, UserPlus, MessageSquare, Heart, MapPin } from 'lucide-react';

import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
  useRespondNotification,
} from '@roamera/sdk';
import type { Notification } from '@roamera/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'follow') return <UserPlus className="h-4 w-4 text-teal-600" />;
  if (type === 'comment') return <MessageSquare className="h-4 w-4 text-blue-500" />;
  if (type === 'reaction') return <Heart className="h-4 w-4 text-red-500" />;
  if (type === 'trip_invite') return <MapPin className="h-4 w-4 text-orange-500" />;
  return <Bell className="h-4 w-4 text-slate-500" />;
}

function NotifItem({ notif }: { notif: Notification }) {
  const markRead = useMarkRead();
  const deleteNotif = useDeleteNotification();
  const respond = useRespondNotification();

  return (
    <div
      className={`p-3 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3 ${
        !notif.readAt ? 'bg-teal-50/40 dark:bg-teal-900/10' : ''
      }`}
    >
      <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
        <NotifIcon type={notif.type} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
        )}

        {/* Interactive respond buttons for trip invites */}
        {notif.type === 'trip_invite' && !notif.readAt && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => respond.mutate({ id: notif.id, action: 'accept' })}
              disabled={respond.isPending}
              className="px-3 py-1 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => respond.mutate({ id: notif.id, action: 'decline' })}
              disabled={respond.isPending}
              className="px-3 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {!notif.readAt && (
          <button
            onClick={() => markRead.mutate(notif.id)}
            className="p-1 text-slate-400 hover:text-teal-600 transition"
            title="Mark as read"
          >
            <CheckCheck className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => deleteNotif.mutate(notif.id)}
          className="p-1 text-slate-300 hover:text-red-500 transition"
          title="Delete"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function NotificationDrawer({ open, onClose }: Props) {
  const { data, isLoading } = useNotifications(30);
  const markAll = useMarkAllRead();

  const notifications = data?.notifications ?? [];
  const unread = notifications.filter((n) => !n.readAt).length;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Notifications</h2>
            {unread > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full font-medium">
                {unread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium transition disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Bell className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => <NotifItem key={n.id} notif={n} />)
          )}
        </div>
      </div>
    </>
  );
}
