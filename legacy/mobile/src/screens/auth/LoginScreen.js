import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { C } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter your email/username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert('Login failed', e.response?.data?.error || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.logoWrap}>
          <View style={s.logoIcon}><Text style={{ fontSize: 28 }}>✈️</Text></View>
          <Text style={s.brand}>Roamera</Text>
          <Text style={s.tagline}>Your travel universe</Text>
        </View>

        <View style={s.card}>
          <Text style={s.heading}>Welcome back</Text>
          <Text style={s.sub}>Sign in to continue your journey</Text>

          <Text style={s.label}>Email or username</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={s.label}>Password</Text>
          <View style={s.pwWrap}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={C.muted}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(p => !p)} style={s.eyeBtn}>
              <Text style={{ fontSize: 18 }}>{showPw ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={s.btnTxt}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Register')}>
            <Text style={s.linkTxt}>
              Don't have an account?{'  '}
              <Text style={{ color: C.primary, fontWeight: '700' }}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primaryDark, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  brand:    { fontSize: 30, fontWeight: '800', color: C.text, letterSpacing: -0.8 },
  tagline:  { fontSize: 14, color: C.muted, marginTop: 4 },

  card:     { backgroundColor: C.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  heading:  { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 4 },
  sub:      { fontSize: 13, color: C.muted, marginBottom: 24 },

  label: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, color: C.text, fontSize: 15, marginBottom: 18 },

  pwWrap:  { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 8 },
  eyeBtn:  { padding: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14 },

  btn:    { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },

  link:    { marginTop: 18, alignItems: 'center' },
  linkTxt: { fontSize: 14, color: C.muted },
});
