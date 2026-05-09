import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Journey, JourneyEntry, CreateJourney, CreateEntry } from '@roamera/types';

import { getApiClient } from '../client';

export const journeyKeys = {
  all: () => ['journeys'] as const,
  detail: (id: string) => ['journeys', id] as const,
  entries: (id: string) => ['journeys', id, 'entries'] as const,
  public: (token: string) => ['journeys', 'public', token] as const,
};

export function useJourneys() {
  return useQuery({
    queryKey: journeyKeys.all(),
    queryFn: async () => {
      const res = await getApiClient().get<{ journeys: Journey[] }>('/api/v1/journeys');
      return res.data.journeys;
    },
  });
}

export function useJourney(journeyId: string) {
  return useQuery({
    queryKey: journeyKeys.detail(journeyId),
    queryFn: async () => {
      const res = await getApiClient().get<{ journey: Journey; entries: JourneyEntry[]; contributors: unknown[]; linkedTrips: unknown[] }>(
        `/api/v1/journeys/${journeyId}`,
      );
      return res.data;
    },
    enabled: Boolean(journeyId),
  });
}

export function usePublicJourney(token: string) {
  return useQuery({
    queryKey: journeyKeys.public(token),
    queryFn: async () => {
      const res = await getApiClient().get<{ journey: Journey; entries: JourneyEntry[]; owner: unknown }>(
        `/api/v1/journeys/public/${token}`,
      );
      return res.data;
    },
    enabled: Boolean(token),
  });
}

export function useCreateJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateJourney) => {
      const res = await getApiClient().post<{ journey: Journey }>('/api/v1/journeys', data);
      return res.data.journey;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journeyKeys.all() }),
  });
}

export function useUpdateJourney(journeyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreateJourney & { isPublic: boolean }>) => {
      const res = await getApiClient().patch<{ journey: Journey }>(`/api/v1/journeys/${journeyId}`, data);
      return res.data.journey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journeyKeys.detail(journeyId) });
      queryClient.invalidateQueries({ queryKey: journeyKeys.all() });
    },
  });
}

export function useDeleteJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (journeyId: string) => {
      await getApiClient().delete(`/api/v1/journeys/${journeyId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journeyKeys.all() }),
  });
}

export function useShareJourney(journeyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await getApiClient().post<{ shareToken: string }>(`/api/v1/journeys/${journeyId}/share`);
      return res.data.shareToken;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journeyKeys.detail(journeyId) }),
  });
}

export function useRevokeJourneyShare(journeyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await getApiClient().delete(`/api/v1/journeys/${journeyId}/share`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journeyKeys.detail(journeyId) }),
  });
}

export function useJourneyEntries(journeyId: string) {
  return useQuery({
    queryKey: journeyKeys.entries(journeyId),
    queryFn: async () => {
      const res = await getApiClient().get<{ entries: JourneyEntry[] }>(`/api/v1/journeys/${journeyId}/entries`);
      return res.data.entries;
    },
    enabled: Boolean(journeyId),
  });
}

export function useCreateEntry(journeyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEntry) => {
      const res = await getApiClient().post<{ entry: JourneyEntry }>(
        `/api/v1/journeys/${journeyId}/entries`,
        data,
      );
      return res.data.entry;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journeyKeys.entries(journeyId) }),
  });
}

export function useUpdateEntry(journeyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, data }: { entryId: string; data: Partial<CreateEntry> }) => {
      const res = await getApiClient().patch<{ entry: JourneyEntry }>(
        `/api/v1/journeys/${journeyId}/entries/${entryId}`,
        data,
      );
      return res.data.entry;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journeyKeys.entries(journeyId) }),
  });
}

export function useDeleteEntry(journeyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      await getApiClient().delete(`/api/v1/journeys/${journeyId}/entries/${entryId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journeyKeys.entries(journeyId) }),
  });
}

export function useInviteContributor(journeyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      const res = await getApiClient().post(`/api/v1/journeys/${journeyId}/contributors`, { username });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journeyKeys.detail(journeyId) }),
  });
}
