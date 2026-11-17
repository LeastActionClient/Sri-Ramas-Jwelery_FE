import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const ADMIN_SESSION_HINT_KEY = 'srj_admin_session_active';
const ADMIN_ACCESS_TOKEN_KEY = 'srj_admin_access_token';
const ADMIN_REFRESH_TOKEN_KEY = 'srj_admin_refresh_token';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send and receive HTTP-only refresh cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

let inMemoryToken: string | null = null;
let isRefreshing = false;
let singleFlightRefreshPromise: Promise<string> | null = null;
let recentRefresh: { token: string; at: number } | null = null;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

export function hasAdminSessionHint(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      (window.localStorage.getItem(ADMIN_SESSION_HINT_KEY) === '1' ||
        Boolean(window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)))
    );
  } catch {
    return false;
  }
}

export function setAdminSessionHint(active: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (active) {
      window.localStorage.setItem(ADMIN_SESSION_HINT_KEY, '1');
    } else {
      window.localStorage.removeItem(ADMIN_SESSION_HINT_KEY);
      window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
      window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
      inMemoryToken = null;
      recentRefresh = null;
    }
  } catch {
    // Ignore storage errors in restricted browser contexts
  }
}

export function setStoredRefreshToken(token: string | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (token) {
      window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getStoredRefreshToken(): string | null {
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

export function clearRefreshCache(): void {
  recentRefresh = null;
  singleFlightRefreshPromise = null;
}

/**
 * Performs a single-flight refresh token exchange so concurrent React StrictMode
 * mounts or parallel 401 retries never race on rotating refresh tokens.
 */
export async function refreshAccessToken(force = false): Promise<string> {
  if (!force && recentRefresh && Date.now() - recentRefresh.at < 1500) {
    setAccessToken(recentRefresh.token);
    return recentRefresh.token;
  }

  if (singleFlightRefreshPromise) {
    return singleFlightRefreshPromise;
  }

  singleFlightRefreshPromise = (async () => {
    try {
      const fallbackRefreshToken = getStoredRefreshToken();
      const refreshPayload = fallbackRefreshToken ? { refreshToken: fallbackRefreshToken } : {};

      const refreshResponse = await axios.post(
        `${BASE_URL}/auth/refresh`,
        refreshPayload,
        { withCredentials: true }
      );
      const newAccessToken = refreshResponse.data?.data?.accessToken as string | undefined;
      const newRefreshToken = refreshResponse.data?.data?.refreshToken as string | undefined;

      if (!newAccessToken) {
        throw new Error('Refresh response missing access token.');
      }
      setAccessToken(newAccessToken);
      if (newRefreshToken) {
        setStoredRefreshToken(newRefreshToken);
      }
      setAdminSessionHint(true);
      recentRefresh = { token: newAccessToken, at: Date.now() };
      return newAccessToken;
    } catch (err) {
      recentRefresh = null;
      throw err;
    } finally {
      singleFlightRefreshPromise = null;
    }
  })();

  return singleFlightRefreshPromise;
}

export function setAccessToken(token: string | null) {
  inMemoryToken = token;
  try {
    if (typeof window !== 'undefined') {
      if (token) {
        window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, token);
      } else {
        window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
      }
    }
  } catch {
    // Ignore storage errors
  }
}

export function getAccessToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
      if (stored) {
        inMemoryToken = stored;
        return stored;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto-Refresh Token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Avoid infinite loop if refresh itself fails or request already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken(true);
        if (newAccessToken) {
          processQueue(null, newAccessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        setAdminSessionHint(false);
        // Dispatch logout event if needed
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
