import { useEffect } from 'react';
import { initApiClient } from '@roamera/sdk';

import { setupMobileAuthClient, useAuthStore } from '../lib/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

let bootstrapDone = false;

export function ApiAuthBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (bootstrapDone) return;
    bootstrapDone = true;
    initApiClient(API_URL);
    setupMobileAuthClient();
    void useAuthStore.getState().initialize();
  }, []);
  return <>{children}</>;
}
