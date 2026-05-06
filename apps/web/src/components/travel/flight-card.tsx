'use client';

import { Plane, Clock, ExternalLink } from 'lucide-react';
import type { FlightResult } from '@roamera/types';

interface Props {
  flight: FlightResult;
}

function formatTime(dateStr?: string | null) {
  if (!dateStr) return '--:--';
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function FlightCard({ flight }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
            <Plane className="h-4 w-4 text-sky-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">{flight.airline}</p>
            <p className="text-xs text-slate-500">{flight.flightNumber}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-teal-600 text-lg">
            ₹{flight.price.total.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400">per person</p>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 my-3">
        <div className="text-center">
          <p className="font-bold text-slate-800 dark:text-white">{formatTime(flight.departure.at)}</p>
          <p className="text-xs font-medium text-slate-500">{flight.departure.airport}</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <Clock className="h-3 w-3" />
            {flight.duration ?? '--'}
          </div>
          <div className="w-full flex items-center gap-1">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <Plane className="h-3 w-3 text-slate-400 rotate-90" />
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 dark:text-white">{formatTime(flight.arrival.at)}</p>
          <p className="text-xs font-medium text-slate-500">{flight.arrival.airport}</p>
        </div>
      </div>

      {/* Book Buttons */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <a
          href={flight.deepLinks.googleFlights}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <ExternalLink className="h-3 w-3" />
          Google Flights
        </a>
        <a
          href={flight.deepLinks.skyscanner}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition"
        >
          <ExternalLink className="h-3 w-3" />
          Skyscanner
        </a>
        <a
          href={flight.deepLinks.makemytrip}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-orange-600 border border-orange-200 dark:border-orange-800 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
        >
          <ExternalLink className="h-3 w-3" />
          MakeMyTrip
        </a>
      </div>
    </div>
  );
}
