'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck, MessageCircle, MapPin } from 'lucide-react';
import type { Post, ReactionType } from '@roamera/types';
import { ReactionBar } from './reaction-bar';

interface PostCardProps {
  post: Post;
  onReact: (postId: string, type: ReactionType) => void;
  onSave: (postId: string) => void;
  onUnsave: (postId: string) => void;
}

export function PostCard({ post, onReact, onSave, onUnsave }: PostCardProps) {
  const destinations = post.destinations ?? [];
  const firstDest = destinations[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card overflow-hidden transition-shadow hover:shadow-lg">
      {/* Cover Image */}
      {post.coverUrl ? (
        <Link href={`/moments/${post.id}`}>
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={post.coverUrl}
              alt={post.title}
              className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            />
            {post.budgetInr && (
              <span className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-lg backdrop-blur-sm">
                ₹{post.budgetInr.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </Link>
      ) : (
        <Link href={`/moments/${post.id}`}>
          <div className="aspect-[16/9] bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800 flex items-center justify-center">
            <span className="text-5xl">📸</span>
          </div>
        </Link>
      )}

      <div className="p-4 space-y-3">
        {/* Author & Location */}
        <div className="flex items-center justify-between">
          <Link
            href={`/u/${post.author.username}`}
            className="flex items-center gap-2 group"
          >
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center text-sm font-bold text-teal-600">
                {post.author.username[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition">
              {post.author.username}
            </span>
          </Link>
          {firstDest && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3" />
              {firstDest.name}
              {firstDest.country ? `, ${firstDest.country}` : ''}
            </span>
          )}
        </div>

        {/* Title & Content */}
        <Link href={`/moments/${post.id}`}>
          <h3 className="font-semibold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition">
            {post.title}
          </h3>
        </Link>
        {post.content && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {post.content}
          </p>
        )}

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.hashtags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {post.hashtags.length > 4 && (
              <span className="text-xs text-slate-400">
                +{post.hashtags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Activity & Transport badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {post.vacationType && (
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full capitalize">
              {post.vacationType.replace('_', ' ')}
            </span>
          )}
          {post.transportMode && (
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full capitalize">
              {post.transportMode.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Reaction Bar + Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
          <ReactionBar
            postId={post.id}
            reactionCounts={post.reactionCounts}
            viewerReaction={post.viewerReaction as ReactionType | null}
            onReact={(type) => onReact(post.id, type)}
            compact
          />

          <div className="flex items-center gap-2">
            <Link
              href={`/moments/${post.id}`}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 transition"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.commentsCount}</span>
            </Link>
            <button
              onClick={() => (post.isSaved ? onUnsave(post.id) : onSave(post.id))}
              className={`p-1 rounded-lg transition ${
                post.isSaved
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-400 hover:text-teal-600'
              }`}
              title={post.isSaved ? 'Unsave' : 'Save'}
            >
              {post.isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
