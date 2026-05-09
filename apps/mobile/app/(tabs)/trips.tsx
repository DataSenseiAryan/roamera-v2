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

interface Trip {
  id: string;
  title: string;
  dateFrom?: string;
  dateTo?: string;
  currency: string;
  coverUrl?: string;
}

function TripCard({ trip }: { trip: Trip }) {
  const dark = useColorScheme() === 'dark';
  const from = trip.dateFrom ? new Date(trip.dateFrom).toLocaleDateString() : null;
  const to = trip.dateTo ? new Date(trip.dateTo).toLocaleDateString() : null;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/trips/${trip.id}` as never)}
      style={{
        margin: 12, marginBottom: 6, borderRadius: 16,
        backgroundColor: dark ? '#0f172a' : '#fff',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
        overflow: 'hidden',
      }}
    >
      <View style={{
        height: 80, backgroundColor: '#0d9488',
        justifyContent: 'flex-end', padding: 12,
      }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>{trip.title}</Text>
        {from && (
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
            {from}{to ? ` → ${to}` : ''}
          </Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', padding: 12, gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: dark ? '#1e293b' : '#f0fdfa', borderRadius: 8, padding: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: '#0d9488', fontWeight: '600' }}>CURRENCY</Text>
          <Text style={{ fontSize: 14, color: dark ? '#f8fafc' : '#0f172a', fontWeight: '600' }}>{trip.currency}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TripsScreen() {
  const dark = useColorScheme() === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const token = useAuthStore(s => s.accessToken);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await getApiClient().get('/api/v1/trips', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (res.data.trips ?? res.data.items ?? res.data) as Trip[];
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
        <Text style={{ fontSize: 28, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a' }}>Trips ✈️</Text>
        <Text style={{ fontSize: 13, color: '#0d9488' }}>Your travel plans</Text>
      </View>
      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ color: '#0d9488' }}>Loading trips...</Text>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={t => t.id}
          renderItem={({ item }) => <TripCard trip={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>✈️</Text>
              <Text style={{ color: dark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>No trips yet. Create one from the web app!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
