import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CompassScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>
          Compass 🧭
        </Text>
        <Text style={{ fontSize: 15, color: '#64748b', lineHeight: 22 }}>
          Your travel feed appears here.{'\n'}
          Coming in Sprint 2.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
