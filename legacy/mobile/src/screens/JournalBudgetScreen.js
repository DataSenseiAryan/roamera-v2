import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, SafeAreaView,
} from 'react-native';
import api from '../lib/api';
import { C } from '../theme';

const CATS = [
  { k: 'accommodation', e: '🏨' }, { k: 'food',      e: '🍜' },
  { k: 'transport',     e: '🚗' }, { k: 'activities', e: '🎯' },
  { k: 'shopping',      e: '🛍️' }, { k: 'other',      e: '💳' },
];

const CAT_COLORS = {
  accommodation: '#3b82f6', food: '#f59e0b', transport: '#10b981',
  activities: '#8b5cf6', shopping: '#ec4899', other: '#94a3b8',
};

export default function JournalBudgetScreen({ route }) {
  const { journalId } = route.params;
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [adding, setAdding]       = useState(false);
  const [form, setForm]           = useState({ title: '', amount: '', category: 'food', date: '', notes: '' });

  async function load() {
    try {
      const r = await api.get(`/journals/${journalId}/budget`);
      setEntries(r.data);
    } catch {/* silent */}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [journalId]);

  async function addEntry() {
    if (!form.title.trim() || !form.amount) { Alert.alert('Required', 'Title and amount needed.'); return; }
    setAdding(true);
    try {
      await api.post(`/journals/${journalId}/budget`, {
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date || new Date().toISOString().slice(0, 10),
        notes: form.notes || undefined,
      });
      setShowAdd(false);
      setForm({ title: '', amount: '', category: 'food', date: '', notes: '' });
      await load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not add entry.');
    } finally { setAdding(false); }
  }

  async function deleteEntry(entryId) {
    Alert.alert('Delete', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/journals/${journalId}/budget/${entryId}`);
          setEntries(p => p.filter(e => e.id !== entryId));
        } catch {/* silent */}
      }},
    ]);
  }

  const total = entries.reduce((s, e) => s + (e.amount ?? 0), 0);
  const byCategory = CATS.map(({ k, e }) => ({
    key: k, emoji: e,
    total: entries.filter(en => en.category === k).reduce((s, en) => s + (en.amount ?? 0), 0),
    color: CAT_COLORS[k],
  })).filter(c => c.total > 0);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* Total */}
        <View style={s.totalBox}>
          <Text style={s.totalLabel}>TOTAL SPENT</Text>
          <Text style={s.totalAmt}>₹{total.toFixed(2)}</Text>
          <Text style={s.totalMeta}>{entries.length} expense{entries.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionH}>By Category</Text>
            {byCategory.map(c => {
              const pct = total > 0 ? c.total / total : 0;
              return (
                <View key={c.key} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>{c.emoji} {c.key}</Text>
                    <Text style={{ color: C.muted, fontSize: 13 }}>₹{c.total.toFixed(2)} ({(pct * 100).toFixed(0)}%)</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: C.border, borderRadius: 99, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct * 100}%`, backgroundColor: c.color, borderRadius: 99 }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Expenses list */}
        <View style={s.section}>
          <Text style={s.sectionH}>Expenses</Text>
          {entries.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ fontSize: 36 }}>🧾</Text>
              <Text style={{ color: C.muted, marginTop: 10 }}>No expenses yet</Text>
            </View>
          )}
          {entries.map(e => (
            <View key={e.id} style={s.expRow}>
              <View style={[s.expDot, { backgroundColor: CAT_COLORS[e.category] ?? C.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.expTitle}>{e.title}</Text>
                <Text style={s.expMeta}>{e.category}{e.date ? ` · ${e.date}` : ''}{e.notes ? ` · ${e.notes}` : ''}</Text>
              </View>
              <Text style={s.expAmt}>₹{(e.amount ?? 0).toFixed(2)}</Text>
              <TouchableOpacity onPress={() => deleteEntry(e.id)} style={{ padding: 8, marginLeft: 4 }}>
                <Text style={{ color: C.danger, fontSize: 16 }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => setShowAdd(true)}>
        <Text style={s.fabTxt}>+ Add Expense</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>New Expense</Text>

            <Text style={s.label}>TITLE *</Text>
            <TextInput style={s.inp} placeholder="e.g. Hotel stay" placeholderTextColor={C.muted} value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} />

            <Text style={s.label}>AMOUNT (INR) *</Text>
            <TextInput style={s.inp} placeholder="0.00" placeholderTextColor={C.muted} value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))} keyboardType="decimal-pad" />

            <Text style={s.label}>DATE (YYYY-MM-DD)</Text>
            <TextInput style={s.inp} placeholder={new Date().toISOString().slice(0, 10)} placeholderTextColor={C.muted} value={form.date} onChangeText={v => setForm(p => ({ ...p, date: v }))} />

            <Text style={s.label}>CATEGORY</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {CATS.map(({ k, e }) => (
                <TouchableOpacity key={k} onPress={() => setForm(p => ({ ...p, category: k }))} style={[s.catBtn, form.category === k && { backgroundColor: CAT_COLORS[k] + '33', borderColor: CAT_COLORS[k] }]}>
                  <Text style={[{ color: C.muted, fontWeight: '600', fontSize: 13 }, form.category === k && { color: CAT_COLORS[k] }]}>{e} {k}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={{ color: C.muted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.addBtn, adding && { opacity: 0.6 }]} onPress={addEntry} disabled={adding}>
                <Text style={s.addTxt}>{adding ? 'Adding…' : 'Add Expense'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  totalBox:   { backgroundColor: C.primaryDark, borderRadius: 20, padding: 24, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,.2)' },
  totalLabel: { fontSize: 11, color: '#93c5fd', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  totalAmt:   { fontSize: 36, fontWeight: '800', color: '#fff' },
  totalMeta:  { fontSize: 13, color: '#93c5fd', marginTop: 4 },

  section:  { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  sectionH: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 16 },

  expRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  expDot:   { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  expTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  expMeta:  { fontSize: 11, color: C.muted, marginTop: 2, textTransform: 'capitalize' },
  expAmt:   { fontSize: 15, fontWeight: '700', color: C.text },

  fab:    { position: 'absolute', bottom: 24, right: 20, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 99, elevation: 6 },
  fabTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:      { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: C.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 20 },

  label: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  inp:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, color: C.text, fontSize: 14, marginBottom: 16 },

  catBtn:    { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  addBtn:    { flex: 2, padding: 14, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center' },
  addTxt:    { color: '#fff', fontWeight: '800', fontSize: 15 },
});
