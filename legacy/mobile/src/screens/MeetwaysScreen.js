import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, ScrollView,
  Alert, StatusBar, SafeAreaView,
} from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

const FILTERS = ['All', 'Adventure', 'Backpacking', 'Chill', 'Culture', 'Luxury', 'Nature', 'Food', 'Party'];

const CARD_COLORS = {
  adventure: '#0f2d1a', backpacking: '#2d1500', party: '#1a0d2e',
  luxury: '#0d2040', nature: '#0d2218', food: '#2d1800', default: '#0d1829',
};

function cardBg(tags = []) {
  for (const k of Object.keys(CARD_COLORS)) {
    if (tags.map(t => t.toLowerCase()).includes(k)) return CARD_COLORS[k];
  }
  return CARD_COLORS.default;
}

function Avatar({ name, size = 28 }) {
  const hue = name ? (name.charCodeAt(0) * 37) % 360 : 210;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue},45%,25%)`, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: size * 0.38 }}>{name ? name[0].toUpperCase() : '?'}</Text>
    </View>
  );
}

function StatusPill({ status }) {
  const cfg = {
    open:      { label: 'Open',      color: '#22c55e' },
    joined:    { label: '✓ Joined',  color: C.primary },
    full:      { label: 'Full',      color: C.warning },
    requested: { label: '⏳ Pending', color: '#60a5fa' },
  }[status] ?? { label: 'Open', color: '#22c55e' };
  return (
    <View style={{ borderRadius: 99, borderWidth: 1, borderColor: cfg.color + '55', paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

function MeetwayCard({ item, onPress, onJoin }) {
  const [busy, setBusy]     = useState(false);
  const [status, setStatus] = useState('open');
  const tags     = item.tags ?? [];
  const taken    = item.spotsTaken ?? 0;
  const spotsLeft = item.spotsLeft ?? (item.maxPeople - taken);
  const pct      = Math.min((taken / item.maxPeople) * 100, 100);
  const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  async function handleJoin() {
    setBusy(true);
    const ok = await onJoin(item.id, item.privacy);
    if (ok) setStatus(item.privacy === 'private' ? 'requested' : 'joined');
    setBusy(false);
  }

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => onPress(item)} style={s.card}>
      <View style={[s.cardCover, { backgroundColor: cardBg(tags) }]}>
        <View style={s.cardOverlay} />
        {item.privacy === 'private' && (
          <View style={s.privBadge}><Text style={s.privTxt}>🔒 Private</Text></View>
        )}
        <View style={s.cardTitleWrap}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.cardSub}>📍 {item.destination}</Text>
        </View>
      </View>

      <View style={s.cardBody}>
        <View style={s.row}>
          <Text style={s.meta}>📅 {fmt(item.startDate)} – {fmt(item.endDate)}</Text>
          <StatusPill status={status} />
        </View>

        <View style={{ marginVertical: 8 }}>
          <View style={s.row}>
            <Text style={s.spotLabel}>TRAVELERS</Text>
            <Text style={[s.spotCount, { color: spotsLeft === 0 ? C.warning : C.primary }]}>
              {taken}/{item.maxPeople}
            </Text>
          </View>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${pct}%`, backgroundColor: spotsLeft === 0 ? C.warning : C.primary }]} />
          </View>
        </View>

        {(item.budgetMin || item.budgetMax) && (
          <Text style={s.budget}>₹{item.budgetMin ?? '?'} – ₹{item.budgetMax ?? '?'} <Text style={{ fontSize: 11, color: C.dim }}>/person</Text></Text>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 10 }}>
          {tags.slice(0, 4).map(t => (
            <View key={t} style={s.tag}><Text style={s.tagTxt}>#{t}</Text></View>
          ))}
        </ScrollView>

        <View style={s.row}>
          <View style={s.row}>
            <Avatar name={item.host?.username} size={24} />
            <Text style={[s.meta, { marginLeft: 6 }]}>@{item.host?.username}</Text>
          </View>
          <TouchableOpacity
            onPress={handleJoin}
            disabled={status !== 'open' || busy}
            style={[s.joinBtn, status !== 'open' && s.joinBtnDim]}
          >
            <Text style={[s.joinTxt, status !== 'open' && { color: C.primary }]}>
              {busy ? '…' : status === 'joined' ? '✓ Joined' : status === 'requested' ? 'Pending' : status === 'full' ? 'Full' : item.privacy === 'private' ? 'Request' : 'Join ✦'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MeetwaysScreen({ navigation }) {
  const { user } = useAuth();
  const [meetways, setMeetways]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [search, setSearch]             = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);

  const loadData = useCallback(async (reset = false, s = search, f = activeFilter) => {
    try {
      const p = reset ? 1 : page;
      const params = new URLSearchParams({ page: p });
      if (f !== 'All') params.set('tag', f.toLowerCase());
      if (s)           params.set('search', s);
      const res = await api.get(`/meetways?${params}`);
      setMeetways(prev => reset ? res.data : [...prev, ...res.data]);
      setHasMore(res.data.length === 20);
      if (reset) setPage(1);
    } catch {/* silent */}
  }, [page, search, activeFilter]);

  useEffect(() => {
    setLoading(true);
    loadData(true).finally(() => setLoading(false));
  }, [activeFilter]); // eslint-disable-line

  async function handleRefresh() {
    setRefreshing(true);
    await loadData(true, search, activeFilter);
    setRefreshing(false);
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setPage(n => n + 1);
    await loadData(false);
    setLoadingMore(false);
  }

  async function handleSearch(text) {
    setSearch(text);
    await loadData(true, text, activeFilter);
  }

  async function handleJoin(id, privacy) {
    if (!user) { navigation.navigate('Login'); return false; }
    try {
      await api.post(`/meetways/${id}/join`);
      return true;
    } catch (err) {
      if (err.response?.status === 400) return true;
      Alert.alert('Could not join', err.response?.data?.error || 'Please try again.');
      return false;
    }
  }

  const Header = (
    <View>
      <View style={s.header}>
        <View>
          <Text style={s.heading}>Meetways</Text>
          <Text style={s.subheading}>Find your travel crew</Text>
        </View>
        <TouchableOpacity
          onPress={() => user ? navigation.navigate('CreateMeetway') : navigation.navigate('Login')}
          style={s.createBtn}
        >
          <Text style={s.createTxt}>+ Create</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchBar}>
        <Text style={{ color: C.muted, marginRight: 8 }}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search meetways…"
          placeholderTextColor={C.muted}
          style={s.searchInput}
        />
        {!!search && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={{ color: C.muted }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} style={[s.filterPill, activeFilter === f && s.filterPillActive]}>
            <Text style={[s.filterTxt, activeFilter === f && s.filterTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.resultCount}>{loading ? 'Loading…' : `${meetways.length} meetway${meetways.length !== 1 ? 's' : ''}`}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={meetways}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <MeetwayCard
              item={item}
              onPress={m => navigation.navigate('MeetwayDetail', { id: m.id, title: m.title })}
              onJoin={handleJoin}
            />
          )}
          ListHeaderComponent={Header}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🗺️</Text>
              <Text style={{ color: C.muted, fontSize: 15 }}>No meetways found.</Text>
              <TouchableOpacity onPress={() => { setActiveFilter('All'); setSearch(''); }}>
                <Text style={{ color: C.primary, marginTop: 10, fontWeight: '700' }}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={C.primary} style={{ margin: 20 }} />
              : !hasMore && meetways.length > 0
                ? <Text style={{ textAlign: 'center', color: C.dim, fontSize: 13, marginVertical: 24 }}>· All meetways loaded ·</Text>
                : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  heading:    { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  subheading: { fontSize: 13, color: C.muted, marginTop: 3 },
  createBtn:  { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 99, backgroundColor: C.primary },
  createTxt:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  searchBar:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 14, padding: 11, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, color: C.text, fontSize: 14, padding: 0 },

  filterPill:       { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, marginRight: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  filterPillActive: { backgroundColor: 'rgba(59,130,246,.2)', borderColor: 'rgba(59,130,246,.5)' },
  filterTxt:        { fontSize: 13, fontWeight: '600', color: C.muted },
  filterTxtActive:  { color: C.primary },

  resultCount: { paddingHorizontal: 16, marginBottom: 10, fontSize: 12, color: C.muted, fontWeight: '600' },

  card:        { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  cardCover:   { height: 140, justifyContent: 'flex-end' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,17,31,.6)' },
  cardTitleWrap: { padding: 12 },
  cardTitle:   { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  cardSub:     { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  privBadge:   { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,.5)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  privTxt:     { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  cardBody:  { padding: 14 },
  row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta:      { fontSize: 12, color: C.muted },

  spotLabel: { fontSize: 10, color: C.dim, fontWeight: '700', letterSpacing: 0.5 },
  spotCount: { fontSize: 11, fontWeight: '700' },
  barBg:     { height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.07)', marginTop: 4, overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: 99 },

  budget: { fontSize: 14, fontWeight: '700', color: C.accent, marginTop: 4 },

  tag:    { borderRadius: 99, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 3, marginRight: 6, backgroundColor: C.card },
  tagTxt: { fontSize: 11, color: C.muted, fontWeight: '600' },

  joinBtn:    { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 99, backgroundColor: C.primary },
  joinBtnDim: { backgroundColor: 'rgba(59,130,246,.1)' },
  joinTxt:    { color: '#fff', fontWeight: '700', fontSize: 12 },

  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 20 },
});
