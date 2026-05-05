'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { getApiClient } from '@roamera/sdk';

export default function OtpPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await getApiClient().post('/api/v1/auth/otp/send', { email });
      setStep('code');
      toast.success('Code sent to your email');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await getApiClient().post('/api/v1/auth/otp/verify', { email, code });
      login(data.accessToken, data.refreshToken, data.user);
      toast.success('Welcome!');
      router.push('/home');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-8 space-y-6">
      <h2 className="text-xl font-semibold text-center">
        {step === 'email' ? 'Sign in with OTP' : 'Enter verification code'}
      </h2>

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
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
            Send code
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-sm text-slate-500 hover:text-primary-600"
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="text-primary-600 hover:underline">
          Sign in with password
        </Link>
      </p>
    </div>
  );
}
