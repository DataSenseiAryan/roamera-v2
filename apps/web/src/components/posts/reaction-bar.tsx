'use client';

import { useState } from 'react';
import type { ReactionType } from '@roamera/types';

const REACTIONS: Array<{ type: ReactionType; emoji: string; label: string }> = [
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'epic', emoji: '🔥', label: 'Epic' },
  { type: 'wander', emoji: '🌍', label: 'Wander' },
  { type: 'wanna_go', emoji: '📍', label: 'Wanna Go' },
  { type: 'amazing', emoji: '🤩', label: 'Amazing' },
];

interface ReactionBarProps {
  postId: string;
  reactionCounts: Record<string, number>;
  viewerReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
  compact?: boolean;
}

export function ReactionBar({
  reactionCounts,
  viewerReaction,
  onReact,
  compact = false,
}: ReactionBarProps) {
  const [animating, setAnimating] = useState<string | null>(null);

  const handleClick = (type: ReactionType) => {
    setAnimating(type);
    setTimeout(() => setAnimating(null), 600);
    onReact(type);
  };

  const totalCount = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-1">
      {REACTIONS.map(({ type, emoji, label }) => {
        const count = reactionCounts[type] ?? 0;
        const isActive = viewerReaction === type;
        const isAnimating = animating === type;

        return (
          <button
            key={type}
            onClick={() => handleClick(type)}
            title={label}
            className={`
              relative flex items-center gap-1 px-2 py-1 rounded-xl text-sm transition-all duration-200
              ${isActive
                ? 'bg-teal-50 dark:bg-teal-900/30 ring-1 ring-teal-300 dark:ring-teal-700'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }
            `}
          >
            <span
              className={`
                transition-transform duration-300
                ${isAnimating ? 'scale-150' : 'scale-100'}
                ${compact ? 'text-base' : 'text-lg'}
              `}
            >
              {emoji}
            </span>
            {count > 0 && (
              <span
                className={`
                  text-xs font-medium
                  ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}
                `}
              >
                {count}
              </span>
            )}
            {isAnimating && !isActive && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg animate-bounce">
                {emoji}
              </span>
            )}
          </button>
        );
      })}
      {!compact && totalCount > 0 && (
        <span className="ml-1 text-xs text-slate-400">{totalCount}</span>
      )}
    </div>
  );
}
