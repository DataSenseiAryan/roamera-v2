'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, User, MapPin, FileText } from 'lucide-react';
import { useSearchQuery, useSavePost, useUnsavePost, getApiClient } from '@roamera/sdk';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactionType } from '@roamera/types';
import { PostCard } from '@/components/posts/post-card';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'people' | 'destinations'>('all');
  const queryClient = useQueryClient();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();

  const { data, isLoading } = useSearchQuery(query);

  const handleReact = useCallback(
    async (postId: string, type: ReactionType) => {
      try {
        await getApiClient().post(`/api/v1/posts/${postId}/reactions`, { type });
        queryClient.invalidateQueries({ queryKey: ['feed', 'search', query] });
      } catch {}
    },
    [queryClient, query],
  );

  const posts = data?.posts ?? [];
  const people = data?.users ?? [];
  const destinations = data?.destinations ?? [];
  const hasResults = posts.length > 0 || people.length > 0 || destinations.length > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search</h1>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search posts, people, destinations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
          autoFocus
        />
      </div>

      {query.length >= 2 && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['all', 'posts', 'people', 'destinations'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !hasResults && (
            <div className="text-center py-12">
              <span className="text-5xl block mb-4">🔍</span>
              <p className="text-slate-500">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {!isLoading && hasResults && (
            <div className="space-y-6">
              {/* People */}
              {(activeTab === 'all' || activeTab === 'people') && people.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    People
                  </h2>
                  <div className="space-y-2">
                    {people.map((user) => (
                      <Link
                        key={user.id}
                        href={`/u/${user.username}`}
                        className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl p-3 hover:shadow-md transition"
                      >
                        <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm overflow-hidden flex-shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                          ) : (
                            user.username.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">@{user.username}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Destinations */}
              {(activeTab === 'all' || activeTab === 'destinations') && destinations.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Destinations
                  </h2>
                  <div className="space-y-2">
                    {destinations.map((dest) => (
                      <Link
                        key={dest.id}
                        href={`/destinations/${dest.id}`}
                        className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl p-3 hover:shadow-md transition"
                      >
                        <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{dest.name}</p>
                          {dest.country && (
                            <p className="text-xs text-slate-500">{dest.country}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts */}
              {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Moments
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onReact={handleReact}
                        onSave={(id) => savePost.mutate(id)}
                        onUnsave={(id) => unsavePost.mutate(id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {query.length < 2 && (
        <div className="text-center py-12 text-slate-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  );
}
