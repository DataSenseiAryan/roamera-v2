import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

interface Post {
  id: string;
  title: string;
  content?: string;
  coverUrl?: string;
  author: { username: string; avatarUrl?: string };
  reactionCounts: Record<string, number>;
  commentsCount: number;
  viewerReaction?: string;
  isPublished: boolean;
}

const REACTIONS = [
  { key: 'love', emoji: '❤️' },
  { key: 'epic', emoji: '🔥' },
  { key: 'wander', emoji: '🌍' },
  { key: 'wanna_go', emoji: '📍' },
  { key: 'amazing', emoji: '🤩' },
];

function PostSkeleton() {
  const dark = useColorScheme() === 'dark';
  const bg = dark ? '#1e293b' : '#f1f5f9';
  return (
    <View style={{ margin: 12, borderRadius: 16, backgroundColor: dark ? '#0f172a' : '#fff', overflow: 'hidden' }}>
      <View style={{ height: 200, backgroundColor: bg }} />
      <View style={{ padding: 12 }}>
        <View style={{ height: 16, width: '70%', backgroundColor: bg, borderRadius: 8, marginBottom: 8 }} />
        <View style={{ height: 12, width: '40%', backgroundColor: bg, borderRadius: 8 }} />
      </View>
    </View>
  );
}

function PostCard({ post }: { post: Post }) {
  const dark = useColorScheme() === 'dark';
  const qc = useQueryClient();
  const token = useAuthStore(s => s.accessToken);

  const reactMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      await getApiClient().post(`/api/v1/posts/${post.id}/reactions`, { type: reactionType }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const handleReact = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reactMutation.mutate(key);
  };

  return (
    <View style={{
      margin: 12, borderRadius: 16,
      backgroundColor: dark ? '#0f172a' : '#fff',
      shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    }}>
      {post.coverUrl ? (
        <Image source={{ uri: post.coverUrl }} style={{ width: '100%', height: 200, borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
      ) : (
        <View style={{ height: 120, backgroundColor: dark ? '#1e293b' : '#f0fdfa', borderTopLeftRadius: 16, borderTopRightRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 40 }}>🧭</Text>
        </View>
      )}
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a', marginBottom: 4 }}>{post.title}</Text>
        <Text style={{ fontSize: 13, color: '#0d9488', marginBottom: 8 }}>@{post.author.username}</Text>
        {post.content ? (
          <Text style={{ fontSize: 14, color: dark ? '#94a3b8' : '#64748b', marginBottom: 8 }} numberOfLines={2}>{post.content}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {REACTIONS.map(r => (
            <TouchableOpacity
              key={r.key}
              onPress={() => handleReact(r.key)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 10, paddingVertical: 6,
                backgroundColor: post.viewerReaction === r.key ? '#0d948820' : (dark ? '#1e293b' : '#f1f5f9'),
                borderRadius: 20,
                borderWidth: post.viewerReaction === r.key ? 1 : 0,
                borderColor: '#0d9488',
              }}
            >
              <Text style={{ fontSize: 14 }}>{r.emoji}</Text>
              {(post.reactionCounts[r.key] ?? 0) > 0 && (
                <Text style={{ fontSize: 12, color: dark ? '#94a3b8' : '#64748b' }}>
                  {post.reactionCounts[r.key]}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function CompassScreen() {
  const dark = useColorScheme() === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const token = useAuthStore(s => s.accessToken);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const res = await getApiClient().get('/api/v1/feed/compass', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (res.data.posts ?? res.data.items ?? res.data) as Post[];
    },
    enabled: !!token,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#0f172a' : '#f8fafc' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: dark ? '#f8fafc' : '#0f172a' }}>Compass 🧭</Text>
        <Text style={{ fontSize: 13, color: '#0d9488' }}>Discover travel stories</Text>
      </View>
      {isLoading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={String}
          renderItem={() => <PostSkeleton />}
        />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={p => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🌍</Text>
              <Text style={{ color: dark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>No posts yet. Be the first to share your journey!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
