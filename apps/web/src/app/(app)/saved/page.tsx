'use client';

import { useState, useCallback } from 'react';
import { Bookmark, MapPin, Trash2 } from 'lucide-react';
import {
  useSavedPostsQuery,
  useBucketListQuery,
  useDeleteBucketList,
  useSavePost,
  useUnsavePost,
  getApiClient,
} from '@roamera/sdk';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactionType } from '@roamera/types';
import { PostCard } from '@/components/posts/post-card';

type Tab = 'saved' | 'bucket';

export default function SavedPage() {
  const [tab, setTab] = useState<Tab>('saved');
  const queryClient = useQueryClient();

  const { data: savedPosts, isLoading: loadingSaved } = useSavedPostsQuery();
  const { data: bucketItems, isLoading: loadingBucket } = useBucketListQuery();
  const deleteBucket = useDeleteBucketList();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();

  const handleReact = useCallback(
    async (postId: string, type: ReactionType) => {
      try {
        await getApiClient().post(`/api/v1/posts/${postId}/reactions`, { type });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
      } catch {
        // ignore
      }
    },
    [queryClient],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Saved
      </h1>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('saved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'saved'
              ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Bookmark className="h-4 w-4" />
            Saved Posts
          </span>
        </button>
        <button
          onClick={() => setTab('bucket')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'bucket'
              ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            Bucket List
          </span>
        </button>
      </div>

      {/* Saved Posts Tab */}
      {tab === 'saved' && (
        <>
          {loadingSaved && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 animate-pulse">
                  <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}
          {!loadingSaved && (!savedPosts || savedPosts.length === 0) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center">
              <span className="text-5xl block mb-4">📑</span>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                No saved posts yet
              </h3>
              <p className="text-sm text-slate-500">
                Save moments from the feed to revisit them later.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedPosts?.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReact={handleReact}
                onSave={(id) => savePost.mutate(id)}
                onUnsave={(id) => unsavePost.mutate(id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Bucket List Tab */}
      {tab === 'bucket' && (
        <>
          {loadingBucket && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                </div>
              ))}
            </div>
          )}
          {!loadingBucket && (!bucketItems || bucketItems.length === 0) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center">
              <span className="text-5xl block mb-4">📍</span>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Your bucket list is empty
              </h3>
              <p className="text-sm text-slate-500">
                React with &quot;Wanna Go&quot; on posts to add destinations here.
              </p>
            </div>
          )}
          <div className="space-y-3">
            {bucketItems?.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">
                      {item.placeName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {item.country ?? 'Unknown location'}
                      {item.note ? ` · ${item.note}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteBucket.mutate(item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
