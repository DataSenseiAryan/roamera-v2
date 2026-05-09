import { useState } from 'react';
import {
  ScrollView, Text, TouchableOpacity, useColorScheme, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

type TabKey = 'itinerary' | 'budget' | 'packing';

export default function TripDetailScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const dark = useColorScheme() === 'dark';
  const token = useAuthStore(s => s.accessToken);
  const [activeTab, setActiveTab] = useState<TabKey>('itinerary');

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const res = await getApiClient().get(`/api/v1/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.trip ?? res.data;
    },
    enabled: !!token && !!tripId,
  });

  const { data: days } = useQuery({
    queryKey: ['trip-days', tripId],
    queryFn: async () => {
      const res = await getApiClient().get(`/api/v1/trips/${tripId}/days`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.days ?? res.data ?? [];
    },
    enabled: !!token && !!tripId,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#0f172a' : '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#0d9488' }}>Loading trip...</Text>
      </SafeAreaView>
    );
  }

  const TABS: { key: TabKey; label: string; emoji: string }[] = [
    { key: 'itinerary', label: 'Itinerary', emoji: '🗺️' },
    { key: 'budget', label: 'Budget', emoji: '💰' },
    { key: 'packing', label: 'Packing', emoji: '🎒' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#0f172a' : '#f8fafc' }}>
      <ScrollView>
        {/* Header */}
        <View style={{ backgroundColor: '#0d9488', padding: 16, paddingBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>{trip?.title ?? 'Trip'}</Text>
          {trip?.dateFrom && (
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              {new Date(trip.dateFrom).toLocaleDateString()} — {trip.dateTo ? new Date(trip.dateTo).toLocaleDateString() : 'TBD'}
            </Text>
          )}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: dark ? '#1e293b' : '#fff', paddingHorizontal: 8 }}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                if (tab.key === 'budget') {
                  router.push(`/trips/${tripId}/budget` as never);
                } else if (tab.key === 'packing') {
                  router.push(`/trips/${tripId}/packing` as never);
                } else {
                  setActiveTab(tab.key);
                }
              }}
              style={{
                flex: 1, paddingVertical: 12, alignItems: 'center',
                borderBottomWidth: activeTab === tab.key ? 2 : 0,
                borderBottomColor: '#0d9488',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: activeTab === tab.key ? '#0d9488' : (dark ? '#94a3b8' : '#64748b') }}>
                {tab.emoji} {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'itinerary' && (
          <View style={{ padding: 16 }}>
            {(days as Array<{ id: string; dayNumber: number; title?: string; date?: string }>)?.map((day) => (
              <View key={day.id} style={{
                marginBottom: 12, padding: 16, borderRadius: 12,
                backgroundColor: dark ? '#1e293b' : '#fff',
                shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
              }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a' }}>
                  Day {day.dayNumber}{day.title ? ` — ${day.title}` : ''}
                </Text>
                {day.date && (
                  <Text style={{ fontSize: 12, color: '#0d9488', marginTop: 2 }}>
                    {new Date(day.date).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
            {(!days || (days as unknown[]).length === 0) && (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📅</Text>
                <Text style={{ color: dark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
                  No days added yet. Plan from the web app!
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
