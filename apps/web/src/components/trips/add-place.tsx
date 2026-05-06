'use client';

import { useState, useCallback } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { useMapAutocomplete, useCreatePlace } from '@roamera/sdk';
import type { MapSearchResult } from '@roamera/types';

interface Props {
  tripId: string;
  dayId?: string;
  onPlaceAdded?: (placeId: string) => void;
  onClose?: () => void;
}

const CATEGORIES = [
  { value: 'attraction', label: '📸 Attraction' },
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'museum', label: '🏛️ Museum' },
  { value: 'transport', label: '🚌 Transport' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'cafe', label: '☕ Cafe' },
  { value: 'activity', label: '🏄 Activity' },
];

export function AddPlacePanel({ tripId, dayId, onPlaceAdded, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<MapSearchResult | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('attraction');
  const [notes, setNotes] = useState('');

  const { data: suggestions, isLoading: searching } = useMapAutocomplete(query);
  const createPlace = useCreatePlace();

  const handleSelectSuggestion = useCallback((result: MapSearchResult) => {
    setSelectedResult(result);
    setName(result.shortName ?? (result.displayName as string).split(',')[0]);
    setQuery('');
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;

    try {
      const place = await createPlace.mutateAsync({
        tripId,
        data: {
          name: name.trim(),
          lat: selectedResult?.lat,
          lng: selectedResult?.lng,
          address: selectedResult?.displayName as string | undefined,
          category,
          notes: notes.trim() || undefined,
        },
      });

      onPlaceAdded?.(place.id);
      setSelectedResult(null);
      setName('');
      setNotes('');
      setQuery('');
    } catch {
      // handled by mutation state
    }
  };

  return (
    <div className="space-y-4">
      {onClose && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">Add a Place</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search places (Nominatim)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Autocomplete suggestions */}
      {suggestions && suggestions.length > 0 && query.length >= 2 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {suggestions.map((r) => (
            <button
              key={String(r.placeId)}
              onClick={() => handleSelectSuggestion(r)}
              className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition"
            >
              <MapPin className="h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{r.displayName as string}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected location indicator */}
      {selectedResult && (
        <div className="flex items-center gap-2 p-2 bg-teal-50 dark:bg-teal-900/20 rounded-xl text-sm">
          <MapPin className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <span className="text-teal-800 dark:text-teal-300 truncate">{selectedResult.displayName as string}</span>
          <button onClick={() => setSelectedResult(null)} className="ml-auto text-teal-600 hover:text-teal-800">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Place Name</label>
        <input
          type="text"
          placeholder="Enter a name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
        <div className="grid grid-cols-2 gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition
                ${category === c.value
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Tips, reminders, etc."
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      </div>

      <button
        onClick={handleAdd}
        disabled={!name.trim() || createPlace.isPending}
        className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {createPlace.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        Add Place
      </button>
    </div>
  );
}
