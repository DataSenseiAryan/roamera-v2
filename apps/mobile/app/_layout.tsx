import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ApiAuthBootstrap } from './providers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000 },
    mutations: { retry: 0 },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiAuthBootstrap>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="health" options={{ title: 'API Health' }} />
        </Stack>
      </ApiAuthBootstrap>
    </QueryClientProvider>
  );
}
