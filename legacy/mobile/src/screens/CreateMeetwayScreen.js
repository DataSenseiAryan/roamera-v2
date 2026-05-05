import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

const STEPS = ['Basics', 'Details', 'Style'];
const TAGS = [
  { e: '⛰️', l: 'adventure' }, { e: '🎒', l: 'backpacking' }, { e: '🕺', l: 'party' },
  { e: '😌', l: 'chill' },    { e: '🏛️', l: 'culture' },    { e: '💎', l: 'luxury' },
  { e: '🌿', l: 'nature' },   { e: '🍜', l: 'food' },        { e: '📷', l: 'photography' },
];

export default function CreateMeetwayScreen({ navigation }) {
  const { user } = useAuth();
  const [step, setStep]     = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({
    title: '', destination: '', country: '',
    dateStart: '', dateEnd: '',
    description: '', maxPeople: 10,
    budgetMin: 200, budgetMax: 800,
    tags: [], privacy: 'public',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleTag = t => set('tags', form.tags.includes(t) ? form.tags.filter(x => x !== t) : [...form.tags, t]);

  function canNext() {
    if (step === 0) return form.title && form.destination && form.dateStart && form.dateEnd;
    if (step === 1) return form.description && form.maxPeople >= 2;
    return form.tags.length >= 1;
  }

  async function submit() {
    if (!user) { navigation.navigate('Login'); return; }
    setSaving(true);
    try {
      const res = await api.post('/meetways', {
        title: form.title, destination: form.destination,
        country: form.country || undefined,
        startDate: form.dateStart, endDate: form.dateEnd,
        description: form.description,
        maxPeople: form.maxPeople,
        budgetMin: form.budgetMin, budgetMax: form.budgetMax,
        tags: form.tags, privacy: form.privacy,
      });
      navigation.replace('MeetwayDetail', { id: res.data.id, title: res.data.title });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not create meetway.');
      setSaving(false);
    }
  }

  const inp = (placeholder, value, onChange, opts = {}) => (
    <TextInput
      style={s.input}
      placeholder={placeholder}
      placeholderTextColor={C.muted}
      value={value}
      onChangeText={onChange}
      {...opts}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Progress */}
      <View style={{ flexDirection: 'row', gap: 6, padding: 16, paddingBottom: 8 }}>
        {STEPS.map((_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: i <= step ? C.primary : C.border }} />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 4 }}>Create Meetway</Text>
        <Text style={{ color: C.muted, marginBottom: 24 }}>{STEPS[step]} · Step {step + 1} of {STEPS.length}</Text>

        {/* Step 0: Basics */}
        {step === 0 && <>
          <Text style={s.label}>TITLE *</Text>
          {inp('e.g. Bali Sunrise Trek 🌅', form.title, v => set('title', v))}
          <Text style={s.label}>DESTINATION *</Text>
          {inp('City / Region', form.destination, v => set('destination', v))}
          <Text style={s.label}>COUNTRY</Text>
          {inp('Country', form.country, v => set('country', v))}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>START (YYYY-MM-DD) *</Text>
              {inp('2025-06-10', form.dateStart, v => set('dateStart', v))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>END (YYYY-MM-DD) *</Text>
              {inp('2025-06-18', form.dateEnd, v => set('dateEnd', v))}
            </View>
          </View>
        </>}

        {/* Step 1: Details */}
        {step === 1 && <>
          <Text style={s.label}>DESCRIPTION *</Text>
          <TextInput
            placeholder="What makes this meetway special?"
            placeholderTextColor={C.muted}
            value={form.description}
            onChangeText={v => set('description', v)}
            multiline numberOfLines={4}
            style={[s.input, { minHeight: 100, textAlignVertical: 'top' }]}
          />
          <Text style={s.label}>MAX TRAVELERS: <Text style={{ color: C.primary }}>{form.maxPeople}</Text></Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {[2, 5, 8, 10, 15, 20, 30].map(n => (
              <TouchableOpacity key={n} onPress={() => set('maxPeople', n)} style={{ padding: 10, borderRadius: 10, backgroundColor: form.maxPeople === n ? C.primary : C.card, borderWidth: 1, borderColor: form.maxPeople === n ? C.primary : C.border, minWidth: 40, alignItems: 'center' }}>
                <Text style={{ color: form.maxPeople === n ? '#fff' : C.muted, fontWeight: '700' }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>BUDGET MIN ($)</Text>
              {inp('200', String(form.budgetMin), v => set('budgetMin', Number(v) || 0), { keyboardType: 'numeric' })}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>BUDGET MAX ($)</Text>
              {inp('800', String(form.budgetMax), v => set('budgetMax', Number(v) || 0), { keyboardType: 'numeric' })}
            </View>
          </View>
        </>}

        {/* Step 2: Style */}
        {step === 2 && <>
          <Text style={s.label}>VIBE TAGS * (pick at least 1)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {TAGS.map(({ e, l }) => {
              const sel = form.tags.includes(l);
              return (
                <TouchableOpacity key={l} onPress={() => toggleTag(l)} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 99, backgroundColor: sel ? 'rgba(59,130,246,.2)' : C.card, borderWidth: 1, borderColor: sel ? 'rgba(59,130,246,.5)' : C.border }}>
                  <Text style={{ color: sel ? C.primary : C.muted, fontWeight: '600', fontSize: 13 }}>{e} {l}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={s.label}>PRIVACY</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[{ k: 'public', i: '🌍', t: 'Public' }, { k: 'private', i: '🔒', t: 'Private' }].map(o => (
              <TouchableOpacity key={o.k} onPress={() => set('privacy', o.k)} style={{ flex: 1, padding: 14, borderRadius: 16, backgroundColor: form.privacy === o.k ? 'rgba(59,130,246,.12)' : C.card, borderWidth: 1, borderColor: form.privacy === o.k ? 'rgba(59,130,246,.4)' : C.border }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: form.privacy === o.k ? C.primary : C.muted }}>{o.i} {o.t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(n => n - 1)} style={s.backBtn}>
            <Text style={{ color: C.muted, fontWeight: '700' }}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={step < STEPS.length - 1 ? () => setStep(n => n + 1) : submit}
          disabled={!canNext() || saving}
          style={[s.nextBtn, { backgroundColor: canNext() ? C.primary : C.card, opacity: saving ? 0.6 : 1 }]}
        >
          <Text style={{ color: canNext() ? '#fff' : C.dim, fontWeight: '800', fontSize: 15 }}>
            {saving ? 'Launching…' : step < STEPS.length - 1 ? 'Continue →' : '🚀 Launch Meetway'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  label:   { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, color: C.text, fontSize: 14, marginBottom: 16 },
  footer:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: `${C.surface}f5`, paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 28, flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: C.border },
  backBtn: { flex: 1, padding: 15, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  nextBtn: { flex: 2, padding: 15, borderRadius: 14, alignItems: 'center' },
});
