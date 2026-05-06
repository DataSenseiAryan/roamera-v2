'use client';

import { useState } from 'react';
import { MapPin, Star } from 'lucide-react';
import { useDestinationsQuery } from '@roamera/sdk';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'mountains', label: 'Mountains' },
  { value: 'beaches', label: 'Beaches' },
  { value: 'culture', label: 'Culture' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'nature', label: 'Nature' },
];

export default function DestinationsPage() {
  const [category, setCategory] = useState('');

  const { data: destinations, isLoading } = useDestinationsQuery(
    category ? { category } : undefined,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Destinations
        </h1>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              category === cat.value
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
              <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && destinations?.length === 0 && (
        <div className="text-center py-12">
          <span className="text-5xl block mb-4">🗺️</span>
          <p className="text-slate-500">No destinations found.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {destinations?.map((dest) => (
          <div
            key={dest.id}
            className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition group"
          >
            <div className="aspect-[16/10] bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800 flex items-center justify-center relative">
              {dest.coverUrl ? (
                <img
                  src={dest.coverUrl}
                  alt={dest.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MapPin className="h-10 w-10 text-teal-500/50" />
              )}
              {dest.isFeatured && (
                <span className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-lg">
                  <Star className="h-3 w-3" />
                  Featured
                </span>
              )}
              {dest.category && (
                <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm capitalize">
                  {dest.category}
                </span>
              )}
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 transition">
                  {dest.name}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {dest.country}
                </span>
              </div>
              {dest.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {dest.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
