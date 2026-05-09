'use client';

import { use } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, Loader2 } from 'lucide-react';
import { usePublicJourney } from '@roamera/sdk';
import type { JourneyEntry, ContentBlock } from '@roamera/types';

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-10 mb-3 font-serif">
          {block.text}
        </h2>
      );
    case 'text':
      return (
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
          {block.text}
        </p>
      );
    case 'quote':
      return (
        <blockquote className="border-l-4 border-amber-400 pl-6 my-6 italic text-slate-600 dark:text-slate-400 text-lg">
          <span>&ldquo;{block.text}&rdquo;</span>
          {block.author && (
            <span className="block text-sm font-medium mt-2 not-italic text-slate-500">
              — {block.author}
            </span>
          )}
        </blockquote>
      );
    case 'divider':
      return (
        <div className="my-10 flex items-center gap-4">
          <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
          <span className="text-slate-400 text-xl">✦</span>
          <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
        </div>
      );
    default:
      return null;
  }
}

function EntrySection({ entry }: { entry: JourneyEntry }) {
  const blocks = (entry.contentJson as ContentBlock[] | null) ?? [];
  return (
    <section className="mb-12">
      {entry.title && (
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 font-serif border-b border-amber-200 dark:border-amber-800 pb-2">
          {entry.title}
        </h3>
      )}
      <div className="space-y-4">
        {blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}
      </div>
    </section>
  );
}

export default function PublicJourneyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data, isLoading, isError } = usePublicJourney(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 dark:bg-slate-950 p-8 text-center">
        <BookOpen className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">
          Journey not found
        </h1>
        <p className="text-slate-500 mb-6">This journey may not be public or the link may be invalid.</p>
        <Link href="/" className="text-amber-600 hover:text-amber-700 font-medium">
          ← Back to Roamera
        </Link>
      </div>
    );
  }

  const { journey, entries, owner } = data;
  const ownerUser = owner as { username: string; avatarUrl: string | null } | null;
  const publishedDate = journey.createdAt
    ? new Date(
        typeof journey.createdAt === 'number' ? journey.createdAt * 1000 : journey.createdAt,
      ).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-slate-950">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <BookOpen className="h-12 w-12 text-white/80 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif leading-tight">
            {journey.title}
          </h1>
          {journey.description && (
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-6">{journey.description}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-white/70 text-sm">
            {ownerUser && (
              <span className="font-medium">by @{ownerUser.username}</span>
            )}
            {publishedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {publishedDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        {(entries as JourneyEntry[])?.map((entry) => (
          <EntrySection key={entry.id} entry={entry} />
        ))}

        {(!entries || (entries as JourneyEntry[]).length === 0) && (
          <p className="text-center text-slate-400 dark:text-slate-500 italic py-12">
            This journey has no entries yet.
          </p>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-amber-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
        <Link href="/" className="hover:text-amber-600 transition-colors">
          Roamera — Travel your story
        </Link>
      </footer>
    </div>
  );
}
