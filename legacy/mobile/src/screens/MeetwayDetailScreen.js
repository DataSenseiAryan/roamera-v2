import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

function Avatar({ name, size = 36 }) {
  const hue = name ? (name.charCodeAt(0) * 37) % 360 : 210;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `hsl(${hue},45%,22%)`, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#e2e8f0', fontWeight: '700', fontSize: size * 0.38 }}>{name ? name[0].toUpperCase() : '?'}</Text>
    </View>
  );
}

const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function MeetwayDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();

  const [meetway, setMeetway]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [joinStatus, setJoinStatus] = useState('open');
  const [joinBusy, setJoinBusy]     = useState(false);
  const [messages, setMessages]     = useState([]);
  const [chatMsg, setChatMsg]       = useState('');
  const [sendBusy, setSendBusy]     = useState(false);

  useEffect(() => {
    api.get(`/meetways/${id}`)
      .then(res => {
        const m = res.data;
        setMeetway(m);
        setMessages((m.messages ?? []).slice().reverse());
        if (user) {
          if (m.host?.id === user.id) { setJoinStatus('host'); return; }
          const mine = (m.participants ?? []).find(p => p.user?.id === user.id);
          if (mine) setJoinStatus(mine.status === 'approved' ? 'joined' : 'requested');
          else if ((m.spotsLeft ?? 0) <= 0) setJoinStatus('full');
        }
      })
      .catch(() => Alert.alert('Error', 'Could not load meetway.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleJoin() {
    if (!user) { navigation.navigate('Login'); return; }
    setJoinBusy(true);
    try {
      await api.post(`/meetways/${id}/join`);
      setJoinStatus(meetway.privacy === 'private' ? 'requested' : 'joined');
    } catch (e) {
      Alert.alert('Could not join', e.response?.data?.error || 'Please try again.');
    } finally { setJoinBusy(false); }
  }

  async function handleLeave() {
    Alert.alert('Leave Meetway', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        try { await api.delete(`/meetways/${id}/leave`); setJoinStatus('open'); }
        catch {/* silent */}
      }},
    ]);
  }

  async function sendMessage() {
    if (!chatMsg.trim() || sendBusy) return;
    setSendBusy(true);
    try {
      const res = await api.post(`/meetways/${id}/messages`, { content: chatMsg.trim() });
      setMessages(p => [...p, res.data]);
      setChatMsg('');
    } catch {/* silent */}
    finally { setSendBusy(false); }
  }

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
  if (!meetway) return null;

  const tags     = meetway.tags ?? [];
  const approved = (meetway.participants ?? []).filter(p => p.status === 'approved');
  const spotsLeft = meetway.spotsLeft ?? (meetway.maxPeople - approved.length);
  const pct      = Math.min((approved.length / meetway.maxPeople) * 100, 100);
  const isHost   = meetway.host?.id === user?.id;
  const canChat  = joinStatus === 'joined' || joinStatus === 'host';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Hero */}
        <View style={[s.hero, { backgroundColor: C.primaryDark }]}>
          <View style={s.heroOverlay} />
          <Text style={s.heroTitle}>{meetway.title}</Text>
          <Text style={s.heroMeta}>📍 {meetway.destination}{meetway.country ? `, ${meetway.country}` : ''}</Text>
          <Text style={s.heroMeta}>📅 {fmt(meetway.startDate)} – {fmt(meetway.endDate)}</Text>
        </View>

        <View style={{ padding: 16 }}>
          {/* Host */}
          <View style={s.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={meetway.host?.username} size={44} />
              <View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>@{meetway.host?.username}</Text>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Host</Text>
              </View>
            </View>
          </View>

          {/* Travelers */}
          <View style={s.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={s.sectionH}>Travelers ({approved.length})</Text>
              <Text style={{ fontSize: 12, color: spotsLeft > 0 ? C.primary : C.warning, fontWeight: '700' }}>
                {spotsLeft > 0 ? `${spotsLeft} spots open` : 'Full 🟡'}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {approved.map(p => (
                <View key={p.id} style={{ alignItems: 'center', marginRight: 14 }}>
                  <Avatar name={p.user?.username} size={44} />
                  <Text style={{ fontSize: 9, color: p.role === 'host' ? C.warning : C.primary, fontWeight: '800', marginTop: 4 }}>{p.role?.toUpperCase()}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? C.warning : C.primary }]} />
            </View>
          </View>

          {/* Tags */}
          {tags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {tags.map(t => (
                <View key={t} style={s.tag}><Text style={s.tagTxt}>#{t}</Text></View>
              ))}
            </ScrollView>
          )}

          {/* About */}
          {meetway.description && (
            <View style={s.section}>
              <Text style={s.sectionH}>About</Text>
              <Text style={s.body}>{meetway.description}</Text>
            </View>
          )}

          {/* Budget */}
          {(meetway.budgetMin || meetway.budgetMax) && (
            <View style={[s.section, { backgroundColor: 'rgba(16,185,129,.06)', borderColor: 'rgba(16,185,129,.15)' }]}>
              <Text style={[s.sectionH, { marginBottom: 4 }]}>Budget Range</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: C.accent }}>
                ₹{meetway.budgetMin}–₹{meetway.budgetMax} <Text style={{ fontSize: 13, color: C.muted }}>/person</Text>
              </Text>
            </View>
          )}

          {/* Chat */}
          <View style={s.section}>
            <Text style={[s.sectionH, { marginBottom: 12 }]}>Discussion 💬</Text>
            {canChat ? (
              <>
                <View style={{ maxHeight: 220, marginBottom: 12 }}>
                  {messages.length === 0 && (
                    <Text style={{ color: C.dim, textAlign: 'center', paddingVertical: 12 }}>No messages yet. Say hello! 👋</Text>
                  )}
                  {messages.map(m => (
                    <View key={m.id} style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                      <Avatar name={m.user?.username} size={28} />
                      <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: C.primary, marginBottom: 2 }}>@{m.user?.username}</Text>
                        <Text style={{ fontSize: 13, color: '#94a3b8' }}>{m.content}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={chatMsg}
                    onChangeText={setChatMsg}
                    placeholder="Type a message…"
                    placeholderTextColor={C.muted}
                    style={{ flex: 1, padding: 11, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14 }}
                  />
                  <TouchableOpacity
                    onPress={sendMessage}
                    disabled={sendBusy || !chatMsg.trim()}
                    style={{ paddingHorizontal: 16, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', opacity: sendBusy || !chatMsg.trim() ? 0.4 : 1 }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>↑</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={{ color: C.dim, textAlign: 'center', paddingVertical: 16 }}>
                {joinStatus === 'requested' ? '⏳ Request pending — chat unlocks when approved.' : 'Join to access group chat.'}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.cta}>
        <View>
          {(meetway.budgetMin || meetway.budgetMax) && (
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.accent }}>₹{meetway.budgetMin}–₹{meetway.budgetMax}</Text>
          )}
          <Text style={{ fontSize: 12, color: C.muted }}>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</Text>
        </View>
        {isHost ? (
          <View style={[s.ctaBtn, { backgroundColor: 'rgba(255,255,255,.07)' }]}>
            <Text style={{ color: C.muted, fontWeight: '700' }}>You're the host</Text>
          </View>
        ) : joinStatus === 'joined' ? (
          <TouchableOpacity onPress={handleLeave} style={[s.ctaBtn, { backgroundColor: 'rgba(239,68,68,.12)' }]}>
            <Text style={{ color: '#f87171', fontWeight: '700' }}>Leave ✕</Text>
          </TouchableOpacity>
        ) : joinStatus === 'requested' ? (
          <View style={[s.ctaBtn, { backgroundColor: 'rgba(96,165,250,.1)' }]}>
            <Text style={{ color: '#60a5fa', fontWeight: '700' }}>⏳ Pending</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={handleJoin} disabled={joinBusy} style={[s.ctaBtn, { backgroundColor: C.primary, opacity: joinBusy ? 0.6 : 1 }]}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
              {joinBusy ? 'Joining…' : meetway.privacy === 'private' ? 'Request to Join' : 'Join Meetway ✦'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero:        { height: 220, justifyContent: 'flex-end', padding: 16 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,17,31,.65)' },
  heroTitle:   { fontSize: 22, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5 },
  heroMeta:    { fontSize: 13, color: '#94a3b8', marginTop: 3 },

  section:  { padding: 14, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  sectionH: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8 },
  body:     { fontSize: 14, color: '#94a3b8', lineHeight: 21 },

  barBg:   { height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.07)', marginTop: 12, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },

  tag:    { borderRadius: 99, borderWidth: 1, borderColor: 'rgba(59,130,246,.25)', paddingHorizontal: 12, paddingVertical: 4, marginRight: 8, backgroundColor: 'rgba(59,130,246,.08)' },
  tagTxt: { fontSize: 12, color: C.primary, fontWeight: '600' },

  cta:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: `${C.surface}f5`, borderTopWidth: 1, borderTopColor: C.border, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctaBtn: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 99 },
});
