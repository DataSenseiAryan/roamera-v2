'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Globe, Lock, Loader2, X, FileText } from 'lucide-react';
import { useJourneys, useCreateJourney } from '@roamera/sdk';
import type { Journey } from '@roamera/types';

function JourneyCard({ journey }: { journey: Journey }) {
  const date = journey.createdAt
    ? new Date(typeof journey.createdAt === 'number' ? journey.createdAt * 1000 : journey.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <Link
      href={`/journeys/${journey.id}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-shadow block"
    >
      <div className="relative h-36 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600">
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="h-14 w-14 text-white/30" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
          <h3 className="font-bold text-white text-lg leading-tight line-clamp-2">{journey.title}</h3>
          <span
            className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1 ${
              journey.isPublic ? 'bg-white/25 text-white' : 'bg-slate-900/40 text-white'
            }`}
          >
            {journey.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {journey.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
      </div>

      <div className="p-4">
        {journey.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
            {journey.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {journey.role === 'owner' ? 'Owner' : 'Contributor'}
          </span>
          <span>{date}</span>
        </div>
      </div>
    </Link>
  );
}

export default function JourneysPage() {
  const { data: journeys, isLoading } = useJourneys();
  const createJourney = useCreateJourney();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await createJourney.mutateAsync({ title: form.title, description: form.description || undefined });
    setShowModal(false);
    setForm({ title: '', description: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-amber-500" />
              Journey Magazine
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Your travel journals, beautifully composed.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Journey
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : !journeys || journeys.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No journeys yet
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Start writing your travel stories.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              Create Your First Journey
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {journeys.map((j) => (
              <JourneyCard key={j.id} journey={j} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                New Journey
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Rajasthan Heritage Journal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="A brief overview of your journey..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJourney.isPending}
                  className="flex-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createJourney.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
