'use client';

import { Hotel, Star, ExternalLink } from 'lucide-react';
import type { HotelResult } from '@roamera/types';

interface Props {
  hotel: HotelResult;
}

export function HotelCard({ hotel }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <Hotel className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">{hotel.name}</p>
            {hotel.rating != null && (
              <div className="flex items-center gap-0.5 mt-0.5">
                {Array.from({ length: hotel.rating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
                ))}
              </div>
            )}
          </div>
        </div>
        {hotel.price && (
          <div className="text-right">
            <p className="font-bold text-teal-600 text-lg">
              ₹{hotel.price.total.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400">per night</p>
          </div>
        )}
      </div>

      {/* Book Buttons */}
      <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <a
          href={hotel.deepLinks.booking}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          <ExternalLink className="h-3 w-3" />
          Booking.com
        </a>
        <a
          href={hotel.deepLinks.makemytrip}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-orange-600 border border-orange-200 dark:border-orange-800 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
        >
          <ExternalLink className="h-3 w-3" />
          MakeMyTrip
        </a>
        <a
          href={hotel.deepLinks.agoda}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-slate-600 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <ExternalLink className="h-3 w-3" />
          Agoda
        </a>
      </div>
    </div>
  );
}
