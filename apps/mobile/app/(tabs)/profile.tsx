import { useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../lib/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#64748b' }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        {/* Avatar + Name */}
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#ccfbf1',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={{ width: 80, height: 80 }} />
            ) : (
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#0d9488' }}>
                {user.username.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>{user.username}</Text>
          {user.bio && <Text style={{ color: '#64748b', textAlign: 'center' }}>{user.bio}</Text>}
          {user.homeCity && <Text style={{ color: '#94a3b8', fontSize: 13 }}>📍 {user.homeCity}</Text>}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>{(user as any).followersCount ?? 0}</Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>Followers</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>{(user as any).followingCount ?? 0}</Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>Following</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>{(user as any).postsCount ?? 0}</Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>Posts</Text>
          </View>
        </View>

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: '600', color: '#374151' }}>Interests</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {user.interests.map((interest) => (
                <View key={interest} style={{ backgroundColor: '#ccfbf1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: '#0d9488', fontSize: 12, fontWeight: '500' }}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Budget */}
        {user.budgetBand && (
          <View style={{ gap: 4 }}>
            <Text style={{ fontWeight: '600', color: '#374151' }}>Budget</Text>
            <Text style={{ color: '#64748b' }}>{user.budgetBand.replace('_', ' ')}</Text>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: '#fee2e2',
            padding: 14,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Text style={{ color: '#dc2626', fontWeight: '600' }}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
