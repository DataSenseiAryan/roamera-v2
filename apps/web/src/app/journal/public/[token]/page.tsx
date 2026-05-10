import { BookOpen, Calendar, MapPin } from 'lucide-react';
import type { ContentBlock } from '@roamera/types';

async function fetchPublicJournal(token: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${apiUrl}/api/v1/journal/public/${token}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-3">{block.text}</h2>;
    case 'text':
      return <p className="text-slate-700 leading-relaxed my-3">{block.text}</p>;
    case 'quote':
      return (
        <blockquote className="border-l-4 border-amber-400 pl-6 my-6 italic text-slate-600">
          <p>{block.text}</p>
          {block.author && <span className="block text-sm font-medium mt-2 not-italic text-slate-500">— {block.author}</span>}
        </blockquote>
      );
    case 'divider':
      return <hr className="my-8 border-slate-200" />;
    default:
      return null;
  }
}

export default async function PublicJournalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await fetchPublicJournal(token);

  if (!data) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl">📓</div>
          <h1 className="text-xl font-bold text-slate-900">Journal not found</h1>
          <p className="text-slate-500 text-sm">This journal may have been made private or deleted.</p>
        </div>
      </div>
    );
  }

  const { journal, entries, trip } = data as {
    journal: { title: string; description?: string; isPublic: boolean };
    entries: Array<{ id: string; title?: string; contentJson?: ContentBlock[] | null; createdAt?: string | number }>;
    trip?: { id: string; title: string };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-100 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-amber-500" />
          <div>
            <h1 className="font-bold text-slate-900 text-base">{journal.title}</h1>
            {trip && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {trip.title}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {journal.description && (
          <p className="text-slate-600 text-lg leading-relaxed italic border-l-4 border-amber-300 pl-4">
            {journal.description}
          </p>
        )}

        {entries.map((entry) => (
          <article key={entry.id} className="bg-white rounded-2xl p-8 shadow-sm space-y-4">
            {entry.title && (
              <h2 className="text-xl font-bold text-slate-900">{entry.title}</h2>
            )}
            {entry.createdAt && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(typeof entry.createdAt === 'number' ? entry.createdAt * 1000 : entry.createdAt).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            {(entry.contentJson ?? []).map((block, i) => (
              <BlockRenderer key={i} block={block} />
            ))}
          </article>
        ))}

        {entries.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No entries in this journal yet.</p>
          </div>
        )}

        <footer className="text-center text-xs text-slate-400 pt-8 pb-4">
          Shared with Roamera
        </footer>
      </div>
    </div>
  );
}
