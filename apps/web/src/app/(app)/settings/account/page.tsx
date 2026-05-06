'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { PasswordChangeSchema, type PasswordChangeInput } from '@roamera/types';
import { getApiClient } from '@roamera/sdk';
import { useAuthStore } from '@/lib/auth-store';

export default function AccountPage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PasswordChangeInput>({
    resolver: zodResolver(PasswordChangeSchema),
  });

  const onChangePassword = async (data: PasswordChangeInput) => {
    setChangingPassword(true);
    try {
      await getApiClient().post('/api/v1/auth/password/change', data);
      toast.success('Password changed successfully');
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? Your account will be immediately and permanently deleted. This cannot be undone.')) return;

    setDeleting(true);
    try {
      await getApiClient().delete('/api/v1/users/me');
      toast.success('Account deleted');
      logout();
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-card space-y-4">
        <h2 className="text-lg font-semibold">Change Password</h2>
        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input
              type="password"
              {...register('currentPassword')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
            {errors.currentPassword && <p className="text-sm text-red-500 mt-1">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              {...register('newPassword')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
            {errors.newPassword && <p className="text-sm text-red-500 mt-1">{errors.newPassword.message}</p>}
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center gap-2"
          >
            {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
            Change password
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-card border border-red-200 dark:border-red-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4">
              Deleting your account is immediate and permanent. All your data (posts, trips,
              comments) will be anonymized and cannot be recovered.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete my account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
