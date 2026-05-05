'use client';

import Link from 'next/link';
import type { User } from '@roamera/types';

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Link
      href={`/u/${user.username}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
    >
      <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium text-sm overflow-hidden">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
        ) : (
          user.username.slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{user.username}</p>
        {user.bio && (
          <p className="text-xs text-slate-500 truncate">{user.bio}</p>
        )}
      </div>
    </Link>
  );
}
