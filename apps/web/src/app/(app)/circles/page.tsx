'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Plus, Globe, Lock, Calendar, Loader2, X } from 'lucide-react';
import { useCircles, useCreateCircle } from '@roamera/sdk';
import type { CircleListItem, CreateCircle } from '@roamera/types';

function CircleCard({ circle }: { circle: CircleListItem }) {
  const dateRange =
    circle.dateFrom && circle.dateTo
      ? `${new Date(circle.dateFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${new Date(circle.dateTo).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : 'Dates open';

  const roleColors: Record<string, string> = {
    owner: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    member: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  return (
    <Link
      href={`/circles/${circle.id}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-shadow block"
    >
      <div className="relative h-36 bg-gradient-to-br from-orange-400 via-orange-500 to-teal-600">
        <div className="absolute inset-0 flex items-center justify-center">
          <Users className="h-14 w-14 text-white/35" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
          <h3 className="font-bold text-white text-lg leading-tight truncate">{circle.title}</h3>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1 ${
                circle.isPublic ? 'bg-white/25 text-white' : 'bg-slate-900/40 text-white'
              }`}
            >
              {circle.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {circle.isPublic ? 'Public' : 'Private'}
            </span>
            {circle.myRole && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[circle.myRole] ?? 'bg-slate-100 text-slate-700'}`}
              >
                {circle.myRole}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {(circle.destination || circle.description) && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {circle.destination ?? circle.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {dateRange}
          </span>
          <span className="flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400">
            <Users className="h-3.5 w-3.5" />
            {circle.memberCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

function CreateCircleModal({ onClose }: { onClose: () => void }) {
  const createCircle = useCreateCircle();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload: CreateCircle = {
      title: title.trim(),
      description: description.trim() || undefined,
      destination: destination.trim() || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      isPublic,
    };
    await createCircle.mutateAsync(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">New Circle</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              placeholder="Summer in Lisbon"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              placeholder="Portugal"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative w-11 h-6 rounded-full transition ${isPublic ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-5' : ''}`}
              />
            </button>
            <span className="text-sm text-slate-700 dark:text-slate-300">Public circle</span>
          </label>
          <button
            type="submit"
            disabled={createCircle.isPending}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium flex items-center justify-center gap-2"
          >
            {createCircle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create Circle
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CirclesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: circles, isLoading } = useCircles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-7 w-7 text-teal-600" />
            Circles
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Plan meetups and chat with your travel crew
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Circle
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        </div>
      ) : circles && circles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map((c) => (
            <CircleCard key={c.id} circle={c} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No circles yet</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            Start a Travel Circle to coordinate dates, vote on plans, and chat in one place.
          </p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition"
          >
            <Plus className="h-4 w-4" />
            Create your first circle
          </button>
        </div>
      )}

      {showCreate && <CreateCircleModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
