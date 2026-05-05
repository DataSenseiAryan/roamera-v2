import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface HealthData {
  status: string;
  db: string;
  version: string;
  uptime_ms: number;
  timestamp: string;
}

export default function HealthScreen() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/health`);
      const data = (await res.json()) as HealthData;
      setHealth(data);
    } catch (e) {
      setError(`Could not reach ${API_URL}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHealth();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 16 }}>
          API Health
        </Text>

        {loading ? (
          <ActivityIndicator color="#0d9488" />
        ) : error ? (
          <View style={{ backgroundColor: '#fee2e2', borderRadius: 16, padding: 16 }}>
            <Text style={{ color: '#991b1b', fontWeight: '600' }}>⚠️ Connection Error</Text>
            <Text style={{ color: '#7f1d1d', marginTop: 4, fontSize: 13 }}>{error}</Text>
          </View>
        ) : health ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, gap: 12 }}>
            <Row label="Status" value={health.status} ok={health.status === 'ok'} />
            <Row label="Database" value={health.db} ok={health.db === 'ok'} />
            <Row label="Version" value={health.version} />
            <Row label="Uptime" value={`${(health.uptime_ms / 1000).toFixed(1)}s`} />
            <Row label="Checked at" value={new Date(health.timestamp).toLocaleTimeString()} />
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() => void fetchHealth()}
          style={{ marginTop: 16, backgroundColor: '#0d9488', borderRadius: 16, padding: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Refresh</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: '#64748b', fontSize: 14 }}>{label}</Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: ok === true ? '#16a34a' : ok === false ? '#dc2626' : '#0f172a',
        }}
      >
        {value}
      </Text>
    </View>
  );
}
