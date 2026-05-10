'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Send, Reply, Trash2 } from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '✨'];

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function formatMsgTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export type ChatMessage = {
  id: string;
  userId: string;
  content: string;
  replyToId?: string | null;
  isDeleted?: boolean;
  reactions?: Record<string, number>;
  userReaction?: string | null;
  createdAt: string;
  author?: { id: string; username: string; avatarUrl?: string | null } | null;
};

export type ChatPanelProps = {
  messages: ChatMessage[];
  currentUserId: string | null | undefined;
  canEdit: boolean;
  isLoading?: boolean;
  onSend: (content: string, replyToId?: string | null) => Promise<void> | void;
  onDelete?: (messageId: string) => Promise<void> | void;
  onReact?: (messageId: string, emoji: string) => Promise<void> | void;
  placeholder?: string;
};

export function ChatPanel({
  messages,
  currentUserId,
  canEdit,
  isLoading,
  onSend,
  onDelete,
  onReact,
  placeholder = 'Type a message...',
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [sending, setSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await onSend(text, replyTo?.id ?? null);
      setDraft('');
      setReplyTo(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.userId === currentUserId;
          const replyTarget = msg.replyToId
            ? messages.find((m) => m.id === msg.replyToId)
            : null;

          return (
            <div key={msg.id} className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {msg.author?.username ? initials(msg.author.username) : '?'}
              </div>
              <div className={`max-w-[70%] space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Author + time */}
                <div className={`flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium">{msg.author?.username ?? 'Unknown'}</span>
                  <span>{formatMsgTime(msg.createdAt)}</span>
                </div>
                {/* Reply reference */}
                {replyTarget && (
                  <div className="text-xs bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 text-slate-500 dark:text-slate-400 border-l-2 border-teal-400 max-w-full truncate">
                    ↩ {replyTarget.author?.username}: {replyTarget.content}
                  </div>
                )}
                {/* Bubble */}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm break-words ${
                    msg.isDeleted
                      ? 'italic text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
                      : isOwn
                        ? 'bg-teal-500 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  }`}
                >
                  {msg.isDeleted ? 'This message was deleted' : msg.content}
                </div>
                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(msg.reactions).map(([emoji, cnt]) => (
                      <button
                        key={emoji}
                        onClick={() => onReact?.(msg.id, emoji)}
                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition ${
                          msg.userReaction === emoji
                            ? 'bg-teal-100 dark:bg-teal-900 border-teal-400 text-teal-700 dark:text-teal-300'
                            : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {emoji} {cnt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Message actions */}
              {!msg.isDeleted && (
                <div className={`hidden group-hover:flex items-center gap-1 self-center ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {QUICK_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => onReact?.(msg.id, e)}
                      className="text-sm hover:scale-125 transition-transform"
                      title={`React with ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                    title="Reply"
                  >
                    <Reply className="h-3.5 w-3.5" />
                  </button>
                  {(isOwn || canEdit) && (
                    <button
                      onClick={() => onDelete?.(msg.id)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={listEndRef} />
      </div>

      {/* Input area */}
      {canEdit && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-2 flex-shrink-0">
          {replyTo && (
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span>
                Replying to <strong>{replyTo.author?.username}</strong>: {replyTo.content.slice(0, 60)}
                {replyTo.content.length > 60 ? '...' : ''}
              </span>
              <button onClick={() => setReplyTo(null)} className="ml-2 text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!draft.trim() || sending}
              className="p-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
