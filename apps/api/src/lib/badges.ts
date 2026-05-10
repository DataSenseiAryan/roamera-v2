import crypto from 'crypto';
import { count, eq } from 'drizzle-orm';

import { db } from '../db/client';
import {
  posts,
  trips,
  journeys,
  visitedCountries,
  circleMembers,
  expenseGroups,
  expenseGroupMembers,
  userBadges,
} from '../db/schema';

type BadgeType =
  | 'first_post'
  | 'ten_posts'
  | 'first_journey'
  | 'five_countries'
  | 'ten_countries'
  | 'first_trip'
  | 'group_traveler'
  | 'budget_master';

interface BadgeDef {
  type: BadgeType;
  name: string;
  icon: string;
  description: string;
  check: (userId: string) => Promise<boolean>;
}

const BADGE_DEFINITIONS: BadgeDef[] = [
  {
    type: 'first_post',
    name: 'First Moment',
    icon: '📸',
    description: 'Shared your first travel Moment',
    check: async (userId) => {
      const [row] = await db.select({ c: count() }).from(posts).where(eq(posts.userId, userId));
      return (row?.c ?? 0) >= 1;
    },
  },
  {
    type: 'ten_posts',
    name: 'Storyteller',
    icon: '✍️',
    description: 'Shared 10 travel Moments',
    check: async (userId) => {
      const [row] = await db.select({ c: count() }).from(posts).where(eq(posts.userId, userId));
      return (row?.c ?? 0) >= 10;
    },
  },
  {
    type: 'first_journey',
    name: 'Journal Keeper',
    icon: '📓',
    description: 'Wrote your first trip journal',
    check: async (userId) => {
      // S12: count trip-scoped journals (tripId is set)
      const [row] = await db.select({ c: count() }).from(journeys).where(eq(journeys.userId, userId));
      return (row?.c ?? 0) >= 1;
    },
  },
  {
    type: 'five_countries',
    name: 'Globetrotter',
    icon: '🌍',
    description: 'Visited 5 countries',
    check: async (userId) => {
      const [row] = await db.select({ c: count() }).from(visitedCountries).where(eq(visitedCountries.userId, userId));
      return (row?.c ?? 0) >= 5;
    },
  },
  {
    type: 'ten_countries',
    name: 'World Explorer',
    icon: '🗺️',
    description: 'Visited 10 countries',
    check: async (userId) => {
      const [row] = await db.select({ c: count() }).from(visitedCountries).where(eq(visitedCountries.userId, userId));
      return (row?.c ?? 0) >= 10;
    },
  },
  {
    type: 'first_trip',
    name: 'Trip Planner',
    icon: '🗓️',
    description: 'Planned your first trip',
    check: async (userId) => {
      const [row] = await db.select({ c: count() }).from(trips).where(eq(trips.ownerId, userId));
      return (row?.c ?? 0) >= 1;
    },
  },
  {
    type: 'group_traveler',
    name: 'Social Butterfly',
    icon: '🦋',
    description: 'Joined 3 or more Circles',
    check: async (userId) => {
      const [row] = await db.select({ c: count() }).from(circleMembers).where(eq(circleMembers.userId, userId));
      return (row?.c ?? 0) >= 3;
    },
  },
  {
    type: 'budget_master',
    name: 'Budget Master',
    icon: '💰',
    description: 'Participated in 2 or more expense groups',
    check: async (userId) => {
      const [row] = await db.select({ c: count() }).from(expenseGroupMembers).where(eq(expenseGroupMembers.userId, userId));
      return (row?.c ?? 0) >= 2;
    },
  },
];

export async function checkAndAwardBadges(userId: string): Promise<void> {
  const existingRows = await db.query.userBadges.findMany({
    where: (t, { eq: e }) => e(t.userId, userId),
  });
  const earnedTypes = new Set(existingRows.map((r) => r.badgeType));

  for (const badge of BADGE_DEFINITIONS) {
    if (earnedTypes.has(badge.type)) continue;

    const qualifies = await badge.check(userId);
    if (qualifies) {
      await db.insert(userBadges).values({
        id: crypto.randomUUID(),
        userId,
        badgeType: badge.type,
      }).onConflictDoNothing();
    }
  }
}

export { BADGE_DEFINITIONS };
export type { BadgeType };
