import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  Notification,
  NotificationPref,
  SystemNotice,
} from '@roamera/types';

import { getApiClient } from '../client';

export const notificationKeys = {
  all: () => ['notifications'] as const,
  list: () => [...notificationKeys.all(), 'list'] as const,
  unreadCount: () => [...notificationKeys.all(), 'unread-count'] as const,
  prefs: () => [...notificationKeys.all(), 'prefs'] as const,
  notices: () => ['notices'] as const,
};

export function useNotifications(limit = 20) {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: async () => {
      const res = await getApiClient().get<{
        notifications: Notification[];
        hasMore: boolean;
        nextCursor: string | null;
      }>(`/api/v1/notifications?limit=${limit}`);
      return res.data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const res = await getApiClient().get<{ count: number }>('/api/v1/notifications/unread-count');
      return res.data.count;
    },
    refetchInterval: 30_000, // poll every 30s
  });
}

export function useNotificationPrefs() {
  return useQuery({
    queryKey: notificationKeys.prefs(),
    queryFn: async () => {
      const res = await getApiClient().get<{ preferences: NotificationPref[] }>(
        '/api/v1/notifications/preferences',
      );
      return res.data.preferences;
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getApiClient().post(`/api/v1/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all() });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await getApiClient().post('/api/v1/notifications/read-all');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all() });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getApiClient().delete(`/api/v1/notifications/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all() });
    },
  });
}

export function useRespondNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accept' | 'decline' }) => {
      const res = await getApiClient().post<{
        success: boolean;
        action: string;
        notificationType: string;
        resourceId: string | null;
      }>(`/api/v1/notifications/${id}/respond`, { action });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all() });
    },
  });
}

export function useUpdateNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      updates: Array<{ eventType: string; inApp?: boolean; email?: boolean; push?: boolean }>,
    ) => {
      await getApiClient().patch('/api/v1/notifications/preferences', updates);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.prefs() });
    },
  });
}

export function useSystemNotices() {
  return useQuery({
    queryKey: notificationKeys.notices(),
    queryFn: async () => {
      const res = await getApiClient().get<{ notices: SystemNotice[] }>('/api/v1/notices');
      return res.data.notices;
    },
  });
}
