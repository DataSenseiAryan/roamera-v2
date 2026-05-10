'use client';

import { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Share2,
  Link2,
  Globe,
  Lock,
  Loader2,
  Type,
  Quote,
  Minus,
  Check,
  Copy,
  X,
} from 'lucide-react';
import {
  useTripJournal,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
  useShareTripJournal,
  useRevokeTripJournalShare,
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

type EntryProps = {
  entry: JourneyEntry & { photos?: Array<{ id: string; url: string }> };
  tripId: string;
  canEdit: boolean;
};

function EntryCard({ entry, tripId, canEdit }: EntryProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.title ?? '');
  const updateEntry = useUpdateJournalEntry(tripId);
  const deleteEntry = useDeleteJournalEntry(tripId);
  const blocks = (entry.contentJson as ContentBlock[] | null) ?? [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card space-y-4">
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
              <Check className="h-3.5 w-3.5" /> Save
            </button>
            <button onClick={() => { setEditing(false); setText(entry.title ?? ''); }} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
            {entry.title || <span className="text-slate-400 italic text-base">Untitled entry</span>}
          </h3>
          {canEdit && (
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Edit title"
              >
                <Type className="h-4 w-4" />
              </button>
              <button
                onClick={() => deleteEntry.mutate(entry.id)}
                disabled={deleteEntry.isPending}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition"
                title="Delete entry"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content blocks */}
      {blocks.length > 0 && (
        <div className="space-y-3 prose prose-sm max-w-none dark:prose-invert">
          {blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
      )}

      {/* Photos */}
      {entry.photos && entry.photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {entry.photos.map((photo) => (
            <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-slate-400 dark:text-slate-500">
        {entry.createdAt
          ? new Date(typeof entry.createdAt === 'number' ? entry.createdAt * 1000 : entry.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : ''}
      </div>
    </div>
  );
}

type NewEntryBlockInput = {
  type: BlockType;
  text: string;
  author?: string;
};

export function JournalPanel({ tripId, canEdit }: { tripId: string; canEdit: boolean }) {
  const { data, isLoading } = useTripJournal(tripId);
  const createEntry = useCreateJournalEntry(tripId);
  const shareJournal = useShareTripJournal(tripId);
  const revokeShare = useRevokeTripJournalShare(tripId);

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [entryTitle, setEntryTitle] = useState('');
  const [blocks, setBlocks] = useState<NewEntryBlockInput[]>([{ type: 'text', text: '' }]);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const journal = data?.journal;
  const entries = data?.entries ?? [];

  const addBlock = (type: BlockType) => {
    setBlocks((prev) => [...prev, { type, text: '' }]);
  };

  const updateBlock = (idx: number, value: Partial<NewEntryBlockInput>) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...value } : b)));
  };

  const removeBlock = (idx: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateEntry = async () => {
    const contentJson = blocks
      .filter((b) => b.type === 'divider' || b.text.trim())
      .map((b) => {
        if (b.type === 'divider') return { type: 'divider' as const };
        if (b.type === 'quote') return { type: 'quote' as const, text: b.text, author: b.author };
        return { type: b.type as 'heading' | 'text', text: b.text };
      });

    await createEntry.mutateAsync({
      title: entryTitle.trim() || undefined,
      contentJson: contentJson.length > 0 ? contentJson : undefined,
      orderIndex: entries.length,
    });
    setEntryTitle('');
    setBlocks([{ type: 'text', text: '' }]);
    setShowAddEntry(false);
  };

  const handleShare = async () => {
    const token = await shareJournal.mutateAsync();
    setShareToken(token);
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/journal/public/${shareToken ?? journal?.shareToken}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Journal header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-500" />
          <h2 className="font-semibold text-slate-900 dark:text-white">Trip Journal</h2>
          {entries.length > 0 && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {journal && (
            <div className="flex items-center gap-1">
              {journal.isPublic ? (
                <span className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400">
                  <Globe className="h-3 w-3" /> Public
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Lock className="h-3 w-3" /> Private
                </span>
              )}
            </div>
          )}
          {canEdit && (
            <>
              {journal?.isPublic ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-teal-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                  <button
                    onClick={() => revokeShare.mutateAsync()}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <X className="h-3.5 w-3.5" /> Unpublish
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleShare}
                  disabled={shareJournal.isPending}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition"
                >
                  {shareJournal.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5" />
                  )}
                  Publish
                </button>
              )}
              <button
                onClick={() => setShowAddEntry(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition"
              >
                <Plus className="h-4 w-4" /> Add Entry
              </button>
            </>
          )}
        </div>
      </div>

      {/* Share link (shown after generating) */}
      {shareToken && journal && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 flex-1 truncate text-xs font-mono">
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/journal/public/${journal.shareToken ?? shareToken}`}
            </span>
            <button onClick={handleCopy} className="text-amber-600 hover:text-amber-700 dark:text-amber-400 flex-shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Add entry form */}
      {showAddEntry && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card border border-amber-200 dark:border-amber-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">New Journal Entry</h3>
            <button onClick={() => setShowAddEntry(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            value={entryTitle}
            onChange={(e) => setEntryTitle(e.target.value)}
            placeholder="Entry title (optional)..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
          />

          {/* Blocks */}
          <div className="space-y-3">
            {blocks.map((block, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                {block.type === 'divider' ? (
                  <div className="flex-1 flex items-center gap-2 py-2">
                    <hr className="flex-1 border-slate-300 dark:border-slate-600" />
                    <span className="text-xs text-slate-400">divider</span>
                    <hr className="flex-1 border-slate-300 dark:border-slate-600" />
                  </div>
                ) : (
                  <div className="flex-1 space-y-1">
                    <textarea
                      value={block.text}
                      onChange={(e) => updateBlock(idx, { text: e.target.value })}
                      placeholder={
                        block.type === 'heading'
                          ? 'Heading text...'
                          : block.type === 'quote'
                            ? 'Quote text...'
                            : 'Write your story...'
                      }
                      rows={block.type === 'text' ? 3 : 1}
                      className={`w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm resize-none ${
                        block.type === 'heading' ? 'font-bold' : block.type === 'quote' ? 'italic' : ''
                      }`}
                    />
                    {block.type === 'quote' && (
                      <input
                        value={block.author ?? ''}
                        onChange={(e) => updateBlock(idx, { author: e.target.value })}
                        placeholder="Attribution (optional)..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                      />
                    )}
                  </div>
                )}
                <button
                  onClick={() => removeBlock(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition mt-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add block buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => addBlock('text')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400">
              <Type className="h-3.5 w-3.5" /> Text
            </button>
            <button onClick={() => addBlock('heading')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400">
              <Type className="h-3.5 w-3.5 font-bold" /> Heading
            </button>
            <button onClick={() => addBlock('quote')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400">
              <Quote className="h-3.5 w-3.5" /> Quote
            </button>
            <button onClick={() => addBlock('divider')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400">
              <Minus className="h-3.5 w-3.5" /> Divider
            </button>
          </div>

          <button
            onClick={handleCreateEntry}
            disabled={createEntry.isPending}
            className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {createEntry.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Entry
          </button>
        </div>
      )}

      {/* Entries list */}
      {entries.length === 0 && !showAddEntry && (
        <div className="text-center py-16 space-y-3">
          <div className="text-5xl">📓</div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No journal entries yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Capture your memories, stories, and reflections from this trip.
          </p>
          {canEdit && (
            <button
              onClick={() => setShowAddEntry(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition"
            >
              <Plus className="h-4 w-4" /> Write your first entry
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} tripId={tripId} canEdit={canEdit} />
        ))}
      </div>
    </div>
  );
}
