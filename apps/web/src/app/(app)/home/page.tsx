'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useFeedQuery, useSavePost, useUnsavePost, getApiClient } from '@roamera/sdk';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactionType } from '@roamera/types';
import { useAuthStore } from '@/lib/auth-store';
import { PostCard } from '@/components/posts/post-card';
import { CreateMomentModal } from '@/components/posts/create-moment-modal';

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const [feedType, setFeedType] = useState<'global' | 'following'>('global');
  const [showCreate, setShowCreate] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useFeedQuery(feedType);

  const queryClient = useQueryClient();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();

  const allPosts = data?.pages.flatMap((p) => p.posts) ?? [];

  // Infinite scroll via IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleReact = useCallback(
    async (postId: string, type: ReactionType) => {
      try {
        const { data: result } = await getApiClient().post(
          `/api/v1/posts/${postId}/reactions`,
          { type },
        );
        if (result.addedToBucketList) {
          setToastMessage('Added to Bucket List!');
          setTimeout(() => setToastMessage(null), 3000);
        }
        queryClient.invalidateQueries({ queryKey: ['feed'] });
      } catch {
        // ignore
      }
    },
    [queryClient],
  );

  const handleSave = useCallback(
    (postId: string) => savePost.mutate(postId),
    [savePost],
  );

  const handleUnsave = useCallback(
    (postId: string) => unsavePost.mutate(postId),
    [unsavePost],
  );

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => setFeedType('global')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              feedType === 'global'
                ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setFeedType('following')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              feedType === 'following'
                ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Following
          </button>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Moment
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 animate-pulse">
              <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!isLoading && allPosts.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center">
          <span className="text-5xl block mb-4">
            {feedType === 'following' ? '👥' : '🧭'}
          </span>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            {feedType === 'following'
              ? 'Follow travelers to see their posts'
              : 'No moments yet'}
          </h3>
          <p className="text-sm text-slate-500">
            {feedType === 'following'
              ? 'Posts from people you follow will appear here.'
              : 'Be the first to share a travel moment!'}
          </p>
        </div>
      )}

      {/* Post cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onReact={handleReact}
            onSave={handleSave}
            onUnsave={handleUnsave}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Create Moment Modal */}
      <CreateMomentModal open={showCreate} onClose={() => setShowCreate(false)} />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-bounce z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
