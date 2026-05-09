'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, Compass, MapPin, Bookmark, Search, Sparkles, Globe, Map, Users, Receipt, BookOpen, Globe2, Shield } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { getApiClient } from '@roamera/sdk';
import { NotificationBell } from './notification-bell';

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await getApiClient().post('/api/v1/auth/logout');
    } catch {}
    logout();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-xl">🧭</span>
          <span className="font-bold text-lg text-slate-900 dark:text-white">Roamera</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/home"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Compass Feed"
          >
            <Compass className="h-5 w-5" />
          </Link>
          <Link
            href="/destinations"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Destinations"
          >
            <MapPin className="h-5 w-5" />
          </Link>
          <Link
            href="/trips"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="My Trips"
          >
            <Map className="h-5 w-5" />
          </Link>
          <Link
            href="/circles"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Circles"
          >
            <Users className="h-5 w-5" />
          </Link>
          <Link
            href="/justsplit"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Split"
          >
            <Receipt className="h-5 w-5" />
          </Link>
          <Link
            href="/journeys"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Journey Magazine"
          >
            <BookOpen className="h-5 w-5" />
          </Link>
          <Link
            href="/atlas"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Atlas"
          >
            <Globe2 className="h-5 w-5" />
          </Link>
          <Link
            href="/saved"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Saved"
          >
            <Bookmark className="h-5 w-5" />
          </Link>
          <Link
            href="/search"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Search"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/ai-planner"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="AI Planner"
          >
            <Sparkles className="h-5 w-5" />
          </Link>
          <Link
            href="/travel"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="TravelLens"
          >
            <Globe className="h-5 w-5" />
          </Link>
          {user && (
            <>
              <NotificationBell />
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Admin Panel"
                >
                  <Shield className="h-5 w-5 text-orange-500" />
                </Link>
              )}
              <Link
                href={`/u/${user.username}`}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
              <Link
                href="/settings"
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400"
                title="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
