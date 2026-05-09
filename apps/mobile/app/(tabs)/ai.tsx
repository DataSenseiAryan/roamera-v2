import { useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, useColorScheme, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { getApiClient } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIScreen() {
  const dark = useColorScheme() === 'dark';
  const token = useAuthStore(s => s.accessToken);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm Roamera AI 🌍 Tell me where you want to go and I'll help plan your perfect trip!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await getApiClient().post(
        '/api/v1/ai/chat',
        { message: input },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const reply = res.data.reply ?? res.data.message ?? res.data.response ?? 'I could not understand that. Try again!';
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: reply };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#0f172a' : '#f8fafc' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a' }}>AI Planner 🤖</Text>
        <Text style={{ fontSize: 13, color: '#0d9488' }}>Plan your next adventure</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View style={{
              alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              backgroundColor: item.role === 'user' ? '#0d9488' : (dark ? '#1e293b' : '#fff'),
              borderRadius: 16,
              borderBottomRightRadius: item.role === 'user' ? 4 : 16,
              borderBottomLeftRadius: item.role === 'assistant' ? 4 : 16,
              padding: 12,
              shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
            }}>
              <Text style={{
                fontSize: 14, lineHeight: 20,
                color: item.role === 'user' ? '#fff' : (dark ? '#f8fafc' : '#0f172a'),
              }}>
                {item.content}
              </Text>
            </View>
          )}
          ListFooterComponent={isLoading ? (
            <View style={{
              alignSelf: 'flex-start',
              backgroundColor: dark ? '#1e293b' : '#fff',
              borderRadius: 16, borderBottomLeftRadius: 4,
              padding: 12, marginTop: 4,
            }}>
              <Text style={{ color: '#0d9488' }}>Thinking...</Text>
            </View>
          ) : null}
        />

        <View style={{
          flexDirection: 'row', padding: 12, gap: 8,
          backgroundColor: dark ? '#1e293b' : '#fff',
          borderTopWidth: 1, borderTopColor: dark ? '#334155' : '#e2e8f0',
        }}>
          <TextInput
            style={{
              flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
              backgroundColor: dark ? '#0f172a' : '#f1f5f9',
              color: dark ? '#f8fafc' : '#0f172a', fontSize: 14,
              maxHeight: 100,
            }}
            placeholder="Ask me anything about travel..."
            placeholderTextColor={dark ? '#64748b' : '#94a3b8'}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: input.trim() && !isLoading ? '#0d9488' : '#cbd5e1',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const _styles = StyleSheet.create({});
