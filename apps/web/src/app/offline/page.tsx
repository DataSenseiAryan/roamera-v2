'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <WifiOff className="h-10 w-10 text-teal-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          You&apos;re offline
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          No internet connection detected. Some content may be available from cache. 
          Connect to the internet to access all Roamera features.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/trips"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            View Cached Trips
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-8">
          Roamera caches your trip data for offline access. Trip plans, packing lists, and your itinerary are available even without internet.
        </p>
      </div>
    </div>
  );
}
