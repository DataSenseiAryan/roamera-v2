import { FlatList, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../lib/api';
import { useAuthStore } from '../lib/auth';

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

const TYPE_EMOJI: Record<string, string> = {
  follow: '👤',
  comment: '💬',
  reaction: '❤️',
  trip_invite: '✈️',
  mention: '📢',
  system: '📢',
};

export default function NotificationsScreen() {
  const dark = useColorScheme() === 'dark';
  const token = useAuthStore(s => s.accessToken);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await getApiClient().get('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (res.data.notifications ?? res.data.items ?? res.data) as Notification[];
    },
    enabled: !!token,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await getApiClient().post('/api/v1/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await getApiClient().post(`/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = (data ?? []).filter(n => !n.readAt).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#0f172a' : '#f8fafc' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
      }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a' }}>
          Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllRead.mutate()}>
            <Text style={{ fontSize: 13, color: '#0d9488', fontWeight: '600' }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ color: '#0d9488' }}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={n => n.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => markRead.mutate(item.id)}
              style={{
                flexDirection: 'row', padding: 14,
                backgroundColor: !item.readAt
                  ? (dark ? '#1e293b' : '#f0fdfa')
                  : (dark ? '#0f172a' : '#fff'),
                borderBottomWidth: 1, borderBottomColor: dark ? '#1e293b' : '#e2e8f0',
              }}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#0d9488', justifyContent: 'center', alignItems: 'center',
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 18 }}>{TYPE_EMOJI[item.type] ?? '🔔'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: dark ? '#f8fafc' : '#0f172a' }}>
                  {item.title}
                </Text>
                {item.body && (
                  <Text style={{ fontSize: 13, color: dark ? '#94a3b8' : '#64748b', marginTop: 2 }} numberOfLines={2}>
                    {item.body}
                  </Text>
                )}
                <Text style={{ fontSize: 11, color: dark ? '#475569' : '#94a3b8', marginTop: 4 }}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
              {!item.readAt && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0d9488', alignSelf: 'center' }} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🔔</Text>
              <Text style={{ color: dark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
                No notifications yet
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
