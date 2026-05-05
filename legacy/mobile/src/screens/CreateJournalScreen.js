import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, SafeAreaView,
} from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

const STEPS = ['Basics', 'Story', 'Details'];

export default function CreateJournalScreen({ navigation }) {
  const { user } = useAuth();
  const [step, setStep]     = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({
    title: '', destination: '', startDate: '', endDate: '',
    content: '', activities: '', accommodation: '', budget: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function canNext() {
    if (step === 0) return form.title && form.destination && form.startDate && form.endDate;
    return true;
  }

  async function submit() {
    if (!user) { navigation.navigate('Login'); return; }
    setSaving(true);
    try {
      const res = await api.post('/journals', {
        title: form.title,
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        content: form.content || undefined,
        activities: form.activities || undefined,
        accommodation: form.accommodation || undefined,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        itinerary: '[]',
      });
      Alert.alert('Posted! 🎉', 'Your journal is live.', [
        { text: 'View Journal', onPress: () => navigation.replace('JournalDetail', { id: res.data.id }) },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not post journal.');
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

      {/* Progress bar */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 12 }}>
        {STEPS.map((_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: i <= step ? C.primary : C.border }} />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600', marginBottom: 20 }}>
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </Text>

        {/* Step 0: Basics */}
        {step === 0 && <>
          <Text style={s.label}>TITLE *</Text>
          {inp('A week in Kyoto 🍜', form.title, v => set('title', v))}

          <Text style={s.label}>DESTINATION *</Text>
          {inp('City, Country', form.destination, v => set('destination', v))}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>START DATE *</Text>
              {inp('YYYY-MM-DD', form.startDate, v => set('startDate', v))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>END DATE *</Text>
              {inp('YYYY-MM-DD', form.endDate, v => set('endDate', v))}
            </View>
          </View>
        </>}

        {/* Step 1: Story */}
        {step === 1 && <>
          <Text style={s.label}>YOUR STORY</Text>
          <TextInput
            placeholder="Share what made this trip special…"
            placeholderTextColor={C.muted}
            value={form.content}
            onChangeText={v => set('content', v)}
            multiline numberOfLines={8}
            style={[s.input, { minHeight: 160, textAlignVertical: 'top' }]}
          />

          <Text style={s.label}>ACTIVITIES</Text>
          <TextInput
            placeholder="Hiking, surfing, street food tours…"
            placeholderTextColor={C.muted}
            value={form.activities}
            onChangeText={v => set('activities', v)}
            multiline numberOfLines={3}
            style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
          />
        </>}

        {/* Step 2: Details */}
        {step === 2 && <>
          <Text style={s.label}>ACCOMMODATION</Text>
          {inp('Where did you stay?', form.accommodation, v => set('accommodation', v))}

          <Text style={s.label}>TOTAL BUDGET (INR)</Text>
          {inp('e.g. 1200', form.budget, v => set('budget', v), { keyboardType: 'numeric' })}

          <View style={s.previewCard}>
            <Text style={s.previewLabel}>Preview</Text>
            <Text style={s.previewTitle}>{form.title || 'Your Journal Title'}</Text>
            <Text style={{ fontSize: 12, color: C.muted }}>📍 {form.destination || 'Destination'}</Text>
            {form.startDate && <Text style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{form.startDate} → {form.endDate}</Text>}
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
            {saving ? 'Posting…' : step < STEPS.length - 1 ? 'Continue →' : '🌍 Publish Journal'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, color: C.text, fontSize: 14, marginBottom: 16 },

  previewCard:  { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginTop: 8 },
  previewLabel: { fontSize: 10, fontWeight: '700', color: C.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  previewTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 6 },

  footer:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: `${C.surface}f5`, paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 28, flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: C.border },
  backBtn: { flex: 1, padding: 15, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  nextBtn: { flex: 2, padding: 15, borderRadius: 14, alignItems: 'center' },
});
