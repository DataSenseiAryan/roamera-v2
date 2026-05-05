import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AuthTokens,
  LoginInput,
  OtpSendInput,
  OtpVerifyInput,
  RegisterInput,
  User,
} from '@roamera/types';

import { getApiClient } from '../client';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useMeQuery() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async (): Promise<User> => {
      const { data } = await getApiClient().get('/api/v1/auth/me');
      return data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: LoginInput,
    ): Promise<AuthTokens & { user: User }> => {
      const { data } = await getApiClient().post('/api/v1/auth/login', input);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: RegisterInput): Promise<{ message: string }> => {
      const { data } = await getApiClient().post('/api/v1/auth/register', input);
      return data;
    },
  });
}

export function useOtpSend() {
  return useMutation({
    mutationFn: async (input: OtpSendInput): Promise<{ message: string }> => {
      const { data } = await getApiClient().post('/api/v1/auth/otp/send', input);
      return data;
    },
  });
}

export function useOtpVerify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: OtpVerifyInput,
    ): Promise<AuthTokens & { user: User }> => {
      const { data } = await getApiClient().post('/api/v1/auth/otp/verify', input);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await getApiClient().post('/api/v1/auth/logout');
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useWsToken() {
  return useQuery({
    queryKey: ['auth', 'ws-token'],
    queryFn: async (): Promise<{ token: string }> => {
      const { data } = await getApiClient().get('/api/v1/auth/ws-token');
      return data;
    },
    staleTime: 9 * 60 * 1000,
  });
}
