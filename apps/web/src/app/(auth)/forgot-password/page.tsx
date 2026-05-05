'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { getApiClient } from '@roamera/sdk';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await getApiClient().post('/api/v1/auth/password/reset-request', { email });
      setSent(true);
      toast.success('If an account exists, a reset link has been sent.');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-8 text-center space-y-4">
        <div className="text-4xl">📧</div>
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-slate-600 dark:text-slate-400">
          If an account with that email exists, we&apos;ve sent a password reset link.
        </p>
        <Link href="/login" className="inline-block text-primary-600 hover:underline font-medium">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-8 space-y-6">
      <h2 className="text-xl font-semibold text-center">Reset your password</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            placeholder="you@example.com"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send reset link
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="text-primary-600 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
