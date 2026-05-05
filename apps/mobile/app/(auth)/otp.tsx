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
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiClient } from '@roamera/sdk';
import { useAuthStore } from '../../lib/auth';

export default function OtpScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) { Alert.alert('Error', 'Enter your email'); return; }
    setLoading(true);
    try {
      await getApiClient().post('/api/v1/auth/otp/send', { email });
      setStep('code');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) { Alert.alert('Error', 'Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const { data } = await getApiClient().post('/api/v1/auth/otp/verify', { email, code });
      login(data.accessToken, data.refreshToken, data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🧭</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>
            {step === 'email' ? 'Sign in with OTP' : 'Enter code'}
          </Text>
        </View>

        {step === 'email' ? (
          <View style={{ gap: 16 }}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 16, backgroundColor: '#fff' }}
            />
            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={loading}
              style={{ backgroundColor: '#0d9488', borderRadius: 12, padding: 14, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Send code</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <Text style={{ color: '#64748b', textAlign: 'center' }}>Code sent to {email}</Text>
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 24, textAlign: 'center', letterSpacing: 8, backgroundColor: '#fff', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
            />
            <TouchableOpacity
              onPress={handleVerify}
              disabled={loading || code.length !== 6}
              style={{ backgroundColor: '#0d9488', borderRadius: 12, padding: 14, alignItems: 'center', opacity: loading || code.length !== 6 ? 0.6 : 1 }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Verify</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('email')} style={{ alignItems: 'center' }}>
              <Text style={{ color: '#64748b' }}>Use different email</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Link href="/(auth)/login">
            <Text style={{ color: '#0d9488', fontWeight: '500' }}>Sign in with password</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
