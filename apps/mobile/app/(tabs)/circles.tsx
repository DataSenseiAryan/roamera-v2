import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CirclesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 40 }}>🤝</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', marginTop: 12 }}>
          Circles
        </Text>
        <Text style={{ fontSize: 14, color: '#64748b', marginTop: 6, textAlign: 'center' }}>
          Travel Circles coming in Sprint 6.
        </Text>
      </View>
    </SafeAreaView>
  );
}
