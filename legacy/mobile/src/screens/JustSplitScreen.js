import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, SafeAreaView,
  StatusBar, RefreshControl, ScrollView,
} from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD'];

function GroupCard({ item, onPress }) {
  const balance = item.myBalance ?? 0;
  return (
    <TouchableOpacity style={s.card} onPress={() => onPress(item)} activeOpacity={0.85}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={s.groupName}>{item.name}</Text>
          {item.description ? <Text style={s.groupDesc} numberOfLines={1}>{item.description}</Text> : null}
          <Text style={s.groupMeta}>
            {item.currency} · {item._count?.members ?? item.members?.length ?? 0} member{(item._count?.members ?? 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {balance !== 0 && (
            <Text style={[s.balance, { color: balance > 0 ? C.accent : C.danger }]}>
              {balance > 0 ? '+' : ''}{item.currency} {Math.abs(balance).toFixed(2)}
            </Text>
          )}
          {balance === 0 && <Text style={[s.balance, { color: C.muted }]}>Settled ✓</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function JustSplitScreen({ navigation }) {
  const { user } = useAuth();
  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [form, setForm]             = useState({ name: '', description: '', currency: 'INR' });

  async function load() {
    try {
      const r = await api.get('/justsplit');
      setGroups(r.data);
    } catch {/* silent */}
    finally { setLoading(false); }
  }

  useEffect(() => { if (user) load(); else setLoading(false); }, [user]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function createGroup() {
    if (!form.name.trim()) { Alert.alert('Required', 'Group name is required.'); return; }
    setCreating(true);
    try {
      const r = await api.post('/justsplit', { name: form.name.trim(), description: form.description, currency: form.currency });
      setGroups(p => [r.data, ...p]);
      setShowCreate(false);
      setForm({ name: '', description: '', currency: 'INR' });
      navigation.navigate('JustSplitDetail', { id: r.data.id, name: r.data.name });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not create group.');
    } finally { setCreating(false); }
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8, textAlign: 'center' }}>Sign in to use JustSplit</Text>
        <Text style={{ fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 24 }}>Split expenses with friends on your trips</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.heading}>JustSplit</Text>
          <Text style={s.sub}>Split expenses with friends</Text>
        </View>
        <TouchableOpacity style={s.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={s.createTxt}>+ New Group</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <GroupCard item={item} onPress={g => navigation.navigate('JustSplitDetail', { id: g.id, name: g.name })} />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48 }}>💰</Text>
              <Text style={s.emptyTxt}>No expense groups yet</Text>
              <TouchableOpacity style={{ marginTop: 16, backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99 }} onPress={() => setShowCreate(true)}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Create Group</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>New Expense Group</Text>

            <Text style={s.label}>GROUP NAME *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Bali Trip 2025"
              placeholderTextColor={C.muted}
              value={form.name}
              onChangeText={v => setForm(p => ({ ...p, name: v }))}
            />

            <Text style={s.label}>DESCRIPTION</Text>
            <TextInput
              style={[s.input, { minHeight: 70, textAlignVertical: 'top' }]}
              placeholder="Optional description…"
              placeholderTextColor={C.muted}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              multiline
            />

            <Text style={s.label}>CURRENCY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {CURRENCIES.map(cur => (
                <TouchableOpacity key={cur} onPress={() => setForm(p => ({ ...p, currency: cur }))} style={[s.curBtn, form.currency === cur && s.curBtnSel]}>
                  <Text style={[s.curTxt, form.currency === cur && { color: C.primary }]}>{cur}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={{ color: C.muted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.submitBtn, creating && { opacity: 0.6 }]} onPress={createGroup} disabled={creating}>
                <Text style={s.submitTxt}>{creating ? 'Creating…' : 'Create Group'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  heading:{ fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  sub:    { fontSize: 13, color: C.muted, marginTop: 3 },
  createBtn: { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99 },
  createTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  card:       { marginHorizontal: 16, marginBottom: 12, padding: 16, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border },
  groupName:  { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  groupDesc:  { fontSize: 13, color: C.muted, marginBottom: 6 },
  groupMeta:  { fontSize: 12, color: C.dim },
  balance:    { fontSize: 16, fontWeight: '800', marginBottom: 4 },

  empty:    { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTxt: { color: C.muted, fontSize: 16, marginTop: 16, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: C.border },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 20 },

  label: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, color: C.text, fontSize: 14, marginBottom: 16 },

  curBtn:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginRight: 8 },
  curBtnSel: { backgroundColor: 'rgba(59,130,246,.15)', borderColor: 'rgba(59,130,246,.4)' },
  curTxt:    { fontWeight: '700', color: C.muted, fontSize: 13 },

  cancelBtn:  { flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  submitBtn:  { flex: 2, padding: 14, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center' },
  submitTxt:  { color: '#fff', fontWeight: '800', fontSize: 15 },
});
