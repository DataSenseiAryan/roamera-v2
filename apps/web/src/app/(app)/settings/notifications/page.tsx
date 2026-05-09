'use client';

import { Bell, Mail, Smartphone } from 'lucide-react';
import { useNotificationPrefs, useUpdateNotificationPrefs } from '@roamera/sdk';
import { NOTIFICATION_EVENT_TYPES } from '@roamera/types';

const EVENT_LABELS: Record<string, string> = {
  follow: 'New follower',
  comment: 'Comment on your Moment',
  reaction: 'Reaction on your Moment',
  trip_invite: 'Trip invitation',
  trip_update: 'Trip updates',
  circle_invite: 'Circle invitation',
  journey_contributor: 'Journey contributor',
  system: 'System announcements',
};

export default function NotificationSettingsPage() {
  const { data: prefs = [], isLoading } = useNotificationPrefs();
  const update = useUpdateNotificationPrefs();

  const prefMap = new Map(prefs.map((p) => [p.eventType, p]));

  const toggle = (eventType: string, channel: 'inApp' | 'email', current: boolean) => {
    update.mutate([{ eventType, [channel]: !current }]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="h-6 w-6 text-teal-600" />
          Notification Preferences
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Choose how you want to be notified about activity on Roamera.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto] px-5 py-3 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Event</span>
          <span className="w-20 text-center flex items-center gap-1 justify-center">
            <Bell className="h-3 w-3" /> In-App
          </span>
          <span className="w-20 text-center flex items-center gap-1 justify-center">
            <Mail className="h-3 w-3" /> Email
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading preferences...</div>
        ) : (
          NOTIFICATION_EVENT_TYPES.map((type) => {
            const pref = prefMap.get(type) ?? { inApp: true, email: true, push: false };
            return (
              <div
                key={type}
                className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-4 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {EVENT_LABELS[type] ?? type}
                  </p>
                </div>

                <div className="w-20 flex justify-center">
                  <button
                    onClick={() => toggle(type, 'inApp', pref.inApp)}
                    disabled={update.isPending}
                    className={`w-10 h-6 rounded-full transition-all ${
                      pref.inApp ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-600'
                    } relative`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        pref.inApp ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="w-20 flex justify-center">
                  <button
                    onClick={() => toggle(type, 'email', pref.email)}
                    disabled={update.isPending}
                    className={`w-10 h-6 rounded-full transition-all ${
                      pref.email ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-600'
                    } relative`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        pref.email ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400 text-center">
        Push notifications coming in Sprint 11 (mobile app).
      </p>
    </div>
  );
}
