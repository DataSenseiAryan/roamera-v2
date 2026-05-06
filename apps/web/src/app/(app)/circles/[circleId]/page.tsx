'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Send,
  Users,
  BarChart3,
  Plus,
  X,
  Reply,
  Trash2,
  Globe,
  Lock,
  Calendar,
  LogOut,
  UserPlus,
  Crown,
} from 'lucide-react';
import {
  WsClient,
  getApiClient,
  circleKeys,
  useCircle,
  useCircleMessages,
  useCirclePolls,
  useCloseCirclePoll,
  useCreateCirclePoll,
  useDeleteCircleMessage,
  useInviteToCircle,
  useJoinCircle,
  useLeaveCircle,
  useReactToCircleMessage,
  useRemoveCircleMember,
  useSendCircleMessage,
  useVoteCirclePoll,
} from '@roamera/sdk';
import type { CircleMember, CircleMessage, CirclePoll } from '@roamera/types';
import { useAuthStore } from '@/lib/auth-store';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '✨'];

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

export default function CircleDetailPage({ params }: { params: Promise<{ circleId: string }> }) {
  const { circleId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: detail, isLoading: detailLoading, error: detailError } = useCircle(circleId);
  const { data: messages = [], isLoading: msgLoading } = useCircleMessages(circleId);
  const { data: polls = [] } = useCirclePolls(circleId);

  const sendMessage = useSendCircleMessage();
  const reactMessage = useReactToCircleMessage();
  const deleteMessage = useDeleteCircleMessage();
  const createPoll = useCreateCirclePoll();
  const votePoll = useVoteCirclePoll();
  const closePoll = useCloseCirclePoll();
  const joinCircle = useJoinCircle();
  const leaveCircle = useLeaveCircle();
  const inviteToCircle = useInviteToCircle();
  const removeMember = useRemoveCircleMember();

  const listEndRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<CircleMessage | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'polls' | 'members'>('polls');
  const [showPollModal, setShowPollModal] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

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
    client.subscribe([`circle:${circleId}`]);

    const inv = (event: string) =>
      client.on(event, () => {
        queryClient.invalidateQueries({ queryKey: circleKeys.messages(circleId) });
        queryClient.invalidateQueries({ queryKey: circleKeys.polls(circleId) });
        queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
      });

    const offs = [
      inv('circle:message'),
      inv('circle:reaction'),
      inv('circle:message_deleted'),
      inv('circle:poll_new'),
      inv('circle:poll_voted'),
      inv('circle:poll_closed'),
    ];

    return () => {
      offs.forEach((u) => u());
      client.disconnect();
    };
  }, [circleId, queryClient]);

  const msgById = new Map(messages.map((m) => [m.id, m]));

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !detail?.circle.myRole) return;
    await sendMessage.mutateAsync({
      circleId,
      content: text,
      replyToId: replyTo?.id,
    });
    setDraft('');
    setReplyTo(null);
  };

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (detailError || !detail) {
    return (
      <div className="text-center py-16 space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Circle unavailable</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">You may need an invite or this circle is private.</p>
        <Link href="/circles" className="text-teal-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Circles
        </Link>
      </div>
    );
  }

  const { circle, members, linkedTripTitle, memberCount } = detail;
  const canChat = !!circle.myRole;
  const isOwner = circle.myRole === 'owner';

  return (
    <div className="flex flex-col gap-4 min-h-[calc(100vh-120px)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/circles" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 mb-1">
            <ArrowLeft className="h-4 w-4" /> Circles
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">{circle.title}</h1>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                circle.isPublic ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {circle.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {circle.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
            {circle.destination && <span>{circle.destination}</span>}
            {circle.dateFrom && circle.dateTo && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(circle.dateFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} –{' '}
                {new Date(circle.dateTo).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {memberCount} members
            </span>
            {linkedTripTitle && <span className="text-orange-600 dark:text-orange-400">Trip: {linkedTripTitle}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!circle.myRole && circle.isPublic && (
            <button
              type="button"
              disabled={joinCircle.isPending}
              onClick={() =>
                joinCircle.mutate(circleId, {
                  onSuccess: () => queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) }),
                })
              }
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium"
            >
              {joinCircle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join circle'}
            </button>
          )}
          {circle.myRole && circle.myRole !== 'owner' && (
            <button
              type="button"
              disabled={leaveCircle.isPending}
              onClick={() =>
                leaveCircle.mutate(circleId, {
                  onSuccess: () => router.push('/circles'),
                })
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
            >
              <LogOut className="h-4 w-4" /> Leave
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-[420px] lg:min-h-[calc(100vh-240px)] bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-700">
            <span className="text-white font-semibold text-sm">Circle chat</span>
            {msgLoading && <Loader2 className="h-4 w-4 text-white/80 animate-spin" />}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/80 dark:bg-slate-950/40">
            {!canChat && (
              <p className="text-center text-sm text-slate-500 py-8">Join this circle to read and send messages.</p>
            )}
            {canChat &&
              messages.map((m) => {
                const parent = m.replyToId ? msgById.get(m.replyToId) : undefined;
                const canDelete = user && (m.userId === user.id || circle.ownerId === user.id);

                return (
                  <div key={m.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initials(m.author.username || '?')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{m.author.username}</span>
                        <span className="text-[10px] text-slate-400">{formatMsgTime(m.createdAt)}</span>
                      </div>

                      {parent && (
                        <div className="mt-1 mb-1 pl-3 border-l-2 border-teal-500/60 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          <span className="font-medium text-slate-600 dark:text-slate-300">{parent.author.username}: </span>
                          {parent.isDeleted ? <span className="italic">[Message deleted]</span> : parent.content}
                        </div>
                      )}

                      <div className="mt-1 text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">
                        {m.isDeleted ? <span className="text-slate-400 italic">[Message deleted]</span> : m.content}
                      </div>

                      {!m.isDeleted && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {m.reactions.map((r) => (
                            <button
                              key={r.emoji}
                              type="button"
                              onClick={() => void reactMessage.mutateAsync({ circleId, messageId: m.id, emoji: r.emoji })}
                              className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs hover:border-teal-400 transition"
                            >
                              {r.emoji} <span className="text-slate-500">{r.count}</span>
                            </button>
                          ))}
                          <span className="mx-1 text-slate-300 dark:text-slate-600">|</span>
                          {QUICK_EMOJIS.map((em) => (
                            <button
                              key={em}
                              type="button"
                              className="text-base hover:scale-110 transition px-0.5"
                              onClick={() => void reactMessage.mutateAsync({ circleId, messageId: m.id, emoji: em })}
                            >
                              {em}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="ml-1 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                            title="Reply"
                            onClick={() => setReplyTo(m)}
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                              title="Delete"
                              onClick={() => void deleteMessage.mutateAsync({ circleId, messageId: m.id })}
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

          {canChat && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              {replyTo && (
                <div className="mb-2 flex items-start justify-between gap-2 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900">
                  <div className="text-xs min-w-0">
                    <span className="font-medium text-teal-800 dark:text-teal-200">Replying to {replyTo.author.username}</span>
                    <p className="text-slate-600 dark:text-slate-400 truncate">{replyTo.content}</p>
                  </div>
                  <button type="button" onClick={() => setReplyTo(null)}>
                    <X className="h-4 w-4 text-slate-400" />
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
                  placeholder="Write a message…"
                  className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={sendMessage.isPending || !draft.trim()}
                  onClick={() => void handleSend()}
                  className="self-end p-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
                >
                  {sendMessage.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-96 shrink-0 flex flex-col gap-3 min-h-[320px]">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSidebarTab('polls')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium ${
                sidebarTab === 'polls' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <BarChart3 className="h-4 w-4" /> Polls
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('members')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium ${
                sidebarTab === 'members' ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Users className="h-4 w-4" /> Members
            </button>
          </div>

          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
            {sidebarTab === 'polls' ? (
              <PollsPane
                circleId={circleId}
                polls={polls}
                isOwner={isOwner}
                canParticipate={canChat}
                onOpenCreate={() => setShowPollModal(true)}
                votePoll={votePoll}
                closePoll={closePoll}
                createPoll={createPoll}
                showPollModal={showPollModal}
                onCloseCreate={() => setShowPollModal(false)}
              />
            ) : (
              <MembersPane
                circleId={circleId}
                ownerId={circle.ownerId}
                members={members}
                isOwner={isOwner}
                onInvite={() => setShowInvite(true)}
                showInvite={showInvite}
                onCloseInvite={() => setShowInvite(false)}
                inviteToCircle={inviteToCircle}
                removeMember={removeMember}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PollsPane({
  circleId,
  polls,
  isOwner,
  canParticipate,
  onOpenCreate,
  votePoll,
  closePoll,
  createPoll,
  showPollModal,
  onCloseCreate,
}: {
  circleId: string;
  polls: CirclePoll[];
  isOwner: boolean;
  canParticipate: boolean;
  onOpenCreate: () => void;
  votePoll: ReturnType<typeof useVoteCirclePoll>;
  closePoll: ReturnType<typeof useCloseCirclePoll>;
  createPoll: ReturnType<typeof useCreateCirclePoll>;
  showPollModal: boolean;
  onCloseCreate: () => void;
}) {
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState(['', '']);
  const [multi, setMulti] = useState(false);

  const totalVotes = (p: CirclePoll) => p.votes.reduce((s, v) => s + v.count, 0);

  const submitPoll = async () => {
    const options = opts.map((o) => o.trim()).filter(Boolean);
    if (!q.trim() || options.length < 2) return;
    await createPoll.mutateAsync({ circleId, question: q.trim(), options, isMultiple: multi });
    setQ('');
    setOpts(['', '']);
    setMulti(false);
    onCloseCreate();
  };

  const vote = async (poll: CirclePoll, optionIndex: number) => {
    if (!canParticipate || poll.isClosed) return;
    if (poll.isMultiple) {
      const set = new Set(poll.myVotes);
      if (set.has(optionIndex)) set.delete(optionIndex);
      else set.add(optionIndex);
      await votePoll.mutateAsync({ circleId, pollId: poll.id, optionIndices: [...set].sort((a, b) => a - b) });
    } else {
      await votePoll.mutateAsync({ circleId, pollId: poll.id, optionIndex });
    }
  };

  return (
    <>
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="font-semibold text-slate-900 dark:text-white text-sm">Polls</span>
        {canParticipate && (
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Create
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {polls.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">No polls yet. Spin one up for the group.</p>
        )}
        {polls.map((poll) => {
          const sum = totalVotes(poll) || 1;
          return (
            <div key={poll.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex justify-between gap-2">
                <p className="font-medium text-slate-900 dark:text-white text-sm">{poll.question}</p>
                {poll.isClosed && (
                  <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Closed</span>
                )}
              </div>
              <div className="space-y-2">
                {poll.options.map((label, i) => {
                  const count = poll.votes.find((v) => v.optionIndex === i)?.count ?? 0;
                  const pct = Math.round((count / sum) * 100);
                  const selected = poll.myVotes.includes(i);
                  const disabled = !canParticipate || poll.isClosed;

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => void vote(poll, i)}
                      className={`w-full text-left rounded-lg overflow-hidden border transition ${
                        selected ? 'border-teal-500 ring-1 ring-teal-500/40' : 'border-slate-200 dark:border-slate-700'
                      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-teal-400'}`}
                    >
                      <div className="relative px-3 py-2 text-xs">
                        <div
                          className="absolute inset-0 bg-teal-500/15 dark:bg-teal-400/10"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative flex justify-between gap-2">
                          <span className="text-slate-800 dark:text-slate-100">{label}</span>
                          <span className="text-slate-500 font-medium">{pct}%</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {isOwner && !poll.isClosed && (
                <button
                  type="button"
                  className="text-xs text-orange-600 dark:text-orange-400 font-medium hover:underline"
                  onClick={() => void closePoll.mutateAsync({ circleId, pollId: poll.id })}
                >
                  Close poll
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showPollModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">New poll</h3>
              <button type="button" onClick={onCloseCreate}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Question"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
            <div className="space-y-2">
              {opts.map((o, i) => (
                <input
                  key={i}
                  value={o}
                  onChange={(e) => {
                    const next = [...opts];
                    next[i] = e.target.value;
                    setOpts(next);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              ))}
              <button
                type="button"
                className="text-xs text-teal-600 font-medium"
                onClick={() => setOpts([...opts, ''])}
              >
                + Add option
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
              Allow multiple choices
            </label>
            <button
              type="button"
              disabled={createPoll.isPending}
              onClick={() => void submitPoll()}
              className="w-full py-2 rounded-xl bg-teal-600 text-white font-medium text-sm"
            >
              {createPoll.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create poll'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function MembersPane({
  circleId,
  ownerId,
  members,
  isOwner,
  onInvite,
  showInvite,
  onCloseInvite,
  inviteToCircle,
  removeMember,
}: {
  circleId: string;
  ownerId: string;
  members: CircleMember[];
  isOwner: boolean;
  onInvite: () => void;
  showInvite: boolean;
  onCloseInvite: () => void;
  inviteToCircle: ReturnType<typeof useInviteToCircle>;
  removeMember: ReturnType<typeof useRemoveCircleMember>;
}) {
  const [inviteUser, setInviteUser] = useState('');

  const submitInvite = async () => {
    const u = inviteUser.trim();
    if (!u) return;
    await inviteToCircle.mutateAsync({ circleId, usernames: [u] });
    setInviteUser('');
    onCloseInvite();
  };

  return (
    <>
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="font-semibold text-slate-900 dark:text-white text-sm">Members</span>
        {isOwner && (
          <button type="button" onClick={onInvite} className="flex items-center gap-1 text-xs font-medium text-teal-600">
            <UserPlus className="h-3.5 w-3.5" /> Invite
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold">
              {initials(m.username)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900 dark:text-white text-sm truncate">{m.username}</span>
                {(m.role === 'owner' || m.userId === ownerId) && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded-full">
                    <Crown className="h-3 w-3" /> Owner
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">{formatMsgTime(m.joinedAt)}</p>
            </div>
            {isOwner && m.role !== 'owner' && m.userId !== ownerId && (
              <button
                type="button"
                className="text-xs text-red-500 hover:underline"
                onClick={() => void removeMember.mutateAsync({ circleId, userId: m.userId })}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">Invite member</h3>
              <button type="button" onClick={onCloseInvite}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              value={inviteUser}
              onChange={(e) => setInviteUser(e.target.value)}
              placeholder="Username"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
            />
            <button
              type="button"
              disabled={inviteToCircle.isPending}
              onClick={() => void submitInvite()}
              className="w-full py-2 rounded-xl bg-teal-600 text-white text-sm font-medium"
            >
              {inviteToCircle.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Send invites'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
