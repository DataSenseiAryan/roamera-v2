import Dexie, { Table } from 'dexie';

interface CachedTrip {
  id: string;
  title: string;
  dateFrom?: string;
  dateTo?: string;
  currency: string;
  coverUrl?: string;
  cachedAt: number;
}

interface CachedDay {
  id: string;
  tripId: string;
  dayNumber: number;
  title?: string;
  date?: string;
}

interface CachedPlace {
  id: string;
  tripId: string;
  name: string;
  address?: string;
  lat?: string;
  lng?: string;
}

interface MutationQueueItem {
  id?: number;
  endpoint: string;
  method: string;
  body: string;
  createdAt: number;
}

class RoameraDB extends Dexie {
  trips!: Table<CachedTrip>;
  days!: Table<CachedDay>;
  places!: Table<CachedPlace>;
  mutationQueue!: Table<MutationQueueItem>;

  constructor() {
    super('roamera');
    this.version(1).stores({
      trips: 'id, cachedAt',
      days: 'id, tripId',
      places: 'id, tripId',
      mutationQueue: '++id, createdAt',
    });
  }
}

export const offlineDb = new RoameraDB();

export async function cacheTripBundle(bundle: {
  trip: CachedTrip;
  days: CachedDay[];
  places: CachedPlace[];
}) {
  const cachedAt = Date.now();
  await offlineDb.trips.put({ ...bundle.trip, cachedAt });
  for (const day of bundle.days) {
    await offlineDb.days.put(day);
  }
  for (const place of bundle.places) {
    await offlineDb.places.put(place);
  }
}

export async function getCachedTrips(): Promise<CachedTrip[]> {
  return offlineDb.trips.orderBy('cachedAt').reverse().toArray();
}

export async function getCachedTripDays(tripId: string): Promise<CachedDay[]> {
  return offlineDb.days.where('tripId').equals(tripId).toArray();
}

export async function queueMutation(endpoint: string, method: string, body: unknown) {
  await offlineDb.mutationQueue.add({
    endpoint,
    method,
    body: JSON.stringify(body),
    createdAt: Date.now(),
  });
}

export async function flushMutationQueue(apiClient: { request: (config: { method: string; url: string; data?: unknown }) => Promise<unknown> }) {
  const items = await offlineDb.mutationQueue.orderBy('createdAt').toArray();
  for (const item of items) {
    try {
      await apiClient.request({
        method: item.method,
        url: item.endpoint,
        data: JSON.parse(item.body),
      });
      if (item.id != null) {
        await offlineDb.mutationQueue.delete(item.id);
      }
    } catch {
      break; // Stop on first error, retry next time
    }
  }
}
