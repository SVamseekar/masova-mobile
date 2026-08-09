import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import CONFIG from '../../config';
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from '../secureTokenStorage';

export class ApiError extends Error {
  status: number;
  data: any;
  code?: string;

  constructor(message: string, status: number, data?: any, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

// User & Store Context state held for header injection
let currentUserId: string | null = null;
let currentSelectedStoreId: string | null = null;

export const setClientUserContext = (userId: string | null) => {
  currentUserId = userId;
};

export const setClientSelectedStoreContext = (storeIdOrCode: string | null) => {
  currentSelectedStoreId = storeIdOrCode;
};

export const getClientUserContext = () => currentUserId;
export const getClientSelectedStoreContext = () => currentSelectedStoreId;

// Mutex state for refresh token calls
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers = [];
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: CONFIG.DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT & Identity Headers
httpClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (currentUserId && config.headers) {
      config.headers['X-User-Id'] = currentUserId;
    }

    if (config.headers) {
      config.headers['X-User-Type'] = 'CUSTOMER';
    }

    if (currentSelectedStoreId && config.headers) {
      config.headers['X-Selected-Store-Id'] = currentSelectedStoreId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Automatic Refresh Mutex
httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Do not attempt refresh on auth login/register endpoints themselves
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register') || originalRequest.url?.includes('/auth/refresh')) {
        const errorData: any = error.response?.data;
        const msg = errorData?.message || 'Authentication failed';
        return Promise.reject(new ApiError(msg, 401, errorData));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(httpClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          await clearTokens();
          onRefreshFailed();
          const errData: any = error.response?.data;
          return Promise.reject(new ApiError('Session expired. Please log in again.', 401, errData));
        }

        // Call backend refresh endpoint
        const response = await axios.post(`${CONFIG.API_BASE_URL}/auth/refresh`, { refreshToken });

        // Platform backend returns { accessToken }
        const newAccessToken = response.data?.accessToken || response.data?.token;

        if (!newAccessToken) {
          throw new Error('Refresh response missing accessToken');
        }

        await setAccessToken(newAccessToken);

        isRefreshing = false;
        onRefreshed(newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return httpClient(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshFailed();
        await clearTokens();
        const errData: any = error.response?.data;
        return Promise.reject(
          new ApiError('Session expired. Please log in again.', 401, errData)
        );
      }
    }

    // Format generic API error
    const status = error.response?.status || 500;
    const errorData: any = error.response?.data;
    const message = errorData?.message || error.message || 'An unexpected network error occurred';
    return Promise.reject(new ApiError(message, status, errorData));
  }
);

export default httpClient;
