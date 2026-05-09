import { FlatList, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';

interface PackingItem {
  id: string;
  name: string;
  isPacked: boolean;
  quantity: number;
  category?: string;
}

export default function PackingScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const dark = useColorScheme() === 'dark';
  const token = useAuthStore(s => s.accessToken);
  const qc = useQueryClient();

  const { data: items } = useQuery({
    queryKey: ['packing', tripId],
    queryFn: async () => {
      const res = await getApiClient().get(`/api/v1/trips/${tripId}/packing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (res.data.items ?? res.data ?? []) as PackingItem[];
    },
    enabled: !!token && !!tripId,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ itemId, isPacked }: { itemId: string; isPacked: boolean }) => {
      await getApiClient().patch(
        `/api/v1/trips/${tripId}/packing/items/${itemId}`,
        { isPacked },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packing', tripId] }),
  });

  const handleToggle = (item: PackingItem) => {
    Haptics.impactAsync(item.isPacked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    toggleMutation.mutate({ itemId: item.id, isPacked: !item.isPacked });
  };

  const packed = (items ?? []).filter(i => i.isPacked).length;
  const total = (items ?? []).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#0f172a' : '#f8fafc' }}>
      {/* Progress */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: dark ? '#f8fafc' : '#0f172a' }}>
            Packing Progress
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0d9488' }}>
            {packed}/{total}
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: dark ? '#1e293b' : '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
          <View style={{
            height: '100%',
            width: total > 0 ? `${(packed / total) * 100}%` : '0%',
            backgroundColor: '#0d9488', borderRadius: 4,
          }} />
        </View>
      </View>

      <FlatList
        data={items ?? []}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleToggle(item)}
            style={{
              flexDirection: 'row', alignItems: 'center', padding: 14,
              marginBottom: 8, borderRadius: 12,
              backgroundColor: dark ? '#1e293b' : '#fff',
              opacity: item.isPacked ? 0.6 : 1,
            }}
          >
            <View style={{
              width: 24, height: 24, borderRadius: 12,
              borderWidth: 2, borderColor: item.isPacked ? '#0d9488' : '#cbd5e1',
              backgroundColor: item.isPacked ? '#0d9488' : 'transparent',
              marginRight: 12, alignItems: 'center', justifyContent: 'center',
            }}>
              {item.isPacked && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 15, fontWeight: '600',
                color: dark ? '#f8fafc' : '#0f172a',
                textDecorationLine: item.isPacked ? 'line-through' : 'none',
              }}>
                {item.name}
              </Text>
              {item.quantity > 1 && (
                <Text style={{ fontSize: 12, color: dark ? '#64748b' : '#94a3b8' }}>Qty: {item.quantity}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🎒</Text>
            <Text style={{ color: dark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>No packing items yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
