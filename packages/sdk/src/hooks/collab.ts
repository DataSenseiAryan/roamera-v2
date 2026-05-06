import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CollabMessage, CollabNote, CollabPoll } from '@roamera/types';

import { getApiClient } from '../client';

import { tripKeys } from './trips';

export const collabKeys = {
  messages: (tripId: string) => [...tripKeys.trip(tripId), 'collab', 'messages'] as const,
  notes: (tripId: string) => [...tripKeys.trip(tripId), 'collab', 'notes'] as const,
  polls: (tripId: string) => [...tripKeys.trip(tripId), 'collab', 'polls'] as const,
};

export function useCollabMessages(tripId: string) {
  return useQuery({
    queryKey: collabKeys.messages(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<{ messages: CollabMessage[]; nextCursor: string | null }>(
        `/api/v1/trips/${tripId}/collab/messages`,
      );
      return [...res.data.messages].reverse();
    },
    enabled: !!tripId,
    refetchInterval: 5000,
  });
}

export function useSendCollabMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      content,
      replyToId,
    }: {
      tripId: string;
      content: string;
      replyToId?: string | null;
    }) => {
      const res = await getApiClient().post<{ message: CollabMessage }>(`/api/v1/trips/${tripId}/collab/messages`, {
        content,
        replyToId: replyToId ?? undefined,
      });
      return { tripId, message: res.data.message };
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.messages(tripId) });
    },
  });
}

export function useReactToCollabMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, messageId, emoji }: { tripId: string; messageId: string; emoji: string }) => {
      await getApiClient().post(`/api/v1/trips/${tripId}/collab/messages/${messageId}/react`, { emoji });
      return { tripId };
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.messages(tripId) });
    },
  });
}

export function useDeleteCollabMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, messageId }: { tripId: string; messageId: string }) => {
      await getApiClient().delete(`/api/v1/trips/${tripId}/collab/messages/${messageId}`);
      return { tripId };
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.messages(tripId) });
    },
  });
}

export function useCollabNotes(tripId: string) {
  return useQuery({
    queryKey: collabKeys.notes(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<{ notes: CollabNote[] }>(`/api/v1/trips/${tripId}/collab/notes`);
      return res.data.notes;
    },
    enabled: !!tripId,
    refetchInterval: 8000,
  });
}

export function useCreateCollabNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      title,
      content,
      category,
      color,
    }: {
      tripId: string;
      title: string;
      content?: string;
      category?: string | null;
      color?: string | null;
    }) => {
      const res = await getApiClient().post<{ note: CollabNote }>(`/api/v1/trips/${tripId}/collab/notes`, {
        title,
        content,
        category,
        color,
      });
      return { tripId, note: res.data.note };
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.notes(tripId) });
    },
  });
}

export function useUpdateCollabNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      noteId,
      ...patch
    }: {
      tripId: string;
      noteId: string;
      title?: string;
      content?: string;
      category?: string | null;
      color?: string | null;
    }) => {
      const res = await getApiClient().patch<{ note: CollabNote }>(
        `/api/v1/trips/${tripId}/collab/notes/${noteId}`,
        patch,
      );
      return { tripId, note: res.data.note };
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.notes(tripId) });
    },
  });
}

export function useDeleteCollabNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, noteId }: { tripId: string; noteId: string }) => {
      await getApiClient().delete(`/api/v1/trips/${tripId}/collab/notes/${noteId}`);
      return { tripId };
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.notes(tripId) });
    },
  });
}

export function useToggleNotePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, noteId }: { tripId: string; noteId: string }) => {
      const res = await getApiClient().patch<{ note: CollabNote }>(
        `/api/v1/trips/${tripId}/collab/notes/${noteId}/pin`,
        {},
      );
      return { tripId, note: res.data.note };
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.notes(tripId) });
    },
  });
}

export function useCollabPolls(tripId: string) {
  return useQuery({
    queryKey: collabKeys.polls(tripId),
    queryFn: async () => {
      const res = await getApiClient().get<{ polls: CollabPoll[] }>(`/api/v1/trips/${tripId}/collab/polls`);
      return res.data.polls;
    },
    enabled: !!tripId,
    refetchInterval: 8000,
  });
}

export function useCreateCollabPoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      question,
      options,
      isMultiple,
      deadline,
    }: {
      tripId: string;
      question: string;
      options: string[];
      isMultiple?: boolean;
      deadline?: string | null;
    }) => {
      const res = await getApiClient().post<{ poll: CollabPoll }>(`/api/v1/trips/${tripId}/collab/polls`, {
        question,
        options,
        isMultiple,
        deadline: deadline ?? undefined,
      });
      return { tripId, poll: res.data.poll };
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.polls(tripId) });
    },
  });
}

export function useVoteCollabPoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      pollId,
      optionIndex,
    }: {
      tripId: string;
      pollId: string;
      optionIndex: number;
    }) => {
      await getApiClient().post(`/api/v1/trips/${tripId}/collab/polls/${pollId}/vote`, { optionIndex });
      return { tripId };
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.polls(tripId) });
    },
  });
}

export function useCloseCollabPoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, pollId }: { tripId: string; pollId: string }) => {
      await getApiClient().post(`/api/v1/trips/${tripId}/collab/polls/${pollId}/close`, {});
      return { tripId };
    },
    onSuccess: ({ tripId }) => {
      queryClient.invalidateQueries({ queryKey: collabKeys.polls(tripId) });
    },
  });
}
