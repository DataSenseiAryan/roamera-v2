import { ScrollView, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

export default function CircleDetailScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const dark = useColorScheme() === 'dark';
  const token = useAuthStore(s => s.accessToken);

  const { data: circle } = useQuery({
    queryKey: ['circle', circleId],
    queryFn: async () => {
      const res = await getApiClient().get(`/api/v1/circles/${circleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.circle ?? res.data;
    },
    enabled: !!token && !!circleId,
  });

  const { data: members } = useQuery({
    queryKey: ['circle-members', circleId],
    queryFn: async () => {
      const res = await getApiClient().get(`/api/v1/circles/${circleId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.members ?? res.data ?? [];
    },
    enabled: !!token && !!circleId,
  });

  const { data: splits } = useQuery({
    queryKey: ['circle-splits', circleId],
    queryFn: async () => {
      const res = await getApiClient().get(`/api/v1/circles/${circleId}/justsplit/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => ({ data: null }));
      return res.data;
    },
    enabled: !!token && !!circleId,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#0f172a' : '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Circle Info */}
        <View style={{ backgroundColor: '#0d9488', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>{circle?.name ?? 'Circle'}</Text>
          {circle?.description && (
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{circle.description}</Text>
          )}
        </View>

        {/* Members */}
        <Text style={{ fontSize: 18, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a', marginBottom: 12 }}>
          Members 👥
        </Text>
        {(members as Array<{ userId: string; username?: string; role: string }>)?.map((member) => (
          <View key={member.userId} style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            padding: 12, marginBottom: 8, borderRadius: 12,
            backgroundColor: dark ? '#1e293b' : '#fff',
          }}>
            <Text style={{ fontSize: 15, color: dark ? '#f8fafc' : '#0f172a' }}>
              {member.username ?? member.userId}
            </Text>
            <Text style={{ fontSize: 12, color: '#0d9488', fontWeight: '600', textTransform: 'uppercase' }}>
              {member.role}
            </Text>
          </View>
        ))}

        {/* JustSplit Summary */}
        {splits && (
          <>
            <Text style={{ fontSize: 18, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a', marginTop: 16, marginBottom: 12 }}>
              JustSplit 💸
            </Text>
            <View style={{
              padding: 16, borderRadius: 12,
              backgroundColor: dark ? '#1e293b' : '#fff',
            }}>
              <Text style={{ color: dark ? '#94a3b8' : '#64748b' }}>
                Total: ₹{splits.total?.toLocaleString() ?? 0}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
