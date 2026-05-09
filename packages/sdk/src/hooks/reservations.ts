import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  Reservation,
  CreateReservation,
  Accommodation,
  CreateAccommodation,
  TripFile,
} from '@roamera/types';

import { getApiClient } from '../client';

// ─── Query Keys ────────────────────────────────────────────────────

export const reservationKeys = {
  all: (tripId: string) => ['trips', tripId, 'reservations'] as const,
};

export const accommodationKeys = {
  all: (tripId: string) => ['trips', tripId, 'accommodations'] as const,
};

export const tripFileKeys = {
  all: (tripId: string) => ['trips', tripId, 'files'] as const,
};

// ─── Reservations ──────────────────────────────────────────────────

export function useReservations(tripId: string) {
  const api = getApiClient();
  return useQuery({
    queryKey: reservationKeys.all(tripId),
    queryFn: async () => {
      const res = await api.get<Reservation[]>(`/api/v1/trips/${tripId}/reservations`);
      return res.data;
    },
    enabled: !!tripId,
  });
}

export function useCreateReservation(tripId: string) {
  const api = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateReservation) => {
      const res = await api.post<Reservation>(`/api/v1/trips/${tripId}/reservations`, body);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all(tripId) }),
  });
}

export function useUpdateReservation(tripId: string) {
  const api = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<CreateReservation> & { id: string }) => {
      const res = await api.patch<Reservation>(`/api/v1/trips/${tripId}/reservations/${id}`, body);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all(tripId) }),
  });
}

export function useDeleteReservation(tripId: string) {
  const api = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/trips/${tripId}/reservations/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all(tripId) }),
  });
}

// ─── Accommodations ────────────────────────────────────────────────

export function useAccommodations(tripId: string) {
  const api = getApiClient();
  return useQuery({
    queryKey: accommodationKeys.all(tripId),
    queryFn: async () => {
      const res = await api.get<Accommodation[]>(`/api/v1/trips/${tripId}/accommodations`);
      return res.data;
    },
    enabled: !!tripId,
  });
}

export function useCreateAccommodation(tripId: string) {
  const api = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateAccommodation) => {
      const res = await api.post<Accommodation>(`/api/v1/trips/${tripId}/accommodations`, body);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: accommodationKeys.all(tripId) }),
  });
}

export function useUpdateAccommodation(tripId: string) {
  const api = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<CreateAccommodation> & { id: string }) => {
      const res = await api.patch<Accommodation>(`/api/v1/trips/${tripId}/accommodations/${id}`, body);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: accommodationKeys.all(tripId) }),
  });
}

export function useDeleteAccommodation(tripId: string) {
  const api = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/trips/${tripId}/accommodations/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: accommodationKeys.all(tripId) }),
  });
}

// ─── Trip Files ────────────────────────────────────────────────────

export function useTripFiles(tripId: string) {
  const api = getApiClient();
  return useQuery({
    queryKey: tripFileKeys.all(tripId),
    queryFn: async () => {
      const res = await api.get<TripFile[]>(`/api/v1/trips/${tripId}/files`);
      return res.data;
    },
    enabled: !!tripId,
  });
}

export function useUploadTripFile(tripId: string) {
  const api = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post<TripFile>(`/api/v1/trips/${tripId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripFileKeys.all(tripId) }),
  });
}

export function useUpdateTripFile(tripId: string) {
  const api = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; isStarred?: boolean; filename?: string }) => {
      const res = await api.patch<TripFile>(`/api/v1/trips/${tripId}/files/${id}`, body);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripFileKeys.all(tripId) }),
  });
}

export function useDeleteTripFile(tripId: string) {
  const api = getApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, permanent = false }: { id: string; permanent?: boolean }) => {
      const url = permanent
        ? `/api/v1/trips/${tripId}/files/${id}/permanent`
        : `/api/v1/trips/${tripId}/files/${id}`;
      await api.delete(url);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tripFileKeys.all(tripId) }),
  });
}

export function useShareTripFile(tripId: string) {
  const api = getApiClient();
  return useMutation({
    mutationFn: async (fileId: string) => {
      const res = await api.post<{ shareToken: string; shareUrl: string; filename: string }>(
        `/api/v1/trips/${tripId}/files/${fileId}/share`,
      );
      return res.data;
    },
  });
}

export function useDownloadTripFile(tripId: string) {
  const api = getApiClient();
  return useMutation({
    mutationFn: async (fileId: string) => {
      const res = await api.get<{ url: string; filename: string; mimeType: string }>(
        `/api/v1/trips/${tripId}/files/${fileId}/download`,
      );
      return res.data;
    },
  });
}
