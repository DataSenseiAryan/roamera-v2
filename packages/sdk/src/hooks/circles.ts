import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CircleDetail,
  CircleListItem,
  CircleMember,
  CircleMessage,
  CirclePoll,
  CreateCircle,
} from '@roamera/types';

import { getApiClient } from '../client';

export const circleKeys = {
  all: () => ['circles'] as const,
  detail: (id: string) => ['circles', id] as const,
  messages: (id: string) => ['circles', id, 'messages'] as const,
  polls: (id: string) => ['circles', id, 'polls'] as const,
};

export function useCircles() {
  return useQuery({
    queryKey: circleKeys.all(),
    queryFn: async () => {
      const res = await getApiClient().get<{ circles: CircleListItem[] }>('/api/v1/circles');
      return res.data.circles;
    },
  });
}

export function useCreateCircle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCircle) => {
      const res = await getApiClient().post<{ circle: CircleDetail & { myRole: string; memberCount: number } }>(
        '/api/v1/circles',
        data,
      );
      return res.data.circle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circleKeys.all() });
    },
  });
}

export function useCircle(circleId: string) {
  return useQuery({
    queryKey: circleKeys.detail(circleId),
    queryFn: async () => {
      const res = await getApiClient().get<{
        circle: CircleDetail & { myRole: 'owner' | 'member' | null };
        members: CircleMember[];
        linkedTripTitle: string | null;
        memberCount: number;
      }>(`/api/v1/circles/${circleId}`);
      return res.data;
    },
    enabled: !!circleId,
  });
}

export function useCircleMessages(circleId: string) {
  return useQuery({
    queryKey: circleKeys.messages(circleId),
    queryFn: async () => {
      const res = await getApiClient().get<{ messages: CircleMessage[]; nextCursor: string | null }>(
        `/api/v1/circles/${circleId}/messages`,
      );
      return res.data.messages;
    },
    enabled: !!circleId,
    refetchInterval: 5000,
  });
}

export function useSendCircleMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      circleId,
      content,
      replyToId,
    }: {
      circleId: string;
      content: string;
      replyToId?: string | null;
    }) => {
      const res = await getApiClient().post<{ message: CircleMessage }>(`/api/v1/circles/${circleId}/messages`, {
        content,
        replyToId: replyToId ?? undefined,
      });
      return { circleId, message: res.data.message };
    },
    onSuccess: ({ circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.messages(circleId) });
    },
  });
}

export function useReactToCircleMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ circleId, messageId, emoji }: { circleId: string; messageId: string; emoji: string }) => {
      const res = await getApiClient().post<{ reactions: { emoji: string; count: number }[] }>(
        `/api/v1/circles/${circleId}/messages/${messageId}/react`,
        { emoji },
      );
      return { circleId, messageId, reactions: res.data.reactions };
    },
    onSuccess: ({ circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.messages(circleId) });
    },
  });
}

export function useDeleteCircleMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ circleId, messageId }: { circleId: string; messageId: string }) => {
      await getApiClient().delete(`/api/v1/circles/${circleId}/messages/${messageId}`);
      return { circleId };
    },
    onSuccess: ({ circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.messages(circleId) });
    },
  });
}

export function useCirclePolls(circleId: string) {
  return useQuery({
    queryKey: circleKeys.polls(circleId),
    queryFn: async () => {
      const res = await getApiClient().get<{ polls: CirclePoll[] }>(`/api/v1/circles/${circleId}/polls`);
      return res.data.polls;
    },
    enabled: !!circleId,
    refetchInterval: 8000,
  });
}

export function useCreateCirclePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      circleId,
      question,
      options,
      isMultiple,
      deadline,
    }: {
      circleId: string;
      question: string;
      options: string[];
      isMultiple?: boolean;
      deadline?: string | null;
    }) => {
      const res = await getApiClient().post<{ poll: CirclePoll }>(`/api/v1/circles/${circleId}/polls`, {
        question,
        options,
        isMultiple,
        deadline,
      });
      return { circleId, poll: res.data.poll };
    },
    onSuccess: ({ circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.polls(circleId) });
    },
  });
}

export function useVoteCirclePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      circleId,
      pollId,
      optionIndex,
      optionIndices,
    }: {
      circleId: string;
      pollId: string;
      optionIndex?: number;
      optionIndices?: number[];
    }) => {
      const res = await getApiClient().post<{ poll: CirclePoll }>(`/api/v1/circles/${circleId}/polls/${pollId}/vote`, {
        optionIndex,
        optionIndices,
      });
      return { circleId, poll: res.data.poll };
    },
    onSuccess: ({ circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.polls(circleId) });
    },
  });
}

export function useJoinCircle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (circleId: string) => {
      await getApiClient().post(`/api/v1/circles/${circleId}/join`);
      return circleId;
    },
    onSuccess: (circleId) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.all() });
      queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
    },
  });
}

export function useLeaveCircle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (circleId: string) => {
      await getApiClient().post(`/api/v1/circles/${circleId}/leave`);
      return circleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circleKeys.all() });
    },
  });
}

export function useInviteToCircle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ circleId, usernames }: { circleId: string; usernames: string[] }) => {
      const res = await getApiClient().post<{ addedCount: number }>(`/api/v1/circles/${circleId}/invite`, {
        usernames,
      });
      return { circleId, addedCount: res.data.addedCount };
    },
    onSuccess: ({ circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: circleKeys.all() });
    },
  });
}

export function useRemoveCircleMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ circleId, userId }: { circleId: string; userId: string }) => {
      await getApiClient().delete(`/api/v1/circles/${circleId}/members/${userId}`);
      return { circleId };
    },
    onSuccess: ({ circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
    },
  });
}

export function useCloseCirclePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ circleId, pollId }: { circleId: string; pollId: string }) => {
      const res = await getApiClient().post<{ poll: CirclePoll }>(`/api/v1/circles/${circleId}/polls/${pollId}/close`, {});
      return { circleId, poll: res.data.poll };
    },
    onSuccess: ({ circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.polls(circleId) });
    },
  });
}
