'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Calendar, MapPin, Loader2, Lock } from 'lucide-react';
import { useSharedTripQuery } from '@roamera/sdk';
import type { Assignment, TripPlace } from '@roamera/types';

const TripMap = dynamic(() => import('@/components/trips/trip-map'), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
      <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
    </div>
  ),
});

export default function SharedTripPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data, isLoading, error } = useSharedTripQuery(token);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <Lock className="h-12 w-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Share link not found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">This link may have expired or been revoked.</p>
        <Link href="/" className="text-teal-600 hover:underline">Go to Roamera</Link>
      </div>
    );
  }

  const { trip, days, places, assignments } = data;
  const placeMap = new Map<string, TripPlace>(places.map((p) => [p.id, p]));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-500 dark:text-slate-400">
          <Lock className="h-3 w-3" /> Read-only shared view
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{trip.title}</h1>
        {trip.description && (
          <p className="text-slate-600 dark:text-slate-300">{trip.description}</p>
        )}
        {trip.dateFrom && trip.dateTo && (
          <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(trip.dateFrom).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })} –{' '}
            {new Date(trip.dateTo).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Map */}
      {places.some((p) => p.lat && p.lng) && (
        <div className="h-64 rounded-2xl overflow-hidden shadow-card">
          <TripMap places={places} selectedPlaceId={null} onPlaceClick={() => {}} />
        </div>
      )}

      {/* Days */}
      <div className="space-y-4">
        {days.map((day) => {
          const dayAssignments = assignments
            .filter((a: Assignment) => a.dayId === day.id)
            .sort((a: Assignment, b: Assignment) => a.orderIndex - b.orderIndex);

          return (
            <div key={day.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-card overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-3">
                <p className="text-xs font-medium text-teal-100 uppercase tracking-wider">Day {day.dayNumber}</p>
                <h3 className="font-bold text-white">{day.title}</h3>
                {day.date && (
                  <p className="text-xs text-teal-200">
                    {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>

              <div className="p-4 space-y-2">
                {dayAssignments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-3">No places planned</p>
                ) : (
                  dayAssignments.map((assign: Assignment) => {
                    const place = placeMap.get(assign.placeId);
                    if (!place) return null;
                    return (
                      <div key={assign.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <MapPin className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{place.name}</p>
                          {assign.placeTime && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {assign.placeTime}{assign.durationMinutes ? ` · ${assign.durationMinutes}min` : ''}
                            </p>
                          )}
                          {place.address && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">{place.address}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Powered by */}
      <div className="text-center text-sm text-slate-400">
        Created with{' '}
        <Link href="/" className="text-teal-600 hover:underline font-medium">Roamera 🧭</Link>
      </div>
    </div>
  );
}
