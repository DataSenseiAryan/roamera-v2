import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, RefreshControl,
} from 'react-native';
import api from '../lib/api';
import { C } from '../theme';

function Avatar({ name, size = 40 }) {
  const hue = name ? (name.charCodeAt(0) * 37) % 360 : 210;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue},45%,22%)`, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: size * 0.38 }}>{name ? name[0].toUpperCase() : '?'}</Text>
    </View>
  );
}

function notifText(n) {
  const actor = `@${n.actor?.username ?? 'Someone'}`;
  switch (n.type) {
    case 'follow':           return `${actor} followed you`;
    case 'comment':          return `${actor} commented on your journal`;
    case 'reaction_love':    return `${actor} loved your journal ❤️`;
    case 'reaction_wanna_go':return `${actor} added your journal to their bucket list 📍`;
    case 'reaction_inspire': return `${actor} was inspired by your journal ✨`;
    case 'justsplit_added':  return `${actor} added you to a JustSplit group`;
    case 'justsplit_request':return `${actor} requested to join your group`;
    case 'justsplit_approved':return `Your request was approved 🎉`;
    default:                 return `${actor} interacted with you`;
  }
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsScreen({ navigation }) {
  const [notifs, setNotifs]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const r = await api.get('/notifications');
      setNotifs(r.data);
      await api.put('/notifications/read').catch(() => {});
    } catch {/* silent */}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={notifs}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.row, !item.read && s.rowUnread]}
            onPress={() => {
              if (item.journal) navigation.navigate('JournalDetail', { id: item.journal.id });
              else if (item.actor) navigation.navigate('UserProfile', { id: item.actor.id, username: item.actor.username });
            }}
          >
            <Avatar name={item.actor?.username} size={44} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.notifTxt}>{notifText(item)}</Text>
              {item.journal && <Text style={s.journalRef} numberOfLines={1}>"{item.journal.title}"</Text>}
              <Text style={s.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={s.dot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 48 }}>🔔</Text>
            <Text style={s.emptyTxt}>No notifications yet</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  rowUnread:  { backgroundColor: 'rgba(59,130,246,0.06)' },
  notifTxt:   { fontSize: 14, color: C.text, lineHeight: 20, fontWeight: '500' },
  journalRef: { fontSize: 12, color: C.primary, marginTop: 2 },
  time:       { fontSize: 11, color: C.muted, marginTop: 4 },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginTop: 6, marginLeft: 8 },
  empty:      { alignItems: 'center', paddingTop: 80 },
  emptyTxt:   { color: C.muted, fontSize: 16, marginTop: 16 },
});
