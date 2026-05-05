import Link from 'next/link';

interface HealthData {
  status: string;
  db: string;
  version: string;
  uptime_ms: number;
  timestamp: string;
}

async function getHealth(): Promise<HealthData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${apiUrl}/api/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<HealthData>;
  } catch {
    return null;
  }
}

export default async function HealthPage() {
  const health = await getHealth();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 text-sm"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            API Health
          </h1>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          {health ? (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Status</span>
                <span
                  className={`flex items-center gap-1.5 text-sm font-semibold ${
                    health.status === 'ok'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      health.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  {health.status}
                </span>
              </div>

              {/* DB */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Database</span>
                <span
                  className={`text-sm font-semibold ${
                    health.db === 'ok'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {health.db}
                </span>
              </div>

              {/* Version */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Version</span>
                <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                  {health.version}
                </span>
              </div>

              {/* Uptime */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Uptime</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {(health.uptime_ms / 1000).toFixed(1)}s
                </span>
              </div>

              {/* Timestamp */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Checked at</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(health.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xl">
                ⚠️
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Could not reach API at{' '}
                <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}
                </code>
              </p>
              <p className="text-xs text-slate-400">
                Make sure <code className="font-mono">apps/api</code> is running.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          Refreshes on each page load (no-store cache)
        </p>
      </div>
    </main>
  );
}
