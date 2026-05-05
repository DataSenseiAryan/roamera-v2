'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiClient } from '@roamera/sdk';
import { useAuthStore } from '@/lib/auth-store';

export function AvatarUpload() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await getApiClient().post('/api/v1/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(data.user);
      toast.success('Avatar updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <div className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-2xl overflow-hidden">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          user?.username?.slice(0, 2).toUpperCase() ?? '?'
        )}
      </div>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow transition disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
