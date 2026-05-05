import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, SafeAreaView,
} from 'react-native';
import api from '../lib/api';
import { C } from '../theme';

function Avatar({ name, size = 44 }) {
  const hue = name ? (name.charCodeAt(0) * 37) % 360 : 210;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue},45%,22%)`, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: size * 0.38 }}>{name ? name[0].toUpperCase() : '?'}</Text>
    </View>
  );
}

function UserRow({ item, onPress }) {
  return (
    <TouchableOpacity style={s.row} onPress={() => onPress(item)}>
      <Avatar name={item.username} size={48} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={s.rowTitle}>@{item.username}</Text>
        {item.bio ? <Text style={s.rowSub} numberOfLines={1}>{item.bio}</Text> : null}
        <Text style={s.rowMeta}>{item._count?.followers ?? 0} followers · {item._count?.journals ?? 0} journals</Text>
      </View>
      <Text style={{ color: C.primary, fontSize: 20 }}>›</Text>
    </TouchableOpacity>
  );
}

function JournalRow({ item, onPress }) {
  const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return (
    <TouchableOpacity style={s.row} onPress={() => onPress(item)}>
      <View style={s.journalIcon}><Text style={{ fontSize: 24 }}>🌍</Text></View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.rowTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={s.rowSub}>📍 {item.destination}{item.startDate ? ` · ${fmt(item.startDate)}` : ''}</Text>
        <Text style={s.rowMeta}>by @{item.user?.username}</Text>
      </View>
    </TouchableOpacity>
  );
}

const TABS = ['Users', 'Journals'];

export default function SearchScreen({ navigation }) {
  const [tab, setTab]         = useState(0);
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q, t = tab) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const type = t === 0 ? 'users' : 'journals';
      const res = await api.get(`/search?q=${encodeURIComponent(q)}&type=${type}`);
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  function handleTabChange(i) {
    setTab(i);
    setResults([]);
    if (query.trim()) search(query, i);
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Search bar */}
      <View style={s.searchWrap}>
        <Text style={{ color: C.muted, marginRight: 8, fontSize: 16 }}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={q => { setQuery(q); search(q); }}
          placeholder={tab === 0 ? 'Search travelers…' : 'Search journals & destinations…'}
          placeholderTextColor={C.muted}
          style={s.searchInput}
          autoCapitalize="none"
          autoFocus
          returnKeyType="search"
        />
        {!!query && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Text style={{ color: C.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} onPress={() => handleTabChange(i)} style={[s.tab, tab === i && s.tabActive]}>
            <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) =>
            tab === 0
              ? <UserRow item={item} onPress={u => navigation.navigate('UserProfile', { id: u.id, username: u.username })} />
              : <JournalRow item={item} onPress={j => navigation.navigate('JournalDetail', { id: j.id })} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48 }}>
                {query ? (tab === 0 ? '👤' : '📓') : '🔍'}
              </Text>
              <Text style={s.emptyTxt}>
                {query ? `No ${tab === 0 ? 'users' : 'journals'} found for "${query}"` : `Search ${tab === 0 ? 'travelers' : 'destinations & journals'}`}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 13, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, color: C.text, fontSize: 15, padding: 0 },

  tabs:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  tab:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:    { borderBottomWidth: 2, borderBottomColor: C.primary },
  tabTxt:       { fontSize: 14, fontWeight: '600', color: C.muted },
  tabTxtActive: { color: C.primary },

  row:         { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  rowTitle:    { fontSize: 15, fontWeight: '700', color: C.text },
  rowSub:      { fontSize: 13, color: C.muted, marginTop: 2 },
  rowMeta:     { fontSize: 11, color: C.dim, marginTop: 3 },
  journalIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#0c1e35', justifyContent: 'center', alignItems: 'center' },

  empty:    { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTxt: { color: C.muted, marginTop: 16, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
