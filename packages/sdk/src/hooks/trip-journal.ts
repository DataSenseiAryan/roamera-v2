import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { JourneyEntry, CreateEntry } from '@roamera/types';

import { getApiClient } from '../client';

export const tripJournalKeys = {
  journal: (tripId: string) => ['trip-journal', tripId] as const,
  share: (tripId: string) => ['trip-journal', tripId, 'share'] as const,
};

export type TripJournalData = {
  journal: {
    id: string;
    tripId: string | null;
    title: string;
    description?: string | null;
    isPublic: boolean;
    shareToken?: string | null;
    coverUrl?: string | null;
  };
  entries: Array<JourneyEntry & { photos?: Array<{ id: string; storageKey: string; url: string }> }>;
};

export function useTripJournal(tripId: string) {
  return useQuery({
    queryKey: tripJournalKeys.journal(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<TripJournalData>(`/api/v1/trips/${tripId}/journal`);
      return res.data;
    },
    enabled: Boolean(tripId),
  });
}

export function useCreateJournalEntry(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEntry) => {
      const res = await getApiClient().post<{ entry: JourneyEntry }>(
        `/api/v1/trips/${tripId}/journal`,
        data,
      );
      return res.data.entry;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripJournalKeys.journal(tripId) }),
  });
}

export function useUpdateJournalEntry(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, data }: { entryId: string; data: Partial<CreateEntry> }) => {
      const res = await getApiClient().patch<{ entry: JourneyEntry }>(
        `/api/v1/trips/${tripId}/journal/${entryId}`,
        data,
      );
      return res.data.entry;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripJournalKeys.journal(tripId) }),
  });
}

export function useDeleteJournalEntry(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      await getApiClient().delete(`/api/v1/trips/${tripId}/journal/${entryId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripJournalKeys.journal(tripId) }),
  });
}

export function useShareTripJournal(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await getApiClient().post<{ shareToken: string }>(
        `/api/v1/trips/${tripId}/journal/share`,
      );
      return res.data.shareToken;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripJournalKeys.journal(tripId) }),
  });
}

export function useRevokeTripJournalShare(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await getApiClient().delete(`/api/v1/trips/${tripId}/journal/share`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripJournalKeys.journal(tripId) }),
  });
}
