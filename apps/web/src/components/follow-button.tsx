'use client';

import { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollowUser } from '@roamera/sdk';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onToggle?: () => void;
}

export function FollowButton({ userId, isFollowing: initialFollowing, onToggle }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const { mutate, isPending } = useFollowUser();

  const handleClick = () => {
    const action = following ? 'unfollow' : 'follow';
    mutate(
      { userId, action },
      {
        onSuccess: () => {
          setFollowing(!following);
          onToggle?.();
        },
      },
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`px-4 py-2 rounded-xl font-medium text-sm transition flex items-center gap-1.5 ${
        following
          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950'
          : 'bg-primary-600 hover:bg-primary-700 text-white'
      } disabled:opacity-50`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <UserMinus className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {following ? 'Unfollow' : 'Follow'}
    </button>
  );
}
