import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, FlatList, ActivityIndicator, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

function Avatar({ name, size = 72 }) {
  const hue = name ? (name.charCodeAt(0) * 37) % 360 : 210;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue},45%,22%)`, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: C.primary }}>
      <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: size * 0.38 }}>{name ? name[0].toUpperCase() : '?'}</Text>
    </View>
  );
}

function JournalMini({ item, onPress }) {
  const photos = Array.isArray(item.photos) ? item.photos : [];
  return (
    <TouchableOpacity style={s.mini} onPress={() => onPress(item)}>
      {photos.length > 0 ? (
        <Image source={{ uri: photos[0] }} style={s.miniImg} resizeMode="cover" />
      ) : (
        <View style={[s.miniImg, { backgroundColor: '#0c1e35', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 28 }}>🌍</Text>
        </View>
      )}
      <View style={{ padding: 8 }}>
        <Text style={s.miniTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={s.miniDest} numberOfLines={1}>📍 {item.destination}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user: me, logout } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!me) { setLoading(false); return; }
    Promise.all([
      api.get(`/users/${me.id}`),
      api.get(`/users/${me.id}/journals`).catch(() => ({ data: [] })),
    ])
      .then(([profileRes, journalsRes]) => {
        setProfile(profileRes.data);
        setJournals(journalsRes.data);
      })
      .catch(() => Alert.alert('Error', 'Could not load profile.'))
      .finally(() => setLoading(false));
  }, [me]);

  async function handleLogout() {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  }

  if (!me) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>👤</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 }}>Sign in to see your profile</Text>
        <TouchableOpacity style={{ backgroundColor: C.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 99 }} onPress={() => navigation.navigate('Login')}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  const p = profile || me;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Header */}
        <View style={s.header}>
          <Avatar name={p.username} size={80} />
          <Text style={s.username}>@{p.username}</Text>
          {p.bio ? <Text style={s.bio}>{p.bio}</Text> : null}

          <View style={s.stats}>
            <View style={s.stat}>
              <Text style={s.statNum}>{p._count?.journals ?? journals.length}</Text>
              <Text style={s.statLbl}>Journals</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.stat}>
              <Text style={s.statNum}>{p._count?.followers ?? 0}</Text>
              <Text style={s.statLbl}>Followers</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.stat}>
              <Text style={s.statNum}>{p._count?.following ?? 0}</Text>
              <Text style={s.statLbl}>Following</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <TouchableOpacity
              style={s.createJournalBtn}
              onPress={() => navigation.navigate('CreateJournal')}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>✏️ New Journal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
              <Text style={s.logoutTxt}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Journals grid */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>My Journals</Text>
        </View>
        {journals.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 40 }}>📓</Text>
            <Text style={s.emptyTxt}>No journals yet. Share your first trip!</Text>
            <TouchableOpacity
              style={{ marginTop: 16, backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99 }}
              onPress={() => navigation.navigate('CreateJournal')}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Create Journal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.grid}>
            {journals.map(j => (
              <JournalMini
                key={j.id}
                item={j}
                onPress={item => navigation.navigate('JournalDetail', { id: item.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header:   { alignItems: 'center', padding: 24, paddingBottom: 20 },
  username: { fontSize: 20, fontWeight: '800', color: C.text, marginTop: 14 },
  bio:      { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  stats:   { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  stat:    { alignItems: 'center', paddingHorizontal: 24 },
  statNum: { fontSize: 22, fontWeight: '800', color: C.text },
  statLbl: { fontSize: 11, color: C.muted, marginTop: 2, fontWeight: '600' },
  statDiv: { width: 1, height: 32, backgroundColor: C.border },

  createJournalBtn: { flex: 1, paddingVertical: 12, borderRadius: 99, backgroundColor: C.primary, alignItems: 'center' },
  logoutBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 99, backgroundColor: 'rgba(239,68,68,.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,.25)' },
  logoutTxt: { color: '#f87171', fontWeight: '700', fontSize: 14 },

  grid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  mini:    { width: '46%', margin: '2%', backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  miniImg: { width: '100%', height: 110 },
  miniTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  miniDest:  { fontSize: 11, color: C.muted, paddingBottom: 2 },

  empty:    { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  emptyTxt: { color: C.muted, marginTop: 12, fontSize: 14, textAlign: 'center' },
});
