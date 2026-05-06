'use client';

import { use, useState, useCallback } from 'react';
import { MapPin, Globe } from 'lucide-react';
import { useUserQuery, useUserPostsQuery, useSavePost, useUnsavePost, getApiClient } from '@roamera/sdk';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactionType } from '@roamera/types';
import { useAuthStore } from '@/lib/auth-store';
import { FollowButton } from '@/components/follow-button';
import { FollowersModal } from '@/components/followers-modal';
import { PostCard } from '@/components/posts/post-card';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { data: profile, isLoading, refetch } = useUserQuery(username);
  const currentUser = useAuthStore((s) => s.user);
  const [modal, setModal] = useState<'followers' | 'following' | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">User not found</h2>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-card">
        <div className="flex items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xl overflow-hidden flex-shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.username} className="h-full w-full object-cover" />
            ) : (
              profile.username.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold">{profile.username}</h1>
              {!isOwnProfile && (
                <FollowButton
                  userId={profile.id}
                  isFollowing={profile.isFollowing ?? false}
                  onToggle={() => refetch()}
                />
              )}
            </div>

            {profile.bio && (
              <p className="text-slate-600 dark:text-slate-400 mb-2">{profile.bio}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-slate-500">
              {profile.homeCity && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.homeCity}
                </span>
              )}
              {profile.budgetBand && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {profile.budgetBand.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => setModal('followers')} className="text-center hover:text-primary-600 transition">
            <span className="block text-lg font-bold">{profile.followersCount}</span>
            <span className="text-sm text-slate-500">Followers</span>
          </button>
          <button onClick={() => setModal('following')} className="text-center hover:text-primary-600 transition">
            <span className="block text-lg font-bold">{profile.followingCount}</span>
            <span className="text-sm text-slate-500">Following</span>
          </button>
          <div className="text-center">
            <span className="block text-lg font-bold">{profile.postsCount}</span>
            <span className="text-sm text-slate-500">Posts</span>
          </div>
        </div>

        {profile.interests && profile.interests.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      <UserPosts userId={profile.id} />

      {modal && (
        <FollowersModal
          userId={profile.id}
          type={modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function UserPosts({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, fetchNextPage, hasNextPage } = useUserPostsQuery(userId);
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();

  const userPosts = data?.pages.flatMap((p) => p.posts) ?? [];

  const handleReact = useCallback(
    async (postId: string, type: ReactionType) => {
      try {
        await getApiClient().post(`/api/v1/posts/${postId}/reactions`, { type });
        queryClient.invalidateQueries({ queryKey: ['users', userId, 'posts'] });
      } catch {}
    },
    [queryClient, userId],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 animate-pulse">
            <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (userPosts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-card text-center">
        <span className="text-4xl block mb-3">📸</span>
        <p className="text-slate-500">No moments shared yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onReact={handleReact}
            onSave={(id) => savePost.mutate(id)}
            onUnsave={(id) => unsavePost.mutate(id)}
          />
        ))}
      </div>
      {hasNextPage && (
        <div className="text-center">
          <button
            onClick={() => fetchNextPage()}
            className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
