import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

import { ApiAuthBootstrap } from './providers';
import { OfflineBanner } from '../components/OfflineBanner';
import { registerForPushNotifications, addNotificationResponseListener } from '../lib/push';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000 },
    mutations: { retry: 0 },
  },
});

function PushNotificationSetup() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Register push token when app starts (will work on physical device)
    registerForPushNotifications().catch(() => {});

    // Handle deep link navigation from notification tap
    responseListener.current = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.tripId) {
        router.push(`/trips/${data.tripId}` as never);
      } else if (data?.circleId) {
        router.push(`/circles/${data.circleId}` as never);
      } else {
        router.push('/notifications' as never);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ApiAuthBootstrap>
        <PushNotificationSetup />
        <OfflineBanner />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="health" options={{ title: 'API Health' }} />
          <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
          <Stack.Screen name="trips/[tripId]" options={{ title: 'Trip Details' }} />
          <Stack.Screen name="trips/[tripId]/budget" options={{ title: 'Budget' }} />
          <Stack.Screen name="trips/[tripId]/packing" options={{ title: 'Packing' }} />
          <Stack.Screen name="circles/[circleId]" options={{ title: 'Circle' }} />
        </Stack>
      </ApiAuthBootstrap>
    </QueryClientProvider>
  );
}
