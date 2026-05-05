import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { configureClient, getApiClient } from '@roamera/sdk';
import type { User } from '@roamera/types';

const ACCESS_TOKEN_KEY = 'roamera_access_token';
const REFRESH_TOKEN_KEY = 'roamera_refresh_token';

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setStoredTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearStoredTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (accessToken, refreshToken, user) => {
    void setStoredTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    void clearStoredTokens();
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  initialize: async () => {
    const accessToken = await getStoredToken();
    const refreshToken = await getStoredRefreshToken();

    if (!accessToken || !refreshToken) {
      set({ isLoading: false });
      return;
    }

    set({ accessToken, refreshToken, isAuthenticated: true });

    try {
      const { data } = await getApiClient().get('/api/v1/auth/me');
      set({ user: data.user, isLoading: false });
    } catch {
      try {
        const { data } = await getApiClient().post('/api/v1/auth/refresh', { refreshToken });
        await setStoredTokens(data.accessToken, data.refreshToken);
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

export function setupMobileAuthClient() {
  configureClient({
    tokenGetter: () => useAuthStore.getState().accessToken,
    tokenSetter: (token) => {
      if (token) {
        const refresh = useAuthStore.getState().refreshToken;
        if (refresh) void setStoredTokens(token, refresh);
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
        await setStoredTokens(data.accessToken, data.refreshToken);
        useAuthStore.setState({ refreshToken: data.refreshToken, user: data.user });
        return data.accessToken;
      } catch {
        useAuthStore.getState().logout();
        return null;
      }
    },
  });
}
