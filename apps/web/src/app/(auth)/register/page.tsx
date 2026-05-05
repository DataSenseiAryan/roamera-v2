'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { RegisterSchema, type RegisterInput } from '@roamera/types';
import { getApiClient } from '@roamera/sdk';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      await getApiClient().post('/api/v1/auth/register', data);
      setSuccess(true);
      toast.success('Account created! Check your email to verify.');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-8 text-center space-y-4">
        <div className="text-4xl">📧</div>
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-slate-600 dark:text-slate-400">
          We&apos;ve sent a verification link to your email. Click it to activate your account.
        </p>
        <Link href="/login" className="inline-block text-primary-600 hover:underline font-medium">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card p-8 space-y-6">
      <h2 className="text-xl font-semibold text-center">Create your account</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            {...register('username')}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            placeholder="your_username"
          />
          {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            {...register('password')}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            placeholder="••••••••"
          />
          {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
