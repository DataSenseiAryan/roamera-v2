'use client';

import { useState } from 'react';
import { Globe2, Map, TrendingUp, Check, X, Search, Loader2 } from 'lucide-react';
import {
  useVisitedCountries,
  useAtlasStats,
  useMarkCountryVisited,
  useUnmarkCountry,
} from '@roamera/sdk';
import type { VisitedCountry, AtlasStats } from '@roamera/types';

// Static list of countries for search autocomplete
const COUNTRY_LIST = [
  { code: 'IN', name: 'India' }, { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' }, { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' }, { code: 'PT', name: 'Portugal' }, { code: 'JP', name: 'Japan' },
  { code: 'TH', name: 'Thailand' }, { code: 'ID', name: 'Indonesia' }, { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' }, { code: 'VN', name: 'Vietnam' }, { code: 'NP', name: 'Nepal' },
  { code: 'LK', name: 'Sri Lanka' }, { code: 'AU', name: 'Australia' }, { code: 'NZ', name: 'New Zealand' },
  { code: 'CA', name: 'Canada' }, { code: 'MX', name: 'Mexico' }, { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' }, { code: 'ZA', name: 'South Africa' }, { code: 'EG', name: 'Egypt' },
  { code: 'NG', name: 'Nigeria' }, { code: 'KE', name: 'Kenya' }, { code: 'MA', name: 'Morocco' },
  { code: 'TR', name: 'Turkey' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'RU', name: 'Russia' }, { code: 'CN', name: 'China' }, { code: 'KR', name: 'South Korea' },
  { code: 'PH', name: 'Philippines' }, { code: 'PK', name: 'Pakistan' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'GR', name: 'Greece' }, { code: 'CH', name: 'Switzerland' }, { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' }, { code: 'NO', name: 'Norway' }, { code: 'DK', name: 'Denmark' },
];

const CONTINENT_COLORS: Record<string, string> = {
  Asia: 'bg-teal-500',
  Europe: 'bg-blue-500',
  Africa: 'bg-amber-500',
  'North America': 'bg-orange-500',
  'South America': 'bg-green-500',
  Oceania: 'bg-purple-500',
  Unknown: 'bg-slate-500',
};

function StatsPanel({ stats }: { stats: AtlasStats }) {
  return (
    <div className="space-y-5">
      {/* Progress ring */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card text-center">
        <div className="relative inline-flex items-center justify-center mb-3">
          <svg className="w-28 h-28" viewBox="0 0 36 36">
            <circle className="text-slate-200 dark:text-slate-700" strokeWidth="3" stroke="currentColor" fill="transparent" r="15.9155" cx="18" cy="18" />
            <circle
              className="text-teal-500"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r="15.9155"
              cx="18"
              cy="18"
              strokeDasharray={`${stats.percentage} ${100 - stats.percentage}`}
              strokeDashoffset="25"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalCountries}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">of {stats.totalPossible}</div>
          </div>
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          {stats.percentage}% of the world
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">countries visited</p>
      </div>

      {/* Continent breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-teal-500" />
          By Continent
        </h3>
        {stats.continentBreakdown.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.continentBreakdown
              .sort((a, b) => b.count - a.count)
              .map((c) => (
                <div key={c.continent}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{c.continent}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{c.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CONTINENT_COLORS[c.continent] ?? 'bg-slate-500'}`}
                      style={{ width: `${Math.min((c.count / stats.totalCountries) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CountryChip({ country, onUnmark }: { country: VisitedCountry; onUnmark: (code: string) => void }) {
  const date = country.visitedAt
    ? new Date(typeof country.visitedAt === 'number' ? country.visitedAt * 1000 : country.visitedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })
    : '';

  return (
    <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl px-3 py-2">
      <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
          {country.countryName ?? country.countryCode}
        </div>
        {date && <div className="text-xs text-slate-500 dark:text-slate-400">{date}</div>}
      </div>
      <button
        onClick={() => onUnmark(country.countryCode)}
        className="text-slate-400 hover:text-red-500 transition-colors"
        title="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function AtlasPage() {
  const { data: countries, isLoading: countriesLoading } = useVisitedCountries();
  const { data: stats, isLoading: statsLoading } = useAtlasStats();
  const markVisited = useMarkCountryVisited();
  const unmarkCountry = useUnmarkCountry();

  const [search, setSearch] = useState('');

  const visitedCodes = new Set(countries?.map((c) => c.countryCode) ?? []);

  const filteredSuggestions = search.trim().length >= 1
    ? COUNTRY_LIST.filter(
        (c) =>
          !visitedCodes.has(c.code) &&
          c.name.toLowerCase().includes(search.toLowerCase()),
      ).slice(0, 8)
    : [];

  const isLoading = countriesLoading || statsLoading;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe2 className="h-8 w-8 text-teal-500" />
            My Atlas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Track the countries you&apos;ve visited and explore the world.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: World visual + search */}
            <div className="lg:col-span-2 space-y-5">
              {/* World map placeholder (SVG) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Map className="h-5 w-5 text-teal-500" />
                  <h2 className="font-semibold text-slate-900 dark:text-white">World Map</h2>
                </div>
                {/* Simplified visual world map using continent grid */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 min-h-48 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                    {['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'].map((continent) => {
                      const count = stats?.continentBreakdown.find((c) => c.continent === continent)?.count ?? 0;
                      const hasVisited = count > 0;
                      return (
                        <div
                          key={continent}
                          className={`rounded-xl p-3 text-center transition-colors ${
                            hasVisited
                              ? `${CONTINENT_COLORS[continent]} text-white`
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <div className="font-semibold text-sm">{continent.split(' ').pop()}</div>
                          <div className={`text-xl font-bold ${hasVisited ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                            {count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mark country visited */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card">
                <h2 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4 text-teal-500" />
                  Mark Country Visited
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search for a country..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  {filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                      {filteredSuggestions.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => {
                            markVisited.mutate(c.code);
                            setSearch('');
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 flex items-center justify-between group transition-colors"
                        >
                          <span className="text-sm text-slate-700 dark:text-slate-300">{c.name}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                            {c.code} + Add
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Visited countries grid */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card">
                <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
                  Visited Countries ({countries?.length ?? 0})
                </h2>
                {!countries || countries.length === 0 ? (
                  <p className="text-center text-slate-400 dark:text-slate-500 italic py-6">
                    No countries yet. Start adding them above!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {countries.map((c) => (
                      <CountryChip
                        key={c.id}
                        country={c}
                        onUnmark={(code) => unmarkCountry.mutate(code)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Stats */}
            <div>
              {stats ? (
                <StatsPanel stats={stats} />
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card text-center text-slate-400">
                  No stats yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
