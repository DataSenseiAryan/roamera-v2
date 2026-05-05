import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

const REACTIONS = [
  { type: 'love',     emoji: '❤️', label: 'Love' },
  { type: 'wanna_go', emoji: '📍', label: 'Wanna Go' },
  { type: 'inspire',  emoji: '✨', label: 'Inspired' },
];

function Avatar({ name, size = 34 }) {
  const hue = name ? (name.charCodeAt(0) * 37) % 360 : 210;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue},45%,22%)`, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: size * 0.38 }}>{name ? name[0].toUpperCase() : '?'}</Text>
    </View>
  );
}

const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default function JournalDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [journal, setJournal]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [comment, setComment]   = useState('');
  const [posting, setPosting]   = useState(false);
  const [reacting, setReacting] = useState(null);

  useEffect(() => {
    api.get(`/journals/${id}`)
      .then(res => setJournal(res.data))
      .catch(() => Alert.alert('Error', 'Could not load journal.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReact(type) {
    if (!user) { navigation.navigate('Login'); return; }
    setReacting(type);
    try {
      await api.post(`/journals/${id}/like`, { type });
      const res = await api.get(`/journals/${id}`);
      setJournal(res.data);
    } catch {/* silent */}
    finally { setReacting(null); }
  }

  async function postComment() {
    if (!user) { navigation.navigate('Login'); return; }
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post(`/journals/${id}/comments`, { content: comment.trim() });
      setComment('');
      const res = await api.get(`/journals/${id}`);
      setJournal(res.data);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not post comment.');
    } finally { setPosting(false); }
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
  if (!journal) return null;

  const photos    = Array.isArray(journal.photos) ? journal.photos : [];
  const itinerary = Array.isArray(journal.itinerary) ? journal.itinerary : [];
  const isOwner   = user?.id === journal.user?.id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Hero photo */}
        {photos.length > 0 ? (
          <Image source={{ uri: photos[0] }} style={s.hero} resizeMode="cover" />
        ) : (
          <View style={[s.hero, { backgroundColor: '#0c1e35', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 64 }}>🌍</Text>
          </View>
        )}

        <View style={{ padding: 16 }}>
          {/* Title & meta */}
          <Text style={s.title}>{journal.title}</Text>
          <Text style={s.destination}>📍 {journal.destination}</Text>
          {journal.startDate && (
            <Text style={s.dates}>{fmt(journal.startDate)} — {fmt(journal.endDate)}</Text>
          )}

          {/* Author */}
          <TouchableOpacity
            style={s.author}
            onPress={() => navigation.navigate('UserProfile', { id: journal.user.id, username: journal.user.username })}
          >
            <Avatar name={journal.user?.username} size={34} />
            <Text style={s.authorName}>@{journal.user?.username}</Text>
          </TouchableOpacity>

          {/* Owner tools */}
          {isOwner && (
            <View style={s.ownerTools}>
              <TouchableOpacity
                style={s.toolBtn}
                onPress={() => navigation.navigate('JournalBudget', { journalId: id })}
              >
                <Text style={s.toolTxt}>💰 Budget</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.toolBtn}
                onPress={() => navigation.navigate('JournalPacking', { journalId: id })}
              >
                <Text style={s.toolTxt}>🎒 Packing</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Reactions */}
          <View style={s.reactRow}>
            {REACTIONS.map(r => (
              <TouchableOpacity
                key={r.type}
                onPress={() => handleReact(r.type)}
                disabled={!!reacting}
                style={s.reactBtn}
              >
                <Text style={{ fontSize: 22, opacity: reacting === r.type ? 0.3 : 1 }}>{r.emoji}</Text>
                <Text style={s.reactLabel}>{r.label}</Text>
              </TouchableOpacity>
            ))}
            <Text style={s.likesCount}>{journal._count?.likes ?? 0} reactions</Text>
          </View>

          {/* Story */}
          {journal.content && (
            <View style={s.section}>
              <Text style={s.sectionH}>About this trip</Text>
              <Text style={s.body}>{journal.content}</Text>
            </View>
          )}

          {/* Activities */}
          {journal.activities && (
            <View style={s.section}>
              <Text style={s.sectionH}>Activities</Text>
              <Text style={s.body}>{journal.activities}</Text>
            </View>
          )}

          {/* Accommodation */}
          {journal.accommodation && (
            <View style={s.section}>
              <Text style={s.sectionH}>Accommodation</Text>
              <Text style={s.body}>{journal.accommodation}</Text>
            </View>
          )}

          {/* Budget */}
          {journal.budget && (
            <View style={[s.section, { backgroundColor: 'rgba(16,185,129,.06)', borderColor: 'rgba(16,185,129,.15)' }]}>
              <Text style={s.sectionH}>Total Budget</Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: C.accent }}>₹{journal.budget}</Text>
            </View>
          )}

          {/* Itinerary */}
          {itinerary.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionH}>Itinerary</Text>
              {itinerary.map((day, i) => (
                <View key={i} style={s.dayRow}>
                  <View style={s.dayBadge}><Text style={s.dayNum}>D{i + 1}</Text></View>
                  <Text style={s.dayTxt}>
                    {typeof day === 'string' ? day : day.activity ?? day.plan ?? day.description ?? JSON.stringify(day)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* More photos */}
          {photos.length > 1 && (
            <View style={s.section}>
              <Text style={s.sectionH}>Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photos.slice(1).map((uri, i) => (
                  <Image key={i} source={{ uri }} style={s.thumb} resizeMode="cover" />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Comments */}
          <View style={s.section}>
            <Text style={s.sectionH}>Comments ({journal._count?.comments ?? 0})</Text>
            {(journal.comments ?? []).map(c => (
              <View key={c.id} style={s.commentRow}>
                <Avatar name={c.user?.username} size={28} />
                <View style={s.commentBubble}>
                  <Text style={s.commentUser}>@{c.user?.username}</Text>
                  <Text style={s.commentTxt}>{c.content}</Text>
                </View>
              </View>
            ))}

            <View style={s.commentInput}>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Add a comment…"
                placeholderTextColor={C.muted}
                style={s.input}
                multiline
              />
              <TouchableOpacity
                onPress={postComment}
                disabled={posting || !comment.trim()}
                style={[s.sendBtn, (!comment.trim() || posting) && { opacity: 0.3 }]}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero:        { width: '100%', height: 280 },
  title:       { fontSize: 24, fontWeight: '800', color: C.text, marginTop: 16, letterSpacing: -0.5 },
  destination: { fontSize: 14, color: C.primary, marginTop: 6 },
  dates:       { fontSize: 12, color: C.muted, marginTop: 4 },

  author:     { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 8 },
  authorName: { fontSize: 14, fontWeight: '700', color: C.text, marginLeft: 10 },

  ownerTools: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  toolBtn:    { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  toolTxt:    { fontSize: 13, fontWeight: '700', color: C.text },

  reactRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  reactBtn:   { alignItems: 'center', marginRight: 20 },
  reactLabel: { fontSize: 10, color: C.muted, marginTop: 2 },
  likesCount: { marginLeft: 'auto', fontSize: 12, color: C.muted },

  section:  { padding: 14, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  sectionH: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10 },
  body:     { fontSize: 14, color: '#94a3b8', lineHeight: 21 },

  dayRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  dayBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(59,130,246,.15)', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 1 },
  dayNum:   { fontSize: 10, color: C.primary, fontWeight: '800' },
  dayTxt:   { flex: 1, fontSize: 14, color: '#94a3b8', lineHeight: 20 },

  thumb: { width: 140, height: 100, borderRadius: 10, marginRight: 10 },

  commentRow:    { flexDirection: 'row', marginBottom: 12 },
  commentBubble: { flex: 1, backgroundColor: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 10, marginLeft: 10, borderWidth: 1, borderColor: C.border },
  commentUser:   { fontSize: 11, fontWeight: '700', color: C.primary, marginBottom: 2 },
  commentTxt:    { fontSize: 13, color: '#94a3b8' },

  commentInput: { flexDirection: 'row', marginTop: 14, gap: 8 },
  input:        { flex: 1, padding: 11, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14 },
  sendBtn:      { paddingHorizontal: 16, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center' },
});
