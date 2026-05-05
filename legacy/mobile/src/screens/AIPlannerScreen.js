import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, SafeAreaView,
} from 'react-native';
import api from '../lib/api';
import { C } from '../theme';

const ACTIVITIES = [
  { e: '🏖️', l: 'beach' }, { e: '🥾', l: 'hiking' }, { e: '🏛️', l: 'history' },
  { e: '🍜', l: 'food' },  { e: '🌃', l: 'nightlife' }, { e: '🛍️', l: 'shopping' },
  { e: '🌿', l: 'nature' }, { e: '🤸', l: 'adventure' }, { e: '📸', l: 'photography' },
  { e: '🎭', l: 'culture' },
];
const COMPANIONS = [
  { e: '🧘', l: 'solo' }, { e: '💑', l: 'couple' },
  { e: '👨‍👩‍👧', l: 'family' }, { e: '👯', l: 'group' },
];

function DayCard({ day, dayNum }) {
  const [open, setOpen] = useState(dayNum === 1);
  const activities = day.activities ?? day.items ?? [];
  return (
    <View style={s.dayCard}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} style={s.dayHeader}>
        <View>
          <Text style={s.dayLabel}>Day {dayNum}</Text>
          {day.theme && <Text style={s.dayTheme}>{day.theme}</Text>}
        </View>
        <Text style={{ color: C.primary, fontSize: 18 }}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && activities.map((a, i) => (
        <View key={i} style={s.actItem}>
          {a.time && <Text style={s.actTime}>{a.time}</Text>}
          <View style={{ flex: 1 }}>
            <Text style={s.actTitle}>{a.activity ?? a.title ?? a.name ?? (typeof a === 'string' ? a : JSON.stringify(a))}</Text>
            {a.description && <Text style={s.actDesc}>{a.description}</Text>}
            {a.location && <Text style={s.actLocation}>📍 {a.location}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function AIPlannerScreen() {
  const [form, setForm] = useState({
    destination: '', fromDate: '', toDate: '',
    activityPreferences: [], companion: 'solo',
  });
  const [loading, setLoading]   = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError]         = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleActivity = a => set('activityPreferences',
    form.activityPreferences.includes(a)
      ? form.activityPreferences.filter(x => x !== a)
      : [...form.activityPreferences, a]
  );

  async function generate() {
    if (!form.destination || !form.fromDate || !form.toDate) {
      setError('Destination and dates are required.'); return;
    }
    setError(''); setLoading(true); setItinerary(null);
    try {
      const r = await api.post('/ai-planner/generate', {
        destination: form.destination,
        fromDate: form.fromDate,
        toDate: form.toDate,
        activityPreferences: form.activityPreferences,
        companion: form.companion,
      });
      setItinerary(r.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not generate itinerary. Try again.');
    } finally { setLoading(false); }
  }

  const days = itinerary?.days ?? itinerary?.itinerary ?? [];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {!itinerary && (
          <View style={s.form}>
            <Text style={s.sectionH}>🗺️ Destination</Text>
            <TextInput
              style={s.input}
              placeholder="Where do you want to go?"
              placeholderTextColor={C.muted}
              value={form.destination}
              onChangeText={v => set('destination', v)}
            />

            <Text style={s.sectionH}>📅 Travel Dates</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>FROM (YYYY-MM-DD)</Text>
                <TextInput style={s.input} placeholder="2025-12-20" placeholderTextColor={C.muted} value={form.fromDate} onChangeText={v => set('fromDate', v)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>TO (YYYY-MM-DD)</Text>
                <TextInput style={s.input} placeholder="2025-12-27" placeholderTextColor={C.muted} value={form.toDate} onChangeText={v => set('toDate', v)} />
              </View>
            </View>

            <Text style={s.sectionH}>🎯 Activities</Text>
            <View style={s.chipGrid}>
              {ACTIVITIES.map(({ e, l }) => {
                const sel = form.activityPreferences.includes(l);
                return (
                  <TouchableOpacity key={l} onPress={() => toggleActivity(l)} style={[s.chip, sel && s.chipSel]}>
                    <Text style={[s.chipTxt, sel && s.chipTxtSel]}>{e} {l}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.sectionH}>👥 Traveling with</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {COMPANIONS.map(({ e, l }) => (
                <TouchableOpacity key={l} onPress={() => set('companion', l)} style={[s.companionBtn, form.companion === l && s.companionBtnSel]}>
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                  <Text style={[s.companionTxt, form.companion === l && { color: C.primary }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {!!error && <View style={s.errBox}><Text style={s.errTxt}>{error}</Text></View>}

            <TouchableOpacity style={[s.genBtn, loading && { opacity: 0.6 }]} onPress={generate} disabled={loading}>
              {loading
                ? <><ActivityIndicator color="#fff" size="small" /><Text style={[s.genTxt, { marginLeft: 10 }]}>Generating…</Text></>
                : <Text style={s.genTxt}>🤖 Generate Itinerary</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {itinerary && (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={s.resultHeader}>
              <View>
                <Text style={s.resultTitle}>{itinerary.destination ?? form.destination}</Text>
                {itinerary.summary && <Text style={s.resultSub}>{itinerary.summary}</Text>}
                <Text style={s.resultDates}>{form.fromDate} → {form.toDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setItinerary(null)} style={s.resetBtn}>
                <Text style={s.resetTxt}>Reset</Text>
              </TouchableOpacity>
            </View>
            {days.map((day, i) => <DayCard key={i} day={day} dayNum={i + 1} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  form:       { padding: 16 },
  sectionH:   { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12, marginTop: 8 },
  label:      { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, color: C.text, fontSize: 14, marginBottom: 14 },

  chipGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip:       { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipSel:    { backgroundColor: 'rgba(59,130,246,.15)', borderColor: 'rgba(59,130,246,.4)' },
  chipTxt:    { fontSize: 13, color: C.muted, fontWeight: '600' },
  chipTxtSel: { color: C.primary },

  companionBtn:    { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  companionBtnSel: { backgroundColor: 'rgba(59,130,246,.12)', borderColor: 'rgba(59,130,246,.35)' },
  companionTxt:    { fontSize: 12, color: C.muted, marginTop: 4, fontWeight: '600', textTransform: 'capitalize' },

  errBox: { backgroundColor: 'rgba(239,68,68,.1)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,.25)' },
  errTxt: { color: '#f87171', fontSize: 13 },

  genBtn:  { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  genTxt:  { color: '#fff', fontWeight: '800', fontSize: 16 },

  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, marginTop: 8 },
  resultTitle:  { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  resultSub:    { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 18 },
  resultDates:  { fontSize: 12, color: C.primary, marginTop: 6, fontWeight: '600' },
  resetBtn:     { backgroundColor: C.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  resetTxt:     { color: C.muted, fontWeight: '700', fontSize: 13 },

  dayCard:   { backgroundColor: C.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  dayLabel:  { fontSize: 14, fontWeight: '800', color: C.primary },
  dayTheme:  { fontSize: 13, color: C.text, fontWeight: '600', marginTop: 2 },

  actItem:    { flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  actTime:    { fontSize: 11, color: C.accent, fontWeight: '700', width: 48, marginTop: 1 },
  actTitle:   { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  actDesc:    { fontSize: 12, color: C.muted, lineHeight: 17 },
  actLocation:{ fontSize: 11, color: C.primary, marginTop: 4 },
});
