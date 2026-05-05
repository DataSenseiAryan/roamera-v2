import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, SafeAreaView, StatusBar, FlatList,
} from 'react-native';
import api from '../lib/api';
import { C } from '../theme';

const TABS = ['✈️ Flights', '🏨 Hotels'];

function FlightCard({ f }) {
  return (
    <View style={s.resultCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={s.airline}>{f.airline || f.airlineName || 'Airline'}</Text>
          <Text style={s.route}>
            {f.departure_airport?.id ?? f.origin} → {f.arrival_airport?.id ?? f.destination}
          </Text>
          {f.duration && <Text style={s.meta}>🕐 {Math.floor(f.duration / 60)}h {f.duration % 60}m · {f.stops === 0 ? 'Non-stop' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`}</Text>}
          {(f.departure_airport?.time ?? f.departureTime) && (
            <Text style={s.meta}>
              {f.departure_airport?.time ?? f.departureTime} → {f.arrival_airport?.time ?? f.arrivalTime}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.price}>₹{f.price}</Text>
          {f.stops === 0 && <View style={s.bestBadge}><Text style={{ fontSize: 10, color: C.accent, fontWeight: '700' }}>NON-STOP</Text></View>}
        </View>
      </View>
    </View>
  );
}

function HotelCard({ h }) {
  return (
    <View style={s.resultCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={s.hotelName}>{h.name}</Text>
          {h.rating && <Text style={s.meta}>⭐ {h.rating} {h.reviews ? `· ${h.reviews} reviews` : ''}</Text>}
          {h.type && <Text style={s.meta}>{h.type}</Text>}
          {h.description && <Text style={s.desc} numberOfLines={2}>{h.description}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
          {h.price ? <Text style={s.price}>₹{h.price}<Text style={{ fontSize: 11 }}>/night</Text></Text> : null}
        </View>
      </View>
      {h.link && (
        <Text style={s.bookLink}>🔗 View booking</Text>
      )}
    </View>
  );
}

export default function TravelLensScreen({ navigation }) {
  const [tab, setTab]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError]     = useState('');

  const [flight, setFlight] = useState({ origin: '', destination: '', date: '', adults: '1' });
  const [hotel, setHotel]   = useState({ destination: '', checkin: '', checkout: '', guests: '2' });

  const setF = (k, v) => setFlight(p => ({ ...p, [k]: v }));
  const setH = (k, v) => setHotel(p => ({ ...p, [k]: v }));

  async function searchFlights() {
    if (!flight.origin || !flight.destination || !flight.date) {
      setError('Please fill in origin, destination and date.'); return;
    }
    setError(''); setLoading(true); setResults([]);
    try {
      const r = await api.get(`/flights/search?origin=${encodeURIComponent(flight.origin)}&destination=${encodeURIComponent(flight.destination)}&date=${flight.date}&adults=${flight.adults}`);
      setResults(Array.isArray(r.data) ? r.data : (r.data.flights ?? r.data.results ?? []));
    } catch (e) {
      setError(e.response?.data?.error || 'Search failed. Try again.');
    } finally { setLoading(false); }
  }

  async function searchHotels() {
    if (!hotel.destination || !hotel.checkin || !hotel.checkout) {
      setError('Please fill in destination and dates.'); return;
    }
    setError(''); setLoading(true); setResults([]);
    try {
      const r = await api.get(`/hotels/search?destination=${encodeURIComponent(hotel.destination)}&checkin=${hotel.checkin}&checkout=${hotel.checkout}&guests=${hotel.guests}`);
      setResults(Array.isArray(r.data) ? r.data : (r.data.hotels ?? r.data.results ?? []));
    } catch (e) {
      setError(e.response?.data?.error || 'Search failed. Try again.');
    } finally { setLoading(false); }
  }

  const inp = (placeholder, value, onChange, opts = {}) => (
    <TextInput
      style={s.input}
      placeholder={placeholder}
      placeholderTextColor={C.muted}
      value={value}
      onChangeText={onChange}
      {...opts}
    />
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.heading}>TravelLens</Text>
          <Text style={s.sub}>Find flights & hotels worldwide</Text>
        </View>

        {/* AI Planner CTA */}
        <TouchableOpacity style={s.aiCta} onPress={() => navigation.navigate('AIPlanner')}>
          <Text style={{ fontSize: 20 }}>🤖</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }}>AI Trip Planner</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Generate a full itinerary with AI</Text>
          </View>
          <Text style={{ color: C.primary, fontSize: 18 }}>›</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={s.tabs}>
          {TABS.map((t, i) => (
            <TouchableOpacity key={t} onPress={() => { setTab(i); setResults([]); setError(''); }} style={[s.tab, tab === i && s.tabActive]}>
              <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Flight Form */}
        {tab === 0 && (
          <View style={s.form}>
            <Text style={s.label}>FROM</Text>
            {inp('e.g. Delhi, New York', flight.origin, v => setF('origin', v))}
            <Text style={s.label}>TO</Text>
            {inp('e.g. Dubai, Tokyo', flight.destination, v => setF('destination', v))}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 2 }}>
                <Text style={s.label}>DATE (YYYY-MM-DD)</Text>
                {inp('2025-12-15', flight.date, v => setF('date', v))}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>ADULTS</Text>
                {inp('1', flight.adults, v => setF('adults', v), { keyboardType: 'numeric' })}
              </View>
            </View>
            <TouchableOpacity style={s.searchBtn} onPress={searchFlights} disabled={loading}>
              <Text style={s.searchTxt}>{loading ? 'Searching…' : '🔍 Search Flights'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hotel Form */}
        {tab === 1 && (
          <View style={s.form}>
            <Text style={s.label}>DESTINATION</Text>
            {inp('e.g. Bali, Paris', hotel.destination, v => setH('destination', v))}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>CHECK-IN</Text>
                {inp('YYYY-MM-DD', hotel.checkin, v => setH('checkin', v))}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>CHECK-OUT</Text>
                {inp('YYYY-MM-DD', hotel.checkout, v => setH('checkout', v))}
              </View>
            </View>
            <Text style={s.label}>GUESTS</Text>
            {inp('2', hotel.guests, v => setH('guests', v), { keyboardType: 'numeric' })}
            <TouchableOpacity style={s.searchBtn} onPress={searchHotels} disabled={loading}>
              <Text style={s.searchTxt}>{loading ? 'Searching…' : '🔍 Search Hotels'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error */}
        {!!error && <View style={s.errBox}><Text style={s.errTxt}>{error}</Text></View>}

        {/* Loading */}
        {loading && <ActivityIndicator color={C.primary} size="large" style={{ margin: 32 }} />}

        {/* Results */}
        {results.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12, fontWeight: '600' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </Text>
            {tab === 0
              ? results.map((f, i) => <FlightCard key={i} f={f} />)
              : results.map((h, i) => <HotelCard key={i} h={h} />)
            }
          </View>
        )}

        {!loading && results.length === 0 && !error && (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 48 }}>{tab === 0 ? '✈️' : '🏨'}</Text>
            <Text style={s.emptyTxt}>Search for {tab === 0 ? 'flights' : 'hotels'} above</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  heading:{ fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  sub:    { fontSize: 13, color: C.muted, marginTop: 4 },

  aiCta: { marginHorizontal: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderRadius: 16, padding: 14 },

  tabs:         { flexDirection: 'row', marginHorizontal: 16, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 4, marginBottom: 20 },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive:    { backgroundColor: C.primary },
  tabTxt:       { fontSize: 14, fontWeight: '600', color: C.muted },
  tabTxtActive: { color: '#fff' },

  form:      { paddingHorizontal: 16, marginBottom: 8 },
  label:     { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, color: C.text, fontSize: 14, marginBottom: 14 },
  searchBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 4 },
  searchTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },

  errBox: { marginHorizontal: 16, backgroundColor: 'rgba(239,68,68,.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,.25)' },
  errTxt: { color: '#f87171', fontSize: 13 },

  resultCard: { backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  airline:    { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  route:      { fontSize: 13, color: C.primary, fontWeight: '600', marginBottom: 4 },
  meta:       { fontSize: 12, color: C.muted, marginBottom: 2 },
  price:      { fontSize: 20, fontWeight: '800', color: C.accent, marginBottom: 4 },
  bestBadge:  { backgroundColor: 'rgba(16,185,129,.12)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(16,185,129,.25)' },
  hotelName:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  desc:       { fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 18 },
  bookLink:   { fontSize: 12, color: C.primary, marginTop: 10, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyTxt:   { color: C.muted, fontSize: 15, marginTop: 14 },
});
