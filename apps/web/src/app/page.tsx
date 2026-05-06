import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-6xl">🧭</div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Roamera
          </h1>
          <p className="text-xl text-primary-600 dark:text-primary-400 font-medium">
            Pack&amp;Go
          </p>
        </div>

        {/* Tagline */}
        <p className="text-2xl text-slate-600 dark:text-slate-300 font-light">
          You travel impromptu,{' '}
          <span className="text-primary-600 dark:text-primary-400 font-semibold">
            cuz we plan.
          </span>
        </p>

        {/* Auth CTA */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Create account
          </Link>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          S1–S4 live: Auth · Moments · AI Planner · Trip Planner
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            '🗺️ AI Trip Planner',
            '📸 Moments',
            '🤝 Travel Circles',
            '💰 JustSplit',
            '🌍 Atlas',
            '📓 Journey Magazine',
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 shadow-sm"
            >
              {f}
            </span>
          ))}
        </div>

        {/* Health link */}
        <div className="pt-4">
          <Link
            href="/health"
            className="text-sm text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 underline underline-offset-4 transition-colors"
          >
            Check API health →
          </Link>
        </div>
      </div>
    </main>
  );
}
