import { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiClient } from '@roamera/sdk';
import { useAuthStore } from '../../lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data } = await getApiClient().post('/api/v1/auth/login', { email, password });
      login(data.accessToken, data.refreshToken, data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🧭</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#0d9488' }}>Roamera</Text>
            <Text style={{ fontSize: 14, color: '#64748b' }}>Pack&Go</Text>
          </View>

          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4, color: '#374151' }}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: '#fff',
                }}
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4, color: '#374151' }}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                style={{
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: '#fff',
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                backgroundColor: '#0d9488',
                borderRadius: 12,
                padding: 14,
                alignItems: 'center',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Sign in</Text>
              )}
            </TouchableOpacity>

            <Link href="/(auth)/otp" asChild>
              <TouchableOpacity style={{ padding: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Text style={{ color: '#374151', fontWeight: '500' }}>Sign in with OTP</Text>
              </TouchableOpacity>
            </Link>

            <View style={{ alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Link href="/(auth)/register">
                <Text style={{ color: '#0d9488', fontWeight: '500' }}>Create an account</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
