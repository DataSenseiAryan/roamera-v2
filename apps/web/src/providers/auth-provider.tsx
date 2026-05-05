'use client';

import { useEffect } from 'react';
import { initApiClient } from '@roamera/sdk';
import { useAuthStore, setupAuthClient } from '@/lib/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

let initialized = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    if (!initialized) {
      initApiClient(API_URL);
      setupAuthClient();
      initialized = true;
    }
    void initialize();
  }, [initialize]);

  return <>{children}</>;
}
