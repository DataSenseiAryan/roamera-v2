import * as React from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  username?: string;
  className?: string;
}

const sizeMap: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

function getInitials(username?: string): string {
  if (!username) return '?';
  const parts = username.split(/[_.\s]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

const bgColors = [
  'bg-teal-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-emerald-500',
];

function getColorIndex(username?: string): number {
  if (!username) return 0;
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % bgColors.length;
}

export function Avatar({ src, alt, size = 'md', username, className = '' }: AvatarProps) {
  const sizeClass = sizeMap[size];
  const base = `inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${sizeClass} ${className}`;

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? username ?? 'avatar'}
        className={`${base} object-cover`}
      />
    );
  }

  const colorClass = bgColors[getColorIndex(username)];
  return (
    <div className={`${base} ${colorClass} text-white font-semibold`}>
      {getInitials(username)}
    </div>
  );
}
