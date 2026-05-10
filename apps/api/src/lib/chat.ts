/**
 * Shared chat utilities used by both trip collab (collab.ts) and circles (circles.ts).
 * Both systems have structurally identical message/poll/reaction patterns.
 */

import { getPublicUrl } from './storage';

export function tsIso(v: Date | number | null | undefined): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString();
  return new Date(v * 1000).toISOString();
}

export type SerializedUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

export function serializeUser(u: {
  id: string;
  username: string;
  avatarKey?: string | null;
} | null | undefined): SerializedUser | null {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    avatarUrl: u.avatarKey ? getPublicUrl(u.avatarKey) : null,
  };
}

export type SerializedMessage = {
  id: string;
  contextId: string;
  userId: string;
  content: string;
  replyToId?: string | null;
  isDeleted: boolean;
  reactions: Record<string, number>;
  userReaction?: string | null;
  author: SerializedUser | null;
  createdAt: string;
  updatedAt: string;
};

export function buildReactionMap(
  reactions: Array<{ userId: string; emoji: string }>,
  viewerUserId?: string,
): { map: Record<string, number>; userReaction: string | null } {
  const map: Record<string, number> = {};
  let userReaction: string | null = null;
  for (const r of reactions) {
    map[r.emoji] = (map[r.emoji] ?? 0) + 1;
    if (viewerUserId && r.userId === viewerUserId) {
      userReaction = r.emoji;
    }
  }
  return { map, userReaction };
}
