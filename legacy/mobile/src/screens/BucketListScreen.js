import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, SafeAreaView, StatusBar,
} from 'react-native';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const C = {
  bg: '#03030f', surface: '#0d0d1f', card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)', accent: '#7c3aed', accentLt: '#a78bfa',
  text: '#e2e8f0', muted: '#64748b', dim: '#334155',
};

function BucketCard({ item, onPress }) {
  const journal = item.journal;
  const photos = journal?.photos ? (Array.isArray(journal.photos) ? journal.photos : JSON.parse(journal.photos || '[]')) : [];

  return (
    <TouchableOpacity style={s.card} onPress={() => onPress(item)} activeOpacity={0.85}>
      {photos.length > 0 ? (
        <Image source={{ uri: photos[0] }} style={s.photo} resizeMode="cover" />
      ) : (
        <View style={[s.photo, { backgroundColor: '#1e1b4b', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 40 }}>📍</Text>
        </View>
      )}
      <View style={s.overlay} />
      <View style={s.info}>
        <Text style={s.dest}>📍 {item.destination}</Text>
        {journal && <Text style={s.title} numberOfLines={1}>{journal.title}</Text>}
        {journal?.user && <Text style={s.author}>by @{journal.user.username}</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function BucketListScreen({ navigation }) {
  const { user } = useAuth();
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const res = await api.get('/bucket-list');
      setItems(res.data);
    } catch {/* silent */}
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (!user) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>📍</Text>
          <Text style={s.emptyHeading}>Your Bucket List</Text>
          <Text style={s.emptyTxt}>Sign in to track destinations you want to visit.</Text>
          <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Login')}>
            <Text style={s.btnTxt}>Sign In ✦</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.accentLt} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 8 }}
          renderItem={({ item }) => (
            <BucketCard
              item={item}
              onPress={i => i.journal && navigation.navigate('JournalDetail', { id: i.journal.id })}
            />
          )}
          ListHeaderComponent={
            <View style={s.header}>
              <Text style={s.heading}>Bucket List <Text style={{ color: C.accentLt }}>📍</Text></Text>
              <Text style={s.sub}>{items.length} destination{items.length !== 1 ? 's' : ''} saved</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ fontSize: 48 }}>📍</Text>
              <Text style={s.emptyHeading}>Nothing here yet</Text>
              <Text style={s.emptyTxt}>React with 📍 on any journal to save it here.</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accentLt} />}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

  header:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  heading: { fontSize: 26, fontWeight: '800', color: C.text },
  sub:     { fontSize: 13, color: C.muted, marginTop: 4 },

  card:    { flex: 1, margin: 6, height: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  photo:   { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3,3,15,.55)' },
  info:    { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  dest:    { fontSize: 11, color: C.accentLt, fontWeight: '700' },
  title:   { fontSize: 13, fontWeight: '700', color: '#f1f5f9', marginTop: 2 },
  author:  { fontSize: 10, color: '#94a3b8', marginTop: 1 },

  emptyHeading: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 8 },
  emptyTxt:     { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21 },

  btn:    { marginTop: 24, backgroundColor: C.accent, paddingVertical: 13, paddingHorizontal: 32, borderRadius: 14 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
