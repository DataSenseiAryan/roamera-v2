'use client';

import { useAuthStore } from '@/lib/auth-store';

export default function HomePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-card">
        <h1 className="text-2xl font-bold mb-2">
          Welcome, {user?.username ?? 'traveler'}! 🧭
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Your Compass feed will appear here in Sprint 2. For now, explore your profile and connect with other travelers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card text-center">
          <div className="text-3xl mb-2">📸</div>
          <h3 className="font-semibold">Moments</h3>
          <p className="text-sm text-slate-500">Coming in Sprint 2</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card text-center">
          <div className="text-3xl mb-2">✨</div>
          <h3 className="font-semibold">AI Planner</h3>
          <p className="text-sm text-slate-500">Coming in Sprint 3</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card text-center">
          <div className="text-3xl mb-2">🗺️</div>
          <h3 className="font-semibold">Trip Planner</h3>
          <p className="text-sm text-slate-500">Coming in Sprint 4</p>
        </div>
      </div>
    </div>
  );
}
