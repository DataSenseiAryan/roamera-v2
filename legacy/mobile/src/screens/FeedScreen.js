import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, ScrollView,
  StatusBar, SafeAreaView,
} from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

const REACTIONS = [
  { type: 'love',     emoji: '❤️' },
  { type: 'wanna_go', emoji: '📍' },
  { type: 'inspire',  emoji: '✨' },
];
const TABS = ['For You', 'Following'];

function Avatar({ name, size = 32 }) {
  const hue = name ? (name.charCodeAt(0) * 37) % 360 : 210;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue},45%,25%)`, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: size * 0.38 }}>{name ? name[0].toUpperCase() : '?'}</Text>
    </View>
  );
}

function DestCard({ item, onPress }) {
  const colors = ['#0f2440', '#0d2b1a', '#1a1833', '#1a2b0f', '#1a1010'];
  const bg = colors[item.id % colors.length];
  return (
    <TouchableOpacity onPress={() => onPress(item)} style={[s.destCard, { backgroundColor: bg }]} activeOpacity={0.85}>
      <Text style={s.destFlag}>🌍</Text>
      <Text style={s.destName} numberOfLines={1}>{item.name}</Text>
      <Text style={s.destCountry} numberOfLines={1}>{item.country}</Text>
    </TouchableOpacity>
  );
}

function JournalCard({ item, onPress, onProfilePress, onReact }) {
  const [reacting, setReacting] = useState(null);
  const photos = Array.isArray(item.photos) ? item.photos : [];
  const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  async function handleReact(type) {
    setReacting(type);
    await onReact(item.id, type);
    setReacting(null);
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(item)} style={s.card}>
      {photos.length > 0 ? (
        <Image source={{ uri: photos[0] }} style={s.photo} resizeMode="cover" />
      ) : (
        <View style={[s.photo, s.photoPlaceholder]}>
          <Text style={{ fontSize: 48 }}>🌍</Text>
        </View>
      )}

      <View style={s.cardBody}>
        <TouchableOpacity style={s.author} onPress={() => onProfilePress(item.user)}>
          <Avatar name={item.user?.username} size={28} />
          <Text style={s.username}>@{item.user?.username}</Text>
          <Text style={s.dot}>·</Text>
          <Text style={s.dateStr}>{fmt(item.createdAt)}</Text>
        </TouchableOpacity>

        <Text style={s.title} numberOfLines={2}>{item.title}</Text>
        <Text style={s.destination}>📍 {item.destination}</Text>
        {item.content ? (
          <Text style={s.excerpt} numberOfLines={2}>{item.content}</Text>
        ) : null}

        <View style={s.reactions}>
          {REACTIONS.map(r => (
            <TouchableOpacity
              key={r.type}
              onPress={() => handleReact(r.type)}
              disabled={!!reacting}
              style={s.reactBtn}
            >
              <Text style={{ fontSize: 17, opacity: reacting === r.type ? 0.3 : 1 }}>{r.emoji}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ flex: 1 }} />
          <Text style={s.counts}>{item._count?.likes ?? 0} ❤️  {item._count?.comments ?? 0} 💬</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const [tab, setTab]               = useState(0);
  const [journals, setJournals]     = useState([]);
  const [destinations, setDests]    = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const endpoint = tab === 0 ? '/journals/feed' : '/journals/feed/following';

  useEffect(() => {
    api.get('/destinations?page=1').then(r => setDests(r.data?.slice?.(0, 10) ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setJournals([]);
    setPage(1);
    setHasMore(true);
    api.get(`${endpoint}?page=1`)
      .then(r => { setJournals(r.data); setHasMore(r.data.length === 20); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]); // eslint-disable-line

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const r = await api.get(`${endpoint}?page=1`);
      setJournals(r.data);
      setHasMore(r.data.length === 20);
      setPage(1);
    } catch {/* silent */}
    finally { setRefreshing(false); }
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    try {
      const r = await api.get(`${endpoint}?page=${next}`);
      setJournals(prev => [...prev, ...r.data]);
      setHasMore(r.data.length === 20);
    } catch {/* silent */}
    finally { setLoadingMore(false); }
  }

  async function handleReact(journalId, type) {
    if (!user) { navigation.navigate('Login'); return; }
    try { await api.post(`/journals/${journalId}/like`, { type }); } catch {/* silent */}
  }

  const Header = (
    <View>
      {/* App Header */}
      <View style={s.header}>
        <Text style={s.brand}>Roamera</Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={s.iconBtn}>
            <Text style={{ fontSize: 20 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={s.iconBtn}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('CreateJournal')} style={s.createBtn}>
            <Text style={s.createTxt}>+ Post</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Trending Destinations */}
      {destinations.length > 0 && (
        <View style={s.destSection}>
          <Text style={s.sectionLabel}>✦ Trending Destinations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {destinations.map(d => (
              <DestCard key={d.id} item={d} onPress={() => {}} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tab Bar */}
      <View style={s.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} onPress={() => setTab(i)} style={[s.tab, tab === i && s.tabActive]}>
            <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList
          data={journals}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <JournalCard
              item={item}
              onPress={j => navigation.navigate('JournalDetail', { id: j.id })}
              onProfilePress={u => navigation.navigate('UserProfile', { id: u.id, username: u.username })}
              onReact={handleReact}
            />
          )}
          ListHeaderComponent={Header}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48 }}>🌏</Text>
              <Text style={s.emptyTxt}>{tab === 1 ? 'Follow travelers to see their trips.' : 'No journals yet. Be the first!'}</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={C.primary} style={{ margin: 20 }} />
              : !hasMore && journals.length > 0
                ? <Text style={s.endTxt}>· All caught up ·</Text>
                : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  brand:       { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn:     { padding: 8 },
  createBtn:   { backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99 },
  createTxt:   { color: '#fff', fontWeight: '700', fontSize: 13 },

  destSection: { marginBottom: 12 },
  sectionLabel:{ fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 10 },
  destCard:    { width: 120, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, justifyContent: 'flex-end' },
  destFlag:    { fontSize: 28, marginBottom: 8 },
  destName:    { fontSize: 13, fontWeight: '700', color: C.text },
  destCountry: { fontSize: 11, color: C.muted, marginTop: 2 },

  tabs:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 6 },
  tab:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:    { borderBottomWidth: 2, borderBottomColor: C.primary },
  tabTxt:       { fontSize: 14, fontWeight: '600', color: C.muted },
  tabTxtActive: { color: C.primary },

  card:     { marginHorizontal: 16, marginBottom: 18, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  photo:    { width: '100%', height: 200 },
  photoPlaceholder: { backgroundColor: '#0c1e35', justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: 14 },

  author:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  username: { fontSize: 13, fontWeight: '700', color: C.primary, marginLeft: 8 },
  dot:      { color: C.muted, marginHorizontal: 5 },
  dateStr:  { fontSize: 12, color: C.muted },

  title:       { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 4, lineHeight: 22 },
  destination: { fontSize: 12, color: C.muted, marginBottom: 8 },
  excerpt:     { fontSize: 13, color: C.muted, lineHeight: 19, marginBottom: 10 },

  reactions: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  reactBtn:  { marginRight: 10, padding: 4 },
  counts:    { fontSize: 12, color: C.muted },

  empty:    { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTxt: { color: C.muted, marginTop: 16, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  endTxt:   { textAlign: 'center', color: C.dim, fontSize: 13, marginVertical: 24 },
});
