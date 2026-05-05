import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, SafeAreaView,
} from 'react-native';
import api from '../lib/api';
import { C } from '../theme';

const TEMPLATES = ['general', 'beach', 'mountain', 'city'];
const TEMPLATE_EMOJI = { general: '🎒', beach: '🏖️', mountain: '⛰️', city: '🏙️' };

export default function JournalPackingScreen({ route }) {
  const { journalId } = route.params;
  const [lists, setLists]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [listName, setListName]     = useState('');
  const [template, setTemplate]     = useState('general');
  const [addingItem, setAddingItem] = useState(null);
  const [newItem, setNewItem]       = useState('');

  async function load() {
    try {
      const r = await api.get(`/journals/${journalId}/packing`);
      setLists(r.data);
    } catch {/* silent */}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [journalId]);

  async function createList() {
    if (!listName.trim()) { Alert.alert('Required', 'List name is required.'); return; }
    setCreating(true);
    try {
      await api.post(`/journals/${journalId}/packing`, { name: listName.trim(), template });
      setShowCreate(false);
      setListName('');
      await load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not create list.');
    } finally { setCreating(false); }
  }

  async function toggleItem(listId, itemId, packed) {
    try {
      await api.patch(`/journals/${journalId}/packing/${listId}/items/${itemId}/toggle`);
      setLists(prev => prev.map(l =>
        l.id === listId
          ? { ...l, items: l.items.map(it => it.id === itemId ? { ...it, packed: !packed } : it) }
          : l
      ));
    } catch {/* silent */}
  }

  async function addItem(listId) {
    if (!newItem.trim()) return;
    try {
      await api.post(`/journals/${journalId}/packing/${listId}/items`, { name: newItem.trim() });
      setNewItem('');
      setAddingItem(null);
      await load();
    } catch {/* silent */}
  }

  async function deleteList(listId) {
    Alert.alert('Delete list', 'Remove this packing list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/journals/${journalId}/packing/${listId}`);
          setLists(p => p.filter(l => l.id !== listId));
        } catch {/* silent */}
      }},
    ]);
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {lists.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48 }}>🎒</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 8 }}>No packing lists yet</Text>
            <Text style={{ color: C.muted, textAlign: 'center', marginBottom: 24 }}>Create a list from a template or from scratch</Text>
            <TouchableOpacity style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99 }} onPress={() => setShowCreate(true)}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Create List</Text>
            </TouchableOpacity>
          </View>
        )}

        {lists.map(list => {
          const items = list.items ?? [];
          const packed = items.filter(i => i.packed).length;
          const pct = items.length > 0 ? packed / items.length : 0;
          return (
            <View key={list.id} style={s.listCard}>
              {/* List header */}
              <View style={s.listHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.listName}>{list.name}</Text>
                  <Text style={s.listMeta}>{packed}/{items.length} packed</Text>
                </View>
                <TouchableOpacity onPress={() => deleteList(list.id)} style={{ padding: 4 }}>
                  <Text style={{ color: C.danger, fontSize: 18 }}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              {items.length > 0 && (
                <View style={{ height: 4, backgroundColor: C.border, borderRadius: 99, marginHorizontal: 14, marginBottom: 10, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${pct * 100}%`, backgroundColor: pct === 1 ? C.accent : C.primary, borderRadius: 99 }} />
                </View>
              )}

              {/* Items */}
              {items.map(item => (
                <TouchableOpacity key={item.id} onPress={() => toggleItem(list.id, item.id, item.packed)} style={s.itemRow}>
                  <View style={[s.checkbox, item.packed && s.checkboxDone]}>
                    {item.packed && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>}
                  </View>
                  <Text style={[s.itemName, item.packed && s.itemNameDone]}>{item.name}</Text>
                  {item.essential && <Text style={s.essentialBadge}>Essential</Text>}
                </TouchableOpacity>
              ))}

              {/* Add item */}
              {addingItem === list.id ? (
                <View style={s.addItemRow}>
                  <TextInput
                    style={s.addItemInput}
                    placeholder="Item name…"
                    placeholderTextColor={C.muted}
                    value={newItem}
                    onChangeText={setNewItem}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => addItem(list.id)} style={s.addItemBtn}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setAddingItem(null); setNewItem(''); }} style={{ padding: 8 }}>
                    <Text style={{ color: C.muted }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setAddingItem(list.id)} style={s.addItemTrigger}>
                  <Text style={{ color: C.primary, fontWeight: '600', fontSize: 13 }}>+ Add item</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {lists.length > 0 && (
        <TouchableOpacity style={s.fab} onPress={() => setShowCreate(true)}>
          <Text style={s.fabTxt}>+ New List</Text>
        </TouchableOpacity>
      )}

      {/* Create List Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>New Packing List</Text>

            <Text style={s.label}>LIST NAME</Text>
            <TextInput style={s.inp} placeholder="e.g. Clothes" placeholderTextColor={C.muted} value={listName} onChangeText={setListName} />

            <Text style={s.label}>START FROM TEMPLATE</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {TEMPLATES.map(t => (
                <TouchableOpacity key={t} onPress={() => setTemplate(t)} style={[s.tmplBtn, template === t && s.tmplBtnSel]}>
                  <Text style={{ fontSize: 20 }}>{TEMPLATE_EMOJI[t]}</Text>
                  <Text style={[s.tmplTxt, template === t && { color: C.primary }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={{ color: C.muted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.createBtn, creating && { opacity: 0.6 }]} onPress={createList} disabled={creating}>
                <Text style={s.createTxt}>{creating ? 'Creating…' : 'Create List'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  listCard:   { backgroundColor: C.card, borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  listHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 8 },
  listName:   { fontSize: 16, fontWeight: '700', color: C.text },
  listMeta:   { fontSize: 12, color: C.muted, marginTop: 2 },

  itemRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  checkbox:    { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxDone:{ backgroundColor: C.accent, borderColor: C.accent },
  itemName:    { flex: 1, fontSize: 14, color: C.text, fontWeight: '500' },
  itemNameDone:{ textDecorationLine: 'line-through', color: C.muted },
  essentialBadge: { fontSize: 10, color: C.warning, fontWeight: '700', backgroundColor: 'rgba(245,158,11,.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  addItemRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, gap: 8, borderTopWidth: 1, borderTopColor: C.border },
  addItemInput:   { flex: 1, backgroundColor: C.bg, borderRadius: 10, padding: 10, color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border },
  addItemBtn:     { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addItemTrigger: { padding: 14, borderTopWidth: 1, borderTopColor: C.border },

  fab:    { position: 'absolute', bottom: 24, right: 20, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 99, elevation: 6 },
  fabTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal:      { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: C.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 20 },

  label: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  inp:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, color: C.text, fontSize: 14, marginBottom: 16 },

  tmplBtn:    { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tmplBtnSel: { backgroundColor: 'rgba(59,130,246,.12)', borderColor: 'rgba(59,130,246,.35)' },
  tmplTxt:    { fontSize: 12, color: C.muted, marginTop: 4, fontWeight: '600', textTransform: 'capitalize' },

  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  createBtn: { flex: 2, padding: 14, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center' },
  createTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
