'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Plane,
  IndianRupee,
  Trash2,
} from 'lucide-react';
import {
  usePostQuery,
  useReact,
  useSavePost,
  useUnsavePost,
  useDeletePost,
} from '@roamera/sdk';
import type { ReactionType } from '@roamera/types';
import { useAuthStore } from '@/lib/auth-store';
import { ReactionBar } from '@/components/posts/reaction-bar';
import { CommentsSection } from '@/components/posts/comments-section';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const user = useAuthStore((s) => s.user);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: post, isLoading } = usePostQuery(postId);
  const reactMutation = useReact(postId);
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();
  const deletePost = useDeletePost();

  const handleReact = useCallback(
    (type: ReactionType) => {
      reactMutation.mutate(
        { type },
        {
          onSuccess: (result) => {
            if ((result as { addedToBucketList?: boolean }).addedToBucketList) {
              setToastMessage('Added to Bucket List!');
              setTimeout(() => setToastMessage(null), 3000);
            }
          },
        },
      );
    },
    [reactMutation],
  );

  const handleDelete = () => {
    if (!confirm('Delete this moment? This cannot be undone.')) return;
    deletePost.mutate(postId, {
      onSuccess: () => router.push('/home'),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl block mb-4">🔍</span>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Moment not found
        </h2>
        <Link href="/home" className="text-teal-600 hover:underline mt-2 inline-block">
          Back to feed
        </Link>
      </div>
    );
  }

  const destinations = post.destinations ?? [];
  const isOwner = user?.id === post.userId;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-teal-600 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Photo Carousel */}
      {post.photos.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={post.photos[currentPhoto]?.url}
            alt={post.title}
            className="w-full aspect-[16/10] object-cover"
          />
          {post.photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhoto((p) => (p > 0 ? p - 1 : post.photos.length - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPhoto((p) => (p < post.photos.length - 1 ? p + 1 : 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {post.photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={`w-2 h-2 rounded-full transition ${
                      i === currentPhoto ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Post content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card space-y-4">
        {/* Author */}
        <div className="flex items-center justify-between">
          <Link
            href={`/u/${post.author.username}`}
            className="flex items-center gap-3 group"
          >
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center font-bold text-teal-600">
                {post.author.username[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition">
                {post.author.username}
              </span>
              <p className="text-xs text-slate-400">
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={handleDelete}
                className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() =>
                post.isSaved ? unsavePost.mutate(postId) : savePost.mutate(postId)
              }
              className={`p-2 rounded-lg transition ${
                post.isSaved
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-slate-400 hover:text-teal-600'
              }`}
            >
              {post.isSaved ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {post.title}
        </h1>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2">
          {destinations.map((d, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-sm bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-full"
            >
              <MapPin className="h-3.5 w-3.5" />
              {d.name}
              {d.country ? `, ${d.country}` : ''}
            </span>
          ))}
          {post.budgetInr && (
            <span className="flex items-center gap-1 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              <IndianRupee className="h-3.5 w-3.5" />
              {post.budgetInr.toLocaleString('en-IN')}
            </span>
          )}
          {post.vacationType && (
            <span className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full capitalize">
              {post.vacationType.replace('_', ' ')}
            </span>
          )}
          {post.transportMode && (
            <span className="flex items-center gap-1 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full capitalize">
              <Plane className="h-3.5 w-3.5" />
              {post.transportMode.replace('_', ' ')}
            </span>
          )}
          {post.dateFrom && (
            <span className="flex items-center gap-1 text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.dateFrom).toLocaleDateString()}
              {post.dateTo ? ` - ${new Date(post.dateTo).toLocaleDateString()}` : ''}
            </span>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        )}

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-sm text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Reactions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <ReactionBar
            postId={post.id}
            reactionCounts={post.reactionCounts}
            viewerReaction={post.viewerReaction as ReactionType | null}
            onReact={handleReact}
          />
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card">
        <CommentsSection postId={postId} />
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
