'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Reply, Trash2, Pencil, X, ChevronDown } from 'lucide-react';
import {
  useCommentsQuery,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@roamera/sdk';
import { useAuthStore } from '@/lib/auth-store';
import type { Comment } from '@roamera/types';

interface CommentsSectionProps {
  postId: string;
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const user = useAuthStore((s) => s.user);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCommentsQuery(postId);
  const createComment = useCreateComment(postId);
  const updateComment = useUpdateComment(postId);
  const deleteComment = useDeleteComment(postId);

  const allComments = data?.pages.flatMap((p) => p.comments) ?? [];

  // Organize into top-level + replies
  const topLevel = allComments.filter((c) => !c.parentId);
  const repliesMap = new Map<string, Comment[]>();
  for (const c of allComments) {
    if (c.parentId) {
      const existing = repliesMap.get(c.parentId) ?? [];
      existing.push(c);
      repliesMap.set(c.parentId, existing);
    }
  }

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createComment.mutate(
      { content: newComment.trim(), parentId: replyingTo ?? undefined },
      {
        onSuccess: () => {
          setNewComment('');
          setReplyingTo(null);
        },
      },
    );
  };

  const handleEdit = (commentId: string) => {
    if (!editContent.trim()) return;
    updateComment.mutate(
      { commentId, content: editContent.trim() },
      { onSuccess: () => setEditingId(null) },
    );
  };

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = user?.id === comment.userId;
    const replies = repliesMap.get(comment.id) ?? [];

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-slate-100 dark:border-slate-800 pl-4' : ''}`}>
        <div className="flex gap-3 py-3">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.username}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center text-xs font-bold text-teal-600 flex-shrink-0">
              {comment.author.username[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {comment.author.username}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>

            {editingId === comment.id ? (
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit(comment.id)}
                />
                <button
                  onClick={() => handleEdit(comment.id)}
                  className="text-teal-600 hover:text-teal-700 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {comment.content}
              </p>
            )}

            <div className="flex items-center gap-3 mt-1">
              {!isReply && (
                <button
                  onClick={() => {
                    setReplyingTo(comment.id);
                    setNewComment('');
                  }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
              )}
              {isOwner && editingId !== comment.id && (
                <>
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteComment.mutate(comment.id)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {replies.map((r) => renderComment(r, true))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-slate-800 dark:text-slate-200">
        Comments
      </h4>

      {/* Comment list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {topLevel.map((c) => renderComment(c))}
      </div>

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 transition"
        >
          <ChevronDown className="h-4 w-4" />
          {isFetchingNextPage ? 'Loading...' : 'Load more'}
        </button>
      )}

      {allComments.length === 0 && (
        <p className="text-sm text-slate-400 py-4 text-center">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}

      {/* New comment input */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 text-xs text-teal-600">
            <Reply className="h-3 w-3" />
            <span>Replying to comment</span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
            rows={1}
            className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || createComment.isPending}
            className="p-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
