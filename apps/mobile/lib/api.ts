import { initApiClient } from '@roamera/sdk';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const apiClient = initApiClient(API_URL);

// Raw axios client for endpoints not in the SDK
let _axiosClient: ReturnType<typeof axios.create> | null = null;

export function getApiClient() {
  if (!_axiosClient) {
    _axiosClient = axios.create({ baseURL: API_URL });
  }
  return _axiosClient;
}

export function setApiAuthToken(token: string) {
  const client = getApiClient();
  client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export { API_URL };
