import { FlatList, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

interface Post {
  id: string;
  title: string;
  coverUrl?: string;
}

export default function ProfileScreen() {
  const dark = useColorScheme() === 'dark';
  const { user, logout, accessToken: token } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const res = await getApiClient().get(`/api/v1/users/${user?.username}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.user ?? res.data;
    },
    enabled: !!token && !!user?.username,
  });

  const { data: posts } = useQuery({
    queryKey: ['user-posts', user?.id],
    queryFn: async () => {
      const res = await getApiClient().get(`/api/v1/users/${user?.username}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (res.data.posts ?? res.data.items ?? res.data) as Post[];
    },
    enabled: !!token && !!user?.username,
  });

  const { data: unreadNotifs } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await getApiClient().get('/api/v1/notifications?unread=true&limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.total ?? (res.data.notifications ?? []).length;
    },
    enabled: !!token,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login' as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#0f172a' : '#f8fafc' }}>
      <ScrollView>
        {/* Header */}
        <View style={{ alignItems: 'center', padding: 24, backgroundColor: dark ? '#0f172a' : '#f8fafc' }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: '#0d9488', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
          }}>
            <Text style={{ fontSize: 32 }}>
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a' }}>
            {user?.username ?? 'User'}
          </Text>
          {user?.email && (
            <Text style={{ fontSize: 13, color: dark ? '#94a3b8' : '#64748b', marginTop: 2 }}>{user.email}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 8 }}>
          {[
            { label: 'Posts', value: (profile?.postsCount ?? posts?.length ?? 0).toString() },
            { label: 'Followers', value: (profile?.followersCount ?? 0).toString() },
            { label: 'Following', value: (profile?.followingCount ?? 0).toString() },
          ].map(stat => (
            <View key={stat.label} style={{
              flex: 1, alignItems: 'center', padding: 12, borderRadius: 12,
              backgroundColor: dark ? '#1e293b' : '#fff',
            }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a' }}>{stat.value}</Text>
              <Text style={{ fontSize: 12, color: dark ? '#94a3b8' : '#64748b' }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.push('/notifications' as never)}
            style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: 14, marginBottom: 8, borderRadius: 12,
              backgroundColor: dark ? '#1e293b' : '#fff',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: dark ? '#f8fafc' : '#0f172a' }}>
              🔔 Notifications
            </Text>
            {(unreadNotifs ?? 0) > 0 && (
              <View style={{
                backgroundColor: '#ef4444', borderRadius: 10,
                paddingHorizontal: 8, paddingVertical: 2,
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={{
              padding: 14, borderRadius: 12, alignItems: 'center',
              backgroundColor: '#fee2e2',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#ef4444' }}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Moments Grid */}
        {(posts?.length ?? 0) > 0 && (
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a', marginBottom: 12 }}>
              Moments 📸
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {(posts ?? []).slice(0, 9).map(post => (
                <View key={post.id} style={{
                  width: '32%', aspectRatio: 1, borderRadius: 8,
                  backgroundColor: '#0d9488',
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 11, color: '#fff', textAlign: 'center', padding: 4 }} numberOfLines={2}>
                    {post.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
