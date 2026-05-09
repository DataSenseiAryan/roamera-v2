import { useState, useCallback } from 'react';
import {
  FlatList, RefreshControl, Text, TouchableOpacity,
  useColorScheme, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

interface Circle {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  coverUrl?: string;
}

export default function CirclesScreen() {
  const dark = useColorScheme() === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const token = useAuthStore(s => s.accessToken);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['circles'],
    queryFn: async () => {
      const res = await getApiClient().get('/api/v1/circles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (res.data.circles ?? res.data.items ?? res.data) as Circle[];
    },
    enabled: !!token,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#0f172a' : '#f8fafc' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a' }}>Circles 🔵</Text>
        <Text style={{ fontSize: 13, color: '#0d9488' }}>Your travel groups</Text>
      </View>

      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ color: '#0d9488' }}>Loading circles...</Text>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
          renderItem={({ item: circle }) => (
            <TouchableOpacity
              onPress={() => router.push(`/circles/${circle.id}` as never)}
              style={{
                marginBottom: 12, padding: 16, borderRadius: 16,
                backgroundColor: dark ? '#1e293b' : '#fff',
                shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a' }}>{circle.name}</Text>
              {circle.description && (
                <Text style={{ fontSize: 13, color: dark ? '#94a3b8' : '#64748b', marginTop: 4 }} numberOfLines={2}>
                  {circle.description}
                </Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: '#0d9488', fontWeight: '600' }}>
                  👥 {circle.memberCount ?? '—'} members
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔵</Text>
              <Text style={{ color: dark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
                No circles yet. Create one from the web app!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
