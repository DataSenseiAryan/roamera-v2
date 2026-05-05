import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, SafeAreaView,
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

export default function UserProfileScreen({ route, navigation }) {
  const { id } = route.params;
  const { user: me } = useAuth();

  const [profile, setProfile]     = useState(null);
  const [journals, setJournals]   = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/users/${id}/journals`).catch(() => ({ data: [] })),
    ])
      .then(([profileRes, journalsRes]) => {
        const p = profileRes.data;
        setProfile(p);
        setJournals(journalsRes.data);
        if (me) {
          const followers = p.followers || [];
          setFollowing(followers.some(f => f.followerId === me.id));
        }
      })
      .catch(() => Alert.alert('Error', 'Could not load profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleFollow() {
    if (!me) { navigation.navigate('Login'); return; }
    setFollowBusy(true);
    try {
      const res = await api.post(`/users/${id}/follow`);
      setFollowing(res.data.following);
      const updated = await api.get(`/users/${id}`);
      setProfile(updated.data);
    } catch {/* silent */}
    finally { setFollowBusy(false); }
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  if (!profile) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>

        <View style={s.header}>
          <Avatar name={profile.username} size={80} />
          <Text style={s.username}>@{profile.username}</Text>
          {profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}

          <View style={s.stats}>
            <View style={s.stat}>
              <Text style={s.statNum}>{profile._count?.journals ?? journals.length}</Text>
              <Text style={s.statLbl}>Journals</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.stat}>
              <Text style={s.statNum}>{profile._count?.followers ?? 0}</Text>
              <Text style={s.statLbl}>Followers</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.stat}>
              <Text style={s.statNum}>{profile._count?.following ?? 0}</Text>
              <Text style={s.statLbl}>Following</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.followBtn, following && s.followingBtn]}
            onPress={handleFollow}
            disabled={followBusy}
          >
            <Text style={[s.followTxt, following && { color: C.primary }]}>
              {followBusy ? '…' : following ? '✓ Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>Journals</Text>
        </View>
        {journals.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 36 }}>📓</Text>
            <Text style={s.emptyTxt}>No journals yet.</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {journals.map(j => {
              const photos = Array.isArray(j.photos) ? j.photos : [];
              return (
                <TouchableOpacity
                  key={j.id}
                  style={s.mini}
                  onPress={() => navigation.navigate('JournalDetail', { id: j.id })}
                >
                  {photos.length > 0 ? (
                    <Image source={{ uri: photos[0] }} style={s.miniImg} resizeMode="cover" />
                  ) : (
                    <View style={[s.miniImg, { backgroundColor: '#0c1e35', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 28 }}>🌍</Text>
                    </View>
                  )}
                  <View style={{ padding: 8 }}>
                    <Text style={s.miniTitle} numberOfLines={1}>{j.title}</Text>
                    <Text style={s.miniDest} numberOfLines={1}>📍 {j.destination}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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

  followBtn:    { paddingVertical: 12, paddingHorizontal: 40, borderRadius: 99, backgroundColor: C.primary },
  followingBtn: { backgroundColor: 'rgba(59,130,246,.12)', borderWidth: 1, borderColor: 'rgba(59,130,246,.3)' },
  followTxt:    { color: '#fff', fontWeight: '700', fontSize: 15 },

  grid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  mini:    { width: '46%', margin: '2%', backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  miniImg: { width: '100%', height: 110 },
  miniTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  miniDest:  { fontSize: 11, color: C.muted, paddingBottom: 2 },

  empty:    { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { color: C.muted, marginTop: 10, fontSize: 14 },
});
