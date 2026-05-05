import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

let _tokenGetter: (() => string | null) | null = null;
let _tokenSetter: ((token: string | null) => void) | null = null;
let _refreshFn: (() => Promise<string | null>) | null = null;

export function configureClient(opts: {
  tokenGetter: () => string | null;
  tokenSetter: (token: string | null) => void;
  refreshFn: () => Promise<string | null>;
}) {
  _tokenGetter = opts.tokenGetter;
  _tokenSetter = opts.tokenSetter;
  _refreshFn = opts.refreshFn;
}

export function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30_000,
  });

  client.interceptors.request.use((config) => {
    const token = _tokenGetter?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (token: string | null) => void;
    reject: (err: unknown) => void;
  }> = [];

  const processQueue = (error: unknown, token: string | null) => {
    failedQueue.forEach((p) => {
      if (error) p.reject(error);
      else p.resolve(token);
    });
    failedQueue = [];
  };

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry && _refreshFn) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return client(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await _refreshFn();
          if (newToken) {
            _tokenSetter?.(newToken);
            processQueue(null, newToken);
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            }
            return client(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          _tokenSetter?.(null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

let _apiClient: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (!_apiClient) {
    throw new Error(
      'API client not initialized. Call initApiClient() first.',
    );
  }
  return _apiClient;
}

export function initApiClient(baseURL: string): AxiosInstance {
  _apiClient = createApiClient(baseURL);
  return _apiClient;
}
