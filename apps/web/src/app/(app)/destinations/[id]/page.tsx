'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Globe } from 'lucide-react';
import { useDestinationQuery, useSavePost, useUnsavePost, getApiClient } from '@roamera/sdk';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactionType } from '@roamera/types';
import { PostCard } from '@/components/posts/post-card';

export default function DestinationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useDestinationQuery(id);
  const queryClient = useQueryClient();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();

  const handleReact = async (postId: string, type: ReactionType) => {
    try {
      await getApiClient().post(`/api/v1/posts/${postId}/reactions`, { type });
      queryClient.invalidateQueries({ queryKey: ['feed', 'destinations', id] });
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-6" />
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl block mb-4">🗺️</span>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Destination not found</h2>
        <Link href="/destinations" className="text-teal-600 hover:text-teal-700 font-medium">
          Browse destinations
        </Link>
      </div>
    );
  }

  const { destination, recentPosts } = data;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link
        href="/destinations"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Destinations
      </Link>

      {/* Hero */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800">
        {destination.coverUrl ? (
          <img
            src={destination.coverUrl}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <MapPin className="h-16 w-16 text-teal-500/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl font-bold text-white mb-1">{destination.name}</h1>
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <span className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              {destination.country}
            </span>
            {destination.category && (
              <span className="capitalize bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                {destination.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {destination.description && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{destination.description}</p>
        </div>
      )}

      {/* Recent Moments */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Recent Moments from {destination.name}
        </h2>

        {recentPosts?.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-card text-center">
            <span className="text-4xl block mb-3">📸</span>
            <p className="text-slate-500">No moments shared from here yet.</p>
            <p className="text-sm text-slate-400 mt-1">Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentPosts?.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReact={handleReact}
                onSave={(pid) => savePost.mutate(pid)}
                onUnsave={(pid) => unsavePost.mutate(pid)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
