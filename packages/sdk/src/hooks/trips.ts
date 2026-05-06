import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  Assignment,
  CreateAssignment,
  CreateDay,
  CreatePlace,
  CreateTrip,
  Day,
  DayNote,
  MoveAssignment,
  Trip,
  TripMember,
  TripPlace,
  UpdatePlace,
  UpdateTrip,
} from '@roamera/types';

import { getApiClient } from '../client';

// ─── Query Keys ────────────────────────────────────────────────────

export const tripKeys = {
  all: () => ['trips'] as const,
  trip: (id: string) => ['trips', id] as const,
  members: (id: string) => ['trips', id, 'members'] as const,
  days: (id: string) => ['trips', id, 'days'] as const,
  places: (id: string) => ['trips', id, 'places'] as const,
  assignments: (id: string) => ['trips', id, 'assignments'] as const,
  notes: (tripId: string, dayId: string) => ['trips', tripId, 'days', dayId, 'notes'] as const,
  shared: (token: string) => ['trips', 'shared', token] as const,
};

// ─── Trips CRUD ────────────────────────────────────────────────────

export function useTripsQuery() {
  return useQuery({
    queryKey: tripKeys.all(),
    queryFn: async () => {
      const res = await getApiClient().get<{ trips: Trip[] }>('/api/v1/trips');
      return res.data.trips;
    },
  });
}

export function useTripQuery(id: string) {
  return useQuery({
    queryKey: tripKeys.trip(id),
    queryFn: async () => {
      const res = await getApiClient().get<{ trip: Trip; memberCount: number; dayCount: number }>(`/api/v1/trips/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTrip) => {
      const res = await getApiClient().post<{ trip: Trip }>('/api/v1/trips', data);
      return res.data.trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all() });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTrip }) => {
      const res = await getApiClient().patch<{ trip: Trip }>(`/api/v1/trips/${id}`, data);
      return res.data.trip;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.trip(id) });
      queryClient.invalidateQueries({ queryKey: tripKeys.all() });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getApiClient().delete(`/api/v1/trips/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all() });
    },
  });
}

// ─── Trip Members ──────────────────────────────────────────────────

export function useTripMembers(tripId: string) {
  return useQuery({
    queryKey: tripKeys.members(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<{ members: TripMember[] }>(`/api/v1/trips/${tripId}/members`);
      return res.data.members;
    },
    enabled: !!tripId,
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, username, memberRole }: { tripId: string; username: string; memberRole?: string }) => {
      await getApiClient().post(`/api/v1/trips/${tripId}/members`, { username, memberRole });
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.members(tripId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, userId }: { tripId: string; userId: string }) => {
      await getApiClient().delete(`/api/v1/trips/${tripId}/members/${userId}`);
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.members(tripId) });
    },
  });
}

// ─── Days ──────────────────────────────────────────────────────────

export function useDaysQuery(tripId: string) {
  return useQuery({
    queryKey: tripKeys.days(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<{ days: Day[] }>(`/api/v1/trips/${tripId}/days`);
      return res.data.days;
    },
    enabled: !!tripId,
  });
}

export function useCreateDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: CreateDay }) => {
      const res = await getApiClient().post<{ day: Day }>(`/api/v1/trips/${tripId}/days`, data);
      return res.data.day;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.days(tripId) });
    },
  });
}

export function useUpdateDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, dayId, data }: { tripId: string; dayId: string; data: Partial<CreateDay> }) => {
      const res = await getApiClient().patch<{ day: Day }>(`/api/v1/trips/${tripId}/days/${dayId}`, data);
      return res.data.day;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.days(tripId) });
    },
  });
}

export function useDeleteDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, dayId }: { tripId: string; dayId: string }) => {
      await getApiClient().delete(`/api/v1/trips/${tripId}/days/${dayId}`);
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.days(tripId) });
      queryClient.invalidateQueries({ queryKey: tripKeys.assignments(tripId) });
    },
  });
}

// ─── Places ────────────────────────────────────────────────────────

export function usePlacesQuery(tripId: string) {
  return useQuery({
    queryKey: tripKeys.places(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<{ places: TripPlace[] }>(`/api/v1/trips/${tripId}/places`);
      return res.data.places;
    },
    enabled: !!tripId,
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: CreatePlace }) => {
      const res = await getApiClient().post<{ place: TripPlace }>(`/api/v1/trips/${tripId}/places`, data);
      return res.data.place;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.places(tripId) });
    },
  });
}

export function useUpdatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, placeId, data }: { tripId: string; placeId: string; data: UpdatePlace }) => {
      const res = await getApiClient().patch<{ place: TripPlace }>(`/api/v1/trips/${tripId}/places/${placeId}`, data);
      return res.data.place;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.places(tripId) });
    },
  });
}

export function useDeletePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, placeId }: { tripId: string; placeId: string }) => {
      await getApiClient().delete(`/api/v1/trips/${tripId}/places/${placeId}`);
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.places(tripId) });
      queryClient.invalidateQueries({ queryKey: tripKeys.assignments(tripId) });
    },
  });
}

// ─── Assignments ───────────────────────────────────────────────────

export function useAssignmentsQuery(tripId: string) {
  return useQuery({
    queryKey: tripKeys.assignments(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<{ assignments: Assignment[] }>(`/api/v1/trips/${tripId}/assignments`);
      return res.data.assignments;
    },
    enabled: !!tripId,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: CreateAssignment }) => {
      const res = await getApiClient().post<{ assignment: Assignment }>(`/api/v1/trips/${tripId}/assignments`, data);
      return res.data.assignment;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.assignments(tripId) });
    },
  });
}

export function useMoveAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, assignmentId, data }: { tripId: string; assignmentId: string; data: MoveAssignment }) => {
      const res = await getApiClient().patch<{ assignment: Assignment }>(`/api/v1/trips/${tripId}/assignments/${assignmentId}/move`, data);
      return res.data.assignment;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.assignments(tripId) });
    },
  });
}

export function useReorderAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, assignmentId, orderIndex }: { tripId: string; assignmentId: string; orderIndex: number }) => {
      const res = await getApiClient().patch<{ assignment: Assignment }>(`/api/v1/trips/${tripId}/assignments/${assignmentId}`, { orderIndex });
      return res.data.assignment;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.assignments(tripId) });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, assignmentId }: { tripId: string; assignmentId: string }) => {
      await getApiClient().delete(`/api/v1/trips/${tripId}/assignments/${assignmentId}`);
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.assignments(tripId) });
    },
  });
}

// ─── Day Notes ─────────────────────────────────────────────────────

export function useDayNotesQuery(tripId: string, dayId: string) {
  return useQuery({
    queryKey: tripKeys.notes(tripId, dayId),
    queryFn: async () => {
      const res = await getApiClient().get<{ notes: DayNote[] }>(`/api/v1/trips/${tripId}/days/${dayId}/notes`);
      return res.data.notes;
    },
    enabled: !!tripId && !!dayId,
  });
}

export function useCreateDayNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, dayId, text, time, icon }: { tripId: string; dayId: string; text: string; time?: string; icon?: string }) => {
      const res = await getApiClient().post<{ note: DayNote }>(`/api/v1/trips/${tripId}/days/${dayId}/notes`, { text, time, icon });
      return res.data.note;
    },
    onSuccess: (_, { tripId, dayId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.notes(tripId, dayId) });
    },
  });
}

// ─── Shared Trip (public) ──────────────────────────────────────────

export function useSharedTripQuery(token: string) {
  return useQuery({
    queryKey: tripKeys.shared(token),
    queryFn: async () => {
      const res = await getApiClient().get(`/api/v1/trips/shared/${token}`);
      return res.data as { trip: Trip; days: Day[]; places: TripPlace[]; assignments: Assignment[] };
    },
    enabled: !!token,
  });
}
