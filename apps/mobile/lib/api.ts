import { initApiClient } from '@roamera/sdk';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const apiClient = initApiClient(API_URL);
