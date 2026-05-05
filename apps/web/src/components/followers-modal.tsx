'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getApiClient } from '@roamera/sdk';
import type { User } from '@roamera/types';
import { UserCard } from './user-card';

interface FollowersModalProps {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

export function FollowersModal({ userId, type, onClose }: FollowersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApiClient()
      .get(`/api/v1/users/${userId}/${type}`)
      .then(({ data }) => setUsers(data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg w-full max-w-sm max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold capitalize">{type}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="text-center text-sm text-slate-500 py-8">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">No {type} yet</p>
          ) : (
            users.map((u) => <UserCard key={u.id} user={u} />)
          )}
        </div>
      </div>
    </div>
  );
}
