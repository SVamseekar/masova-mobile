import AsyncStorage from '@react-native-async-storage/async-storage';
import httpClient, { setClientUserContext } from '../http/client';
import { setTokens, clearTokens, getAccessToken } from '../secureTokenStorage';
import { AuthResponse, User } from '../../types';

const USER_KEY = 'masova_user';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

async function persistUser(user: User | undefined | null): Promise<void> {
  if (!user?.id) return;
  setClientUserContext(user.id);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function clearPersistedUser(): Promise<void> {
  setClientUserContext(null);
  await AsyncStorage.removeItem(USER_KEY);
}

function normalizeAuthResponse(data: AuthResponse & { token?: string }): AuthResponse {
  const accessToken = data.accessToken || data.token || '';
  const refreshToken = data.refreshToken || '';
  return {
    ...data,
    accessToken,
    refreshToken,
  };
}

export const authApi = {
  login: async (params: LoginParams): Promise<AuthResponse> => {
    const response = await httpClient.post<AuthResponse>('/auth/login', params);
    const data = normalizeAuthResponse(response.data);
    await setTokens(data.accessToken, data.refreshToken);
    await persistUser(data.user);
    return data;
  },

  register: async (params: RegisterParams): Promise<AuthResponse> => {
    const response = await httpClient.post<AuthResponse>('/auth/register', {
      ...params,
      type: 'CUSTOMER',
      role: 'CUSTOMER',
    });
    const data = normalizeAuthResponse(response.data);
    // Register may not always return tokens — still persist user if present
    if (data.accessToken && data.refreshToken) {
      await setTokens(data.accessToken, data.refreshToken);
    }
    if (data.user) {
      await persistUser(data.user);
    }
    return data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await httpClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    const data = normalizeAuthResponse(response.data);
    const newRefreshToken = data.refreshToken || refreshToken;
    await setTokens(data.accessToken, newRefreshToken);
    return {
      ...data,
      refreshToken: newRefreshToken,
    };
  },

  logout: async (): Promise<void> => {
    try {
      await httpClient.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      await clearTokens();
      await clearPersistedUser();
    }
  },

  /**
   * Restore current user from secure local storage.
   * Platform has no reliable public /auth/me; avoid that path.
   * Optionally refreshes profile via GET /users/{id} when online.
   */
  getCurrentUser: async (): Promise<User | null> => {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) {
      setClientUserContext(null);
      return null;
    }

    let user: User;
    try {
      user = JSON.parse(raw) as User;
    } catch {
      await clearPersistedUser();
      return null;
    }

    if (!user?.id) {
      await clearPersistedUser();
      return null;
    }

    setClientUserContext(user.id);

    // Best-effort remote refresh (non-fatal if offline / 403)
    try {
      const token = await getAccessToken();
      if (token) {
        const response = await httpClient.get<User>(`/users/${user.id}`);
        if (response.data?.id) {
          const merged: User = {
            ...user,
            ...response.data,
            id: response.data.id,
            role: (response.data.role || user.role || 'CUSTOMER') as User['role'],
          };
          await persistUser(merged);
          return merged;
        }
      }
    } catch {
      // Keep cached profile
    }

    return user;
  },

  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    const response = await httpClient.post<AuthResponse>('/auth/google', { idToken });
    const data = normalizeAuthResponse(response.data);
    await setTokens(data.accessToken, data.refreshToken);
    await persistUser(data.user);
    return data;
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await getAccessToken();
    if (!token) return false;
    const user = await authApi.getCurrentUser();
    return !!user?.id;
  },

  changePassword: async (params: ChangePasswordParams): Promise<{ message: string }> => {
    const response = await httpClient.post<{ message: string }>('/auth/change-password', params);
    return response.data;
  },
};

export default authApi;
