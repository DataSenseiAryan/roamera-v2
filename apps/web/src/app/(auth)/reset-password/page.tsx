'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { getApiClient } from '@roamera/sdk';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await getApiClient().post('/api/v1/auth/password/reset', { token, password });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-8 text-center space-y-4">
        <h2 className="text-xl font-semibold">Invalid link</h2>
        <p className="text-slate-600 dark:text-slate-400">No reset token provided.</p>
        <Link href="/forgot-password" className="text-primary-600 hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-8 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <h2 className="text-xl font-semibold">Password reset!</h2>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition"
        >
          Sign in with new password
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-8 space-y-6">
      <h2 className="text-xl font-semibold text-center">Set new password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            placeholder="••••••••"
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            placeholder="••••••••"
            minLength={8}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Reset password
        </button>
      </form>
    </div>
  );
}
