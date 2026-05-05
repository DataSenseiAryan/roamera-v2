import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, SafeAreaView,
} from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

const CATS = ['food', 'transport', 'accommodation', 'activities', 'shopping', 'general'];
const TABS = ['Overview', 'Expenses', 'Members'];

function Avatar({ name, size = 36 }) {
  const hue = name ? (name.charCodeAt(0) * 37) % 360 : 210;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue},45%,22%)`, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: size * 0.38 }}>{name ? name[0].toUpperCase() : '?'}</Text>
    </View>
  );
}

export default function JustSplitDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [group, setGroup]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState(0);
  const [showAdd, setShowAdd]   = useState(false);
  const [adding, setAdding]     = useState(false);
  const [expense, setExpense]   = useState({ title: '', amount: '', category: 'general', paidBy: '' });

  async function load() {
    try {
      const r = await api.get(`/justsplit/${id}`);
      setGroup(r.data);
    } catch { Alert.alert('Error', 'Could not load group.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function addExpense() {
    if (!expense.title.trim() || !expense.amount) {
      Alert.alert('Required', 'Title and amount are required.'); return;
    }
    setAdding(true);
    try {
      await api.post(`/justsplit/${id}/expenses`, {
        title: expense.title.trim(),
        amount: parseFloat(expense.amount),
        category: expense.category,
        paidBy: expense.paidBy || user?.username,
        splitAmong: group?.members?.map(m => m.user?.username ?? m.username) ?? [],
      });
      setShowAdd(false);
      setExpense({ title: '', amount: '', category: 'general', paidBy: '' });
      await load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not add expense.');
    } finally { setAdding(false); }
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
  if (!group) return null;

  const expenses = group.expenses ?? [];
  const members  = group.members ?? [];
  const total    = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const balances = members.map(m => {
    const name = m.user?.username ?? m.username ?? 'Unknown';
    const paid = expenses.filter(e => e.paidBy === name).reduce((s, e) => s + e.amount, 0);
    const share = total / (members.length || 1);
    return { name, paid, owes: share - paid };
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>

      {/* Tab bar */}
      <View style={s.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} onPress={() => setTab(i)} style={[s.tab, tab === i && s.tabActive]}>
            <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* Summary box */}
        <View style={s.summaryBox}>
          <Text style={s.summaryLabel}>Total Spent</Text>
          <Text style={s.summaryAmt}>{group.currency} {total.toFixed(2)}</Text>
          <Text style={s.summaryMeta}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''} · {members.length} member{members.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* OVERVIEW TAB */}
        {tab === 0 && (
          <>
            <Text style={s.sectionH}>Balances</Text>
            {balances.length === 0 && <Text style={{ color: C.muted, textAlign: 'center', marginTop: 20 }}>No members yet.</Text>}
            {balances.map((b, i) => (
              <View key={i} style={s.balRow}>
                <Avatar name={b.name} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.balName}>@{b.name}</Text>
                  <Text style={s.balMeta}>Paid: {group.currency} {b.paid.toFixed(2)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.balAmt, { color: b.owes > 0 ? C.danger : C.accent }]}>
                    {b.owes > 0 ? 'Owes ' : 'Gets back '}
                    {group.currency} {Math.abs(b.owes).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* EXPENSES TAB */}
        {tab === 1 && (
          <>
            <Text style={s.sectionH}>Expenses</Text>
            {expenses.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ fontSize: 36 }}>🧾</Text>
                <Text style={{ color: C.muted, marginTop: 12 }}>No expenses yet. Add the first one!</Text>
              </View>
            )}
            {expenses.map((e, i) => (
              <View key={i} style={s.expRow}>
                <View style={s.expIcon}><Text style={{ fontSize: 20 }}>
                  {({ food: '🍜', transport: '🚗', accommodation: '🏨', activities: '🎯', shopping: '🛍️', general: '💳' })[e.category] ?? '💳'}
                </Text></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.expTitle}>{e.title}</Text>
                  <Text style={s.expMeta}>Paid by {e.paidBy} · {e.category}</Text>
                </View>
                <Text style={s.expAmt}>{group.currency} {(e.amount ?? 0).toFixed(2)}</Text>
              </View>
            ))}
          </>
        )}

        {/* MEMBERS TAB */}
        {tab === 2 && (
          <>
            <Text style={s.sectionH}>Members ({members.length})</Text>
            {members.map((m, i) => {
              const name = m.user?.username ?? m.username ?? 'Unknown';
              return (
                <View key={i} style={s.memberRow}>
                  <Avatar name={name} size={44} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>@{name}</Text>
                    {m.role && <Text style={{ fontSize: 11, color: C.muted, marginTop: 2, fontWeight: '600', textTransform: 'uppercase' }}>{m.role}</Text>}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Add Expense FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowAdd(true)}>
        <Text style={s.fabTxt}>+ Add Expense</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Add Expense</Text>

            <Text style={s.label}>TITLE *</Text>
            <TextInput style={s.inp} placeholder="e.g. Dinner" placeholderTextColor={C.muted} value={expense.title} onChangeText={v => setExpense(p => ({ ...p, title: v }))} />

            <Text style={s.label}>AMOUNT *</Text>
            <TextInput style={s.inp} placeholder="0.00" placeholderTextColor={C.muted} value={expense.amount} onChangeText={v => setExpense(p => ({ ...p, amount: v }))} keyboardType="decimal-pad" />

            <Text style={s.label}>PAID BY</Text>
            <TextInput style={s.inp} placeholder={user?.username ?? 'username'} placeholderTextColor={C.muted} value={expense.paidBy} onChangeText={v => setExpense(p => ({ ...p, paidBy: v }))} autoCapitalize="none" />

            <Text style={s.label}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {CATS.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setExpense(p => ({ ...p, category: cat }))} style={[s.catBtn, expense.category === cat && s.catBtnSel]}>
                  <Text style={[s.catTxt, expense.category === cat && { color: C.primary }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={{ color: C.muted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.addBtn, adding && { opacity: 0.6 }]} onPress={addExpense} disabled={adding}>
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
  tabs:         { flexDirection: 'row', backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  tab:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:    { borderBottomWidth: 2, borderBottomColor: C.primary },
  tabTxt:       { fontSize: 14, fontWeight: '600', color: C.muted },
  tabTxtActive: { color: C.primary },

  summaryBox:   { backgroundColor: C.primaryDark, borderRadius: 18, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,.2)' },
  summaryLabel: { fontSize: 11, color: '#93c5fd', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  summaryAmt:   { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 4 },
  summaryMeta:  { fontSize: 13, color: '#93c5fd' },

  sectionH: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 },

  balRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  balName:  { fontSize: 14, fontWeight: '700', color: C.text },
  balMeta:  { fontSize: 12, color: C.muted, marginTop: 2 },
  balAmt:   { fontSize: 14, fontWeight: '700' },

  expRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  expIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(59,130,246,.1)', justifyContent: 'center', alignItems: 'center' },
  expTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  expMeta:  { fontSize: 12, color: C.muted },
  expAmt:   { fontSize: 16, fontWeight: '800', color: C.text },

  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },

  fab:    { position: 'absolute', bottom: 24, right: 20, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 99, elevation: 6 },
  fabTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:   { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: C.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 20 },

  label: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  inp:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, color: C.text, fontSize: 14, marginBottom: 16 },

  catBtn:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginRight: 8 },
  catBtnSel: { backgroundColor: 'rgba(59,130,246,.15)', borderColor: 'rgba(59,130,246,.4)' },
  catTxt:    { fontWeight: '700', color: C.muted, fontSize: 13, textTransform: 'capitalize' },

  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  addBtn:    { flex: 2, padding: 14, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center' },
  addTxt:    { color: '#fff', fontWeight: '800', fontSize: 15 },
});
