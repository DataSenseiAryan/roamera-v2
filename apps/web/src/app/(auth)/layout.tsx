export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🧭</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Roamera</h1>
          <p className="text-sm text-primary-600 dark:text-primary-400">Pack&Go</p>
        </div>
        {children}
      </div>
    </main>
  );
}
