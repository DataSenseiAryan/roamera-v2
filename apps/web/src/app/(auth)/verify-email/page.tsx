'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getApiClient } from '@roamera/sdk';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    getApiClient()
      .get(`/api/v1/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error ?? 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-8 text-center space-y-4">
      {status === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Verifying your email...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">{message}</h2>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition"
          >
            Sign in
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">Verification failed</h2>
          <p className="text-slate-600 dark:text-slate-400">{message}</p>
          <Link href="/login" className="text-primary-600 hover:underline">
            Back to login
          </Link>
        </>
      )}
    </div>
  );
}
