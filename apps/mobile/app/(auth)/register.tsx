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
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiClient } from '@roamera/sdk';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await getApiClient().post('/api/v1/auth/register', { username, email, password });
      setSuccess(true);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.error ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📧</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Check your email</Text>
        <Text style={{ color: '#64748b', textAlign: 'center', marginBottom: 24 }}>
          We sent a verification link to your email. Verify it, then log in.
        </Text>
        <Link href="/(auth)/login">
          <Text style={{ color: '#0d9488', fontWeight: '600' }}>Back to login</Text>
        </Link>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🧭</Text>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#0f172a' }}>Create Account</Text>
          </View>

          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4, color: '#374151' }}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="your_username"
                autoCapitalize="none"
                style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 16, backgroundColor: '#fff' }}
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4, color: '#374151' }}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 16, backgroundColor: '#fff' }}
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4, color: '#374151' }}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 16, backgroundColor: '#fff' }}
              />
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={{ backgroundColor: '#0d9488', borderRadius: 12, padding: 14, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Create account</Text>}
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Link href="/(auth)/login">
                <Text style={{ color: '#0d9488', fontWeight: '500' }}>Already have an account? Sign in</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
