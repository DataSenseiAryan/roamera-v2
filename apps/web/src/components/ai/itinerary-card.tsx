'use client';

import { Clock, DollarSign, MapPin, Utensils, Train, Hotel, Activity } from 'lucide-react';
import type { DayPlan, Place } from '@roamera/types';

interface Props {
  day: DayPlan;
}

const placeTypeIcons: Record<string, React.ElementType> = {
  attraction: MapPin,
  food: Utensils,
  transport: Train,
  hotel: Hotel,
  activity: Activity,
};

function PlaceItem({ place }: { place: Place }) {
  const Icon = placeTypeIcons[place.type ?? 'attraction'] ?? MapPin;
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mt-0.5">
        <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{place.name}</p>
          {place.cost != null && (
            <span className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
              <DollarSign className="h-3 w-3" />
              ₹{place.cost.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {(place.time || place.duration) && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {[place.time, place.duration].filter(Boolean).join(' · ')}
          </p>
        )}
        {place.notes && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{place.notes}</p>
        )}
      </div>
    </div>
  );
}

export function ItineraryCard({ day }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card overflow-hidden">
      {/* Day Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-teal-100 uppercase tracking-wider">Day {day.dayNumber}</p>
          <h3 className="font-bold text-white text-sm mt-0.5">{day.title}</h3>
        </div>
        {day.totalCost != null && (
          <div className="text-right">
            <p className="text-xs text-teal-100">Est. Cost</p>
            <p className="text-sm font-bold text-white">₹{day.totalCost.toLocaleString('en-IN')}</p>
          </div>
        )}
      </div>

      {/* Places */}
      <div className="px-4 py-2">
        {day.places.length === 0 ? (
          <p className="text-sm text-slate-400 py-3 text-center">No activities planned</p>
        ) : (
          day.places.map((place, i) => <PlaceItem key={i} place={place} />)
        )}
      </div>

      {/* Day Notes */}
      {day.notes && (
        <div className="px-4 pb-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">{day.notes}</p>
        </div>
      )}
    </div>
  );
}
