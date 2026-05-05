'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { UpdateProfileSchema, type UpdateProfileInput } from '@roamera/types';
import { useAuthStore } from '@/lib/auth-store';
import { AvatarUpload } from '@/components/avatar-upload';
import { getApiClient } from '@roamera/sdk';

const INTERESTS = [
  'treks', 'cafes', 'culture', 'beaches', 'food',
  'adventure', 'wildlife', 'photography', 'history',
  'nightlife', 'wellness', 'workation',
] as const;

const BUDGET_BANDS = [
  { value: 'backpacker', label: 'Backpacker' },
  { value: 'mid_range', label: 'Mid Range' },
  { value: 'luxury', label: 'Luxury' },
] as const;

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      username: user?.username ?? '',
      bio: user?.bio ?? '',
      homeCity: user?.homeCity ?? '',
      budgetBand: user?.budgetBand ?? null,
      interests: (user?.interests as typeof INTERESTS[number][]) ?? [],
    },
  });

  const selectedInterests = watch('interests') ?? [];

  const toggleInterest = (interest: typeof INTERESTS[number]) => {
    const current = selectedInterests;
    if (current.includes(interest)) {
      setValue('interests', current.filter((i) => i !== interest));
    } else {
      setValue('interests', [...current, interest]);
    }
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setLoading(true);
    try {
      const { data: res } = await getApiClient().patch('/api/v1/users/me', data);
      setUser(res.user);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-card space-y-6">
        <div className="flex items-center gap-6">
          <AvatarUpload />
          <div>
            <p className="font-medium">{user?.username}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              {...register('username')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              {...register('bio')}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none"
              placeholder="Tell travelers about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Home City</label>
            <input
              {...register('homeCity')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="e.g. New Delhi, India"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Budget Band</label>
            <select
              {...register('budgetBand')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            >
              <option value="">Not set</option>
              {BUDGET_BANDS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    selectedInterests.includes(interest)
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </form>
      </div>
    </div>
  );
}
