'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Send,
  MessageCircle,
  StickyNote,
  BarChart3,
  Plus,
  X,
  Reply,
  Trash2,
  Pin,
  PinOff,
} from 'lucide-react';
import {
  WsClient,
  getApiClient,
  collabKeys,
  useCloseCollabPoll,
  useCollabMessages,
  useCollabNotes,
  useCollabPolls,
  useCreateCollabNote,
  useCreateCollabPoll,
  useDeleteCollabMessage,
  useDeleteCollabNote,
  useReactToCollabMessage,
  useSendCollabMessage,
  useToggleNotePin,
  useTripQuery,
  useVoteCollabPoll,
} from '@roamera/sdk';
import type { CollabMessage, CollabNote, CollabPoll, User } from '@roamera/types';
import { useAuthStore } from '@/lib/auth-store';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '✨'];

const NOTE_COLORS = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#ffedd5'];

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function formatMsgTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function reactionList(m: CollabMessage): { emoji: string; count: number }[] {
  const rec = m.reactions ?? {};
  return Object.entries(rec).map(([emoji, count]) => ({ emoji, count }));
}

export function CollabPanel({ tripId, canEdit }: { tripId: string; canEdit: boolean }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'chat' | 'notes' | 'polls'>('chat');

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
    const client = new WsClient({
      baseUrl,
      tokenGetter: async () => {
        try {
          const { data } = await getApiClient().get<{ token: string }>('/api/v1/auth/ws-token');
          return data.token ?? null;
        } catch {
          return null;
        }
      },
    });
    void client.connect();
    client.subscribe([`trip:${tripId}`]);

    const bump = () => {
      queryClient.invalidateQueries({ queryKey: collabKeys.messages(tripId) });
      queryClient.invalidateQueries({ queryKey: collabKeys.notes(tripId) });
      queryClient.invalidateQueries({ queryKey: collabKeys.polls(tripId) });
    };

    const events = [
      'collab:message',
      'collab:reaction',
      'collab:message_deleted',
      'collab:note_created',
      'collab:note_updated',
      'collab:note_deleted',
      'collab:poll_new',
      'collab:poll_voted',
      'collab:poll_closed',
    ];

    const offs = events.map((ev) => client.on(ev, bump));

    return () => {
      offs.forEach((o) => o());
      client.disconnect();
    };
  }, [tripId, queryClient]);

  return (
    <div className="flex flex-col h-full min-h-[480px]">
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit m-4 mb-0 flex-wrap">
        {(
          [
            { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
            { id: 'notes' as const, label: 'Notes', icon: StickyNote },
            { id: 'polls' as const, label: 'Polls', icon: BarChart3 },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              subTab === t.id
                ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 pt-3">
        {subTab === 'chat' && <CollabChat tripId={tripId} user={user} />}
        {subTab === 'notes' && <CollabNotesTab tripId={tripId} user={user} canEdit={canEdit} />}
        {subTab === 'polls' && <CollabPollsTab tripId={tripId} canEdit={canEdit} />}
      </div>
    </div>
  );
}

function CollabChat({ tripId, user }: { tripId: string; user: User | null }) {
  const { data: tripData } = useTripQuery(tripId);
  const ownerId = tripData?.trip.ownerId;
  const { data: messages = [], isLoading } = useCollabMessages(tripId);
  const sendMessage = useSendCollabMessage();
  const reactMessage = useReactToCollabMessage();
  const deleteMessage = useDeleteCollabMessage();

  const listEndRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<CollabMessage | null>(null);

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const msgById = new Map(messages.map((m) => [m.id, m]));

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    await sendMessage.mutateAsync({ tripId, content: text, replyToId: replyTo?.id });
    setDraft('');
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-[min(70vh,560px)] bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-teal-600 to-orange-500">
        <span className="text-white text-sm font-semibold">Trip chat</span>
        {isLoading && <Loader2 className="h-4 w-4 text-white/90 animate-spin" />}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70 dark:bg-slate-950/50">
        {messages.map((m) => {
          const parent = m.replyToId ? msgById.get(m.replyToId) : undefined;
          const recs = reactionList(m);
          const mine = new Set(m.myReactions ?? []);
          const canDelete = user && (m.userId === user.id || ownerId === user.id);

          return (
            <div key={m.id} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {initials(m.username)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{m.username}</span>
                  <span className="text-[10px] text-slate-400">{formatMsgTime(m.createdAt)}</span>
                </div>
                {parent && (
                  <div className="mt-0.5 mb-1 pl-2 border-l-2 border-orange-400/70 text-[11px] text-slate-500 line-clamp-2">
                    <span className="font-medium">{parent.username}: </span>
                    {parent.isDeleted ? <span className="italic">[Message deleted]</span> : parent.content}
                  </div>
                )}
                <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">
                  {m.isDeleted ? <span className="text-slate-400 italic">[Message deleted]</span> : m.content}
                </p>
                {!m.isDeleted && (
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {recs.map((r) => (
                      <button
                        key={r.emoji}
                        type="button"
                        onClick={() => void reactMessage.mutateAsync({ tripId, messageId: m.id, emoji: r.emoji })}
                        className={`px-2 py-0.5 rounded-full border text-xs ${
                          mine.has(r.emoji)
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {r.emoji} <span className="text-slate-500">{r.count}</span>
                      </button>
                    ))}
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    {QUICK_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        className="text-base px-0.5 hover:scale-110 transition"
                        onClick={() => void reactMessage.mutateAsync({ tripId, messageId: m.id, emoji: em })}
                      >
                        {em}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="ml-1 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                      onClick={() => setReplyTo(m)}
                    >
                      <Reply className="h-3.5 w-3.5" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                        onClick={() => void deleteMessage.mutateAsync({ tripId, messageId: m.id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={listEndRef} />
      </div>
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        {replyTo && (
          <div className="mb-2 flex justify-between gap-2 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900 text-xs">
            <div className="min-w-0">
              <span className="font-medium text-orange-800 dark:text-orange-200">Reply to {replyTo.username}</span>
              <p className="truncate text-slate-600 dark:text-slate-400">{replyTo.content}</p>
            </div>
            <button type="button" onClick={() => setReplyTo(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
            placeholder="Share an update…"
          />
          <button
            type="button"
            disabled={sendMessage.isPending || !draft.trim()}
            onClick={() => void handleSend()}
            className="self-end p-3 rounded-xl bg-teal-600 text-white disabled:opacity-50"
          >
            {sendMessage.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function CollabNotesTab({
  tripId,
  user,
  canEdit,
}: {
  tripId: string;
  user: User | null;
  canEdit: boolean;
}) {
  const { data: notes = [], isLoading } = useCollabNotes(tripId);
  const createNote = useCreateCollabNote();
  const deleteNote = useDeleteCollabNote();
  const togglePin = useToggleNotePin();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);

  const submit = async () => {
    if (!title.trim()) return;
    await createNote.mutateAsync({
      tripId,
      title: title.trim(),
      content,
      category: category.trim() || null,
      color,
    });
    setTitle('');
    setContent('');
    setCategory('');
    setColor(NOTE_COLORS[0]);
    setOpen(false);
  };

  const sorted = [...notes].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Pinned notes stay at the top for the crew.</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Add Note
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              tripId={tripId}
              user={user}
              canEdit={canEdit}
              deleteNote={deleteNote}
              togglePin={togglePin}
            />
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700 p-5 space-y-3">
            <div className="flex justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">New note</h3>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Details…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm resize-none"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (optional)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
            />
            <div className="flex gap-2 flex-wrap">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-teal-600 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={createNote.isPending}
              onClick={() => void submit()}
              className="w-full py-2 rounded-xl bg-teal-600 text-white text-sm font-medium"
            >
              {createNote.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save note'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  tripId,
  user,
  canEdit,
  deleteNote,
  togglePin,
}: {
  note: CollabNote;
  tripId: string;
  user: User | null;
  canEdit: boolean;
  deleteNote: ReturnType<typeof useDeleteCollabNote>;
  togglePin: ReturnType<typeof useToggleNotePin>;
}) {
  const [expanded, setExpanded] = useState(false);
  const isAuthor = user?.id === note.userId;
  const canMutate = canEdit || isAuthor;

  return (
    <div
      className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-card flex flex-col gap-2 min-h-[140px]"
      style={{ backgroundColor: note.color ?? NOTE_COLORS[0] }}
    >
      <div className="flex justify-between gap-2 items-start">
        <div className="flex items-center gap-2 min-w-0">
          {note.isPinned && <Pin className="h-4 w-4 text-orange-600 shrink-0" />}
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{note.title}</h4>
        </div>
        <div className="flex gap-1 shrink-0">
          {canEdit && (
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-600"
              title={note.isPinned ? 'Unpin' : 'Pin'}
              onClick={() => void togglePin.mutateAsync({ tripId, noteId: note.id })}
            >
              {note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      {note.category && (
        <span className="text-[10px] uppercase tracking-wide font-semibold text-teal-700 dark:text-teal-300">
          {note.category}
        </span>
      )}
      <p className={`text-sm text-slate-700 dark:text-slate-200 ${expanded ? '' : 'line-clamp-3'}`}>{note.content}</p>
      {note.content.length > 120 && (
        <button type="button" className="text-xs text-teal-700 dark:text-teal-400 self-start" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
      {canMutate && (
        <div className="flex gap-2 mt-auto pt-2">
          <button
            type="button"
            className="text-xs text-red-600 dark:text-red-400 hover:underline"
            onClick={() => {
              if (confirm('Delete this note?')) void deleteNote.mutateAsync({ tripId, noteId: note.id });
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function CollabPollsTab({ tripId, canEdit }: { tripId: string; canEdit: boolean }) {
  const { data: polls = [], isLoading } = useCollabPolls(tripId);
  const createPoll = useCreateCollabPoll();
  const votePoll = useVoteCollabPoll();
  const closePoll = useCloseCollabPoll();

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState(['', '']);
  const [multi, setMulti] = useState(false);

  const totalVotes = (p: CollabPoll) => p.votes.reduce((s, v) => s + v.count, 0);

  const submitPoll = async () => {
    const options = opts.map((o) => o.trim()).filter(Boolean);
    if (!q.trim() || options.length < 2) return;
    await createPoll.mutateAsync({ tripId, question: q.trim(), options, isMultiple: multi });
    setQ('');
    setOpts(['', '']);
    setMulti(false);
    setOpen(false);
  };

  const vote = async (poll: CollabPoll, optionIndex: number) => {
    if (poll.isClosed) return;
    await votePoll.mutateAsync({ tripId, pollId: poll.id, optionIndex });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Quick decisions without endless group texts.</p>
        {canEdit && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Create Poll
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {polls.map((poll) => {
            const sum = totalVotes(poll) || 1;
            return (
              <div
                key={poll.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 shadow-card space-y-3"
              >
                <div className="flex justify-between gap-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white">{poll.question}</h4>
                  {poll.isClosed && <span className="text-[10px] font-bold uppercase text-slate-400">Closed</span>}
                </div>
                <div className="space-y-2">
                  {poll.options.map((label, i) => {
                    const count = poll.votes.find((v) => v.optionIndex === i)?.count ?? 0;
                    const pct = Math.round((count / sum) * 100);
                    const selected = poll.myVotes.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={poll.isClosed}
                        onClick={() => void vote(poll, i)}
                        className={`w-full text-left rounded-xl overflow-hidden border ${
                          selected ? 'border-teal-500 ring-1 ring-teal-500/30' : 'border-slate-200 dark:border-slate-700'
                        } ${poll.isClosed ? 'opacity-70 cursor-default' : 'hover:border-teal-400'}`}
                      >
                        <div className="relative px-3 py-2 text-sm">
                          <div
                            className="absolute inset-0 bg-orange-400/15 dark:bg-orange-400/10"
                            style={{ width: `${pct}%` }}
                          />
                          <div className="relative flex justify-between gap-2">
                            <span>{label}</span>
                            <span className="text-slate-500 text-xs">{pct}% · {count}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400">{poll.totalVoters} travelers voted</p>
                {canEdit && !poll.isClosed && (
                  <button
                    type="button"
                    className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
                    onClick={() => void closePoll.mutateAsync({ tripId, pollId: poll.id })}
                  >
                    Close poll
                  </button>
                )}
              </div>
            );
          })}
          {polls.length === 0 && (
            <p className="text-sm text-slate-500 py-8 text-center">No polls yet.</p>
          )}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">Create poll</h3>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Question"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
            />
            <div className="space-y-2">
              {opts.map((o, i) => (
                <input
                  key={i}
                  value={o}
                  onChange={(e) => {
                    const n = [...opts];
                    n[i] = e.target.value;
                    setOpts(n);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
                />
              ))}
              <button type="button" className="text-xs text-teal-600" onClick={() => setOpts([...opts, ''])}>
                + Add option
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
              Multiple choice (toggle options)
            </label>
            <button
              type="button"
              disabled={createPoll.isPending}
              onClick={() => void submitPoll()}
              className="w-full py-2 rounded-xl bg-teal-600 text-white text-sm"
            >
              {createPoll.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
