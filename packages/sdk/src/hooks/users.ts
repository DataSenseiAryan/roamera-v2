import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UpdateProfileInput, User } from '@roamera/types';

import { getApiClient } from '../client';

export const userKeys = {
  profile: (username: string) => ['users', username] as const,
  followers: (userId: string) => ['users', userId, 'followers'] as const,
  following: (userId: string) => ['users', userId, 'following'] as const,
  search: (q: string) => ['users', 'search', q] as const,
};

export function useUserQuery(username: string) {
  return useQuery({
    queryKey: userKeys.profile(username),
    queryFn: async (): Promise<User> => {
      const { data } = await getApiClient().get(`/api/v1/users/${username}`);
      return data.user;
    },
    enabled: !!username,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput): Promise<User> => {
      const { data } = await getApiClient().patch('/api/v1/users/me', input);
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
      queryClient.invalidateQueries({ queryKey: userKeys.profile(user.username) });
    },
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
      if (action === 'follow') {
        await getApiClient().post(`/api/v1/users/${userId}/follow`);
      } else {
        await getApiClient().delete(`/api/v1/users/${userId}/follow`);
      }
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useUserSearch(q: string) {
  return useQuery({
    queryKey: userKeys.search(q),
    queryFn: async (): Promise<User[]> => {
      const { data } = await getApiClient().get('/api/v1/users/search', { params: { q } });
      return data.users;
    },
    enabled: q.length >= 2,
  });
}
