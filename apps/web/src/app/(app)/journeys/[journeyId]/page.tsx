'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Share2,
  Users,
  Link2,
  Globe,
  Lock,
  Loader2,
  Type,
  Quote,
  Minus,
  Trash2,
  Check,
  Copy,
} from 'lucide-react';
import {
  useJourney,
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
  useShareJourney,
  useRevokeJourneyShare,
  useInviteContributor,
} from '@roamera/sdk';
import type { JourneyEntry, ContentBlock } from '@roamera/types';

type BlockType = 'heading' | 'text' | 'quote' | 'divider';

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-2">{block.text}</h2>;
    case 'text':
      return <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{block.text}</p>;
    case 'quote':
      return (
        <blockquote className="border-l-4 border-amber-400 pl-4 my-4 italic text-slate-600 dark:text-slate-400">
          {block.text}
          {block.author && <span className="block text-sm font-medium mt-1 not-italic">— {block.author}</span>}
        </blockquote>
      );
    case 'divider':
      return <hr className="my-6 border-slate-200 dark:border-slate-700" />;
    default:
      return null;
  }
}

function EntryCard({ entry, journeyId, isOwner }: { entry: JourneyEntry; journeyId: string; isOwner: boolean }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.title ?? '');
  const updateEntry = useUpdateEntry(journeyId);
  const deleteEntry = useDeleteEntry(journeyId);

  const blocks = (entry.contentJson as ContentBlock[] | null) ?? [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card">
      {editing ? (
        <div className="space-y-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Entry title..."
          />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await updateEntry.mutateAsync({ entryId: entry.id, data: { title: text } });
                setEditing(false);
              }}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Save
            </button>
            <button onClick={() => setEditing(false)} className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {entry.title && (
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-lg">{entry.title}</h3>
            )}
            <div className="space-y-2">
              {blocks.map((block, i) => (
                <BlockRenderer key={i} block={block} />
              ))}
              {blocks.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 italic text-sm">Empty entry…</p>
              )}
            </div>
          </div>
          {isOwner && (
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Edit"
              >
                <Type className="h-4 w-4" />
              </button>
              <button
                onClick={() => deleteEntry.mutate(entry.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JourneyEditorPage({ params }: { params: Promise<{ journeyId: string }> }) {
  const { journeyId } = use(params);
  const { data, isLoading } = useJourney(journeyId);
  const createEntry = useCreateEntry(journeyId);
  const shareJourney = useShareJourney(journeyId);
  const revokeShare = useRevokeJourneyShare(journeyId);
  const inviteContributor = useInviteContributor(journeyId);

  const [addingBlock, setAddingBlock] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>('text');
  const [blockText, setBlockText] = useState('');
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showContribs, setShowContribs] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-slate-500">Journey not found.</div>;

  const { journey, entries, contributors } = data;
  const isOwner = journey.role === 'owner';

  const handleAddEntry = async () => {
    if (!newEntryTitle.trim() && !blockText.trim()) return;
    const blocks: ContentBlock[] = blockText.trim()
      ? [{ type: blockType, text: blockText } as ContentBlock]
      : [];
    await createEntry.mutateAsync({
      title: newEntryTitle.trim() || undefined,
      contentJson: blocks,
      orderIndex: (entries?.length ?? 0),
    });
    setNewEntryTitle('');
    setBlockText('');
    setAddingBlock(false);
  };

  const handleShare = async () => {
    const token = await shareJourney.mutateAsync();
    const url = `${window.location.origin}/journeys/public/${token}`;
    setShareUrl(url);
  };

  const copyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back + Header */}
        <div className="flex items-start gap-4 mb-8">
          <Link
            href="/journeys"
            className="mt-1 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5 text-amber-500 shrink-0" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                {journey.title}
              </h1>
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                journey.isPublic
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {journey.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {journey.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            {journey.description && (
              <p className="text-slate-500 dark:text-slate-400 text-sm">{journey.description}</p>
            )}
          </div>
          {isOwner && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowContribs(!showContribs)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <Users className="h-4 w-4" />
                {(contributors as unknown[]).length}
              </button>
              <button
                onClick={journey.isPublic ? () => revokeShare.mutate() : handleShare}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              >
                <Share2 className="h-4 w-4" />
                {journey.isPublic ? 'Unshare' : 'Share'}
              </button>
            </div>
          )}
        </div>

        {/* Share URL banner */}
        {shareUrl && (
          <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 flex items-center gap-3">
            <Link2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm text-emerald-700 dark:text-emerald-300 flex-1 truncate">{shareUrl}</span>
            <button onClick={copyLink} className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg transition-colors">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {/* Contributors panel */}
        {showContribs && (
          <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" />
              Contributors
            </h3>
            <div className="space-y-2 mb-4">
              {(contributors as Array<{ userId: string; role: string; user: { username: string } | null }>).map((c) => (
                <div key={c.userId} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">@{c.user?.username ?? c.userId}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{c.role}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="username to invite"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                onClick={async () => {
                  if (inviteUsername.trim()) {
                    await inviteContributor.mutateAsync(inviteUsername.trim());
                    setInviteUsername('');
                  }
                }}
                disabled={inviteContributor.isPending}
                className="text-sm px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
              >
                Invite
              </button>
            </div>
          </div>
        )}

        {/* Entries */}
        <div className="space-y-5">
          {(entries as JourneyEntry[])?.map((entry) => (
            <EntryCard key={entry.id} entry={entry} journeyId={journeyId} isOwner={isOwner} />
          ))}
        </div>

        {/* Add Entry */}
        {isOwner && (
          <div className="mt-6">
            {addingBlock ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card space-y-4">
                <h3 className="font-medium text-slate-900 dark:text-white">New Entry</h3>
                <input
                  value={newEntryTitle}
                  onChange={(e) => setNewEntryTitle(e.target.value)}
                  placeholder="Entry title (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <div className="flex gap-2">
                  {(['text', 'heading', 'quote', 'divider'] as BlockType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setBlockType(t)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                        blockType === t
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-700 dark:text-amber-300'
                          : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {t === 'text' && <Type className="h-3 w-3" />}
                      {t === 'heading' && <span className="font-bold text-sm">H</span>}
                      {t === 'quote' && <Quote className="h-3 w-3" />}
                      {t === 'divider' && <Minus className="h-3 w-3" />}
                      {t}
                    </button>
                  ))}
                </div>
                {blockType !== 'divider' && (
                  <textarea
                    value={blockText}
                    onChange={(e) => setBlockText(e.target.value)}
                    placeholder={
                      blockType === 'heading'
                        ? 'Heading text…'
                        : blockType === 'quote'
                        ? 'Quote text…'
                        : 'Write your story…'
                    }
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddEntry}
                    disabled={createEntry.isPending}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {createEntry.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Add Entry
                  </button>
                  <button
                    onClick={() => setAddingBlock(false)}
                    className="text-sm px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingBlock(true)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Entry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
