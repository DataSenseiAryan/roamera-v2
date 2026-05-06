'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Map, Plus, Calendar, Users, Globe, Loader2 } from 'lucide-react';
import { useTripsQuery } from '@roamera/sdk';
import type { Trip, AIItinerary } from '@roamera/types';
import { CreateTripModal } from '@/components/trips/create-trip-modal';

function TripCard({ trip }: { trip: Trip & { myRole?: string } }) {
  const dateRange = trip.dateFrom && trip.dateTo
    ? `${new Date(trip.dateFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${new Date(trip.dateTo).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'Dates not set';

  const roleColors: Record<string, string> = {
    owner: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    editor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-shadow block"
    >
      {/* Cover image */}
      <div className="relative h-40 bg-gradient-to-br from-teal-400 to-teal-600">
        {trip.coverUrl ? (
          <img src={trip.coverUrl} alt={trip.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Map className="h-12 w-12 text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <h3 className="font-bold text-white text-lg leading-tight truncate">{trip.title}</h3>
          {trip.myRole && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[trip.myRole] ?? roleColors.viewer}`}>
              {trip.myRole}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-2">
        {trip.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{trip.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {dateRange}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" />
            {trip.currency}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function TripsPage() {
  const searchParams = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [aiItinerary, setAiItinerary] = useState<AIItinerary | null>(null);
  const { data: trips, isLoading } = useTripsQuery();

  useEffect(() => {
    if (searchParams.get('importPlan') === 'true') {
      try {
        const stored = sessionStorage.getItem('aiItinerary');
        if (stored) {
          setAiItinerary(JSON.parse(stored));
          sessionStorage.removeItem('aiItinerary');
        }
      } catch { /* ignore parse errors */ }
      setShowCreate(true);
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Map className="h-6 w-6 text-teal-600" />
            My Trips
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Plan, collaborate, and explore together</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition"
        >
          <Plus className="h-4 w-4" />
          New Trip
        </button>
      </div>

      {/* Trip grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        </div>
      ) : trips && trips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No trips yet</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            Create your first trip and start adding days, places, and collaborators.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition"
          >
            <Plus className="h-4 w-4" />
            Create your first trip
          </button>
        </div>
      )}

      {showCreate && (
        <CreateTripModal
          onClose={() => { setShowCreate(false); setAiItinerary(null); }}
          aiItinerary={aiItinerary}
        />
      )}
    </div>
  );
}
