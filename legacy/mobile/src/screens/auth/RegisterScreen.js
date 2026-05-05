import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { C } from '../../theme';

function PasswordStrength({ password }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  if (!password) return null;
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor: i <= score ? colors[score] : C.border }} />
        ))}
      </View>
      <Text style={{ fontSize: 11, color: colors[score], fontWeight: '600' }}>{labels[score]}</Text>
    </View>
  );
}

const STEPS = ['Username', 'Email & Password'];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [step, setStep]         = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'All fields are required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
    } catch (e) {
      Alert.alert('Registration failed', e.response?.data?.error || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function canNext() {
    if (step === 0) return username.trim().length >= 3;
    return email.trim().length > 3 && password.length >= 6;
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.logoWrap}>
          <View style={s.logoIcon}><Text style={{ fontSize: 28 }}>✈️</Text></View>
          <Text style={s.brand}>Roamera</Text>
          <Text style={s.tagline}>Start your journey</Text>
        </View>

        {/* Step indicator */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor: i <= step ? C.primary : C.border }} />
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.heading}>Create account</Text>
          <Text style={s.sub}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</Text>

          {step === 0 && (
            <>
              <Text style={s.label}>Choose a username</Text>
              <TextInput
                style={s.input}
                value={username}
                onChangeText={setUsername}
                placeholder="wanderer42"
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                autoFocus
              />
              <Text style={{ fontSize: 12, color: C.muted, marginTop: -12, marginBottom: 16 }}>
                At least 3 characters. This is how others find you.
              </Text>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={s.label}>Email</Text>
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
                  placeholder="Min. 6 characters"
                  placeholderTextColor={C.muted}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(p => !p)} style={s.eyeBtn}>
                  <Text style={{ fontSize: 18 }}>{showPw ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <PasswordStrength password={password} />
            </>
          )}

          {step === 0 ? (
            <TouchableOpacity
              style={[s.btn, !canNext() && s.btnDisabled]}
              onPress={() => setStep(1)}
              disabled={!canNext()}
            >
              <Text style={s.btnTxt}>Continue →</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[s.btn, (!canNext() || loading) && s.btnDisabled]}
                onPress={handleRegister}
                disabled={!canNext() || loading}
              >
                <Text style={s.btnTxt}>{loading ? 'Creating account…' : 'Create Account ✈️'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(0)} style={s.backBtn}>
                <Text style={{ color: C.muted, fontWeight: '600' }}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Login')}>
            <Text style={s.linkTxt}>
              Already have an account?{'  '}
              <Text style={{ color: C.primary, fontWeight: '700' }}>Sign in</Text>
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

  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primaryDark, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  brand:    { fontSize: 30, fontWeight: '800', color: C.text, letterSpacing: -0.8 },
  tagline:  { fontSize: 14, color: C.muted, marginTop: 4 },

  card:    { backgroundColor: C.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  heading: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 4 },
  sub:     { fontSize: 13, color: C.muted, marginBottom: 24 },

  label: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, color: C.text, fontSize: 15, marginBottom: 18 },

  pwWrap:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  eyeBtn:  { padding: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14 },

  btn:        { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  btnDisabled:{ backgroundColor: C.dim, opacity: 0.5 },
  btnTxt:     { color: '#fff', fontWeight: '800', fontSize: 16 },
  backBtn:    { backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },

  link:    { marginTop: 18, alignItems: 'center' },
  linkTxt: { fontSize: 14, color: C.muted },
});
