'use client';

import { create } from 'zustand';
import { configureClient, getApiClient } from '@roamera/sdk';
import type { User } from '@roamera/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  initialize: async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken || !refreshToken) {
      set({ isLoading: false });
      return;
    }

    set({ accessToken, refreshToken, isAuthenticated: true });

    try {
      const { data } = await getApiClient().get('/api/v1/auth/me');
      set({ user: data.user, isLoading: false });
    } catch {
      // Try refresh
      try {
        const { data } = await getApiClient().post('/api/v1/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          isLoading: false,
        });
      } catch {
        get().logout();
        set({ isLoading: false });
      }
    }
  },
}));

// Configure the SDK client to use our auth store
export function setupAuthClient() {
  configureClient({
    tokenGetter: () => useAuthStore.getState().accessToken,
    tokenSetter: (token) => {
      if (token) {
        localStorage.setItem('accessToken', token);
        useAuthStore.setState({ accessToken: token });
      } else {
        useAuthStore.getState().logout();
      }
    },
    refreshFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) return null;
      try {
        const { data } = await getApiClient().post('/api/v1/auth/refresh', { refreshToken });
        localStorage.setItem('refreshToken', data.refreshToken);
        useAuthStore.setState({ refreshToken: data.refreshToken, user: data.user });
        return data.accessToken;
      } catch {
        useAuthStore.getState().logout();
        return null;
      }
    },
  });
}
