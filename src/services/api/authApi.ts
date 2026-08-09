import httpClient, { setClientUserContext } from '../http/client';
import { setTokens, clearTokens } from '../secureTokenStorage';
import { AuthResponse, User } from '../../types';

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

export const authApi = {
  login: async (params: LoginParams): Promise<AuthResponse> => {
    const response = await httpClient.post<AuthResponse>('/auth/login', params);
    const data = response.data;
    const accessToken = data.accessToken || data.token || '';
    const refreshToken = data.refreshToken || '';
    await setTokens(accessToken, refreshToken);
    if (data.user?.id) {
      setClientUserContext(data.user.id);
    }
    return {
      ...data,
      accessToken,
      refreshToken,
    };
  },

  register: async (params: RegisterParams): Promise<AuthResponse> => {
    const response = await httpClient.post<AuthResponse>('/auth/register', {
      ...params,
      role: 'CUSTOMER',
    });
    const data = response.data;
    const accessToken = data.accessToken || data.token || '';
    const refreshToken = data.refreshToken || '';
    await setTokens(accessToken, refreshToken);
    if (data.user?.id) {
      setClientUserContext(data.user.id);
    }
    return {
      ...data,
      accessToken,
      refreshToken,
    };
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await httpClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    const data = response.data;
    const accessToken = data.accessToken || data.token || '';
    const newRefreshToken = data.refreshToken || refreshToken;
    await setTokens(accessToken, newRefreshToken);
    return {
      ...data,
      accessToken,
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
      setClientUserContext(null);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await httpClient.get<User>('/auth/me');
    if (response.data?.id) {
      setClientUserContext(response.data.id);
    }
    return response.data;
  },

  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    const response = await httpClient.post<AuthResponse>('/auth/google', { idToken });
    const data = response.data;
    const accessToken = data.accessToken || data.token || '';
    const refreshToken = data.refreshToken || '';
    await setTokens(accessToken, refreshToken);
    if (data.user?.id) {
      setClientUserContext(data.user.id);
    }
    return {
      ...data,
      accessToken,
      refreshToken,
    };
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const user = await authApi.getCurrentUser();
      return !!user?.id;
    } catch {
      return false;
    }
  },

  changePassword: async (params: ChangePasswordParams): Promise<{ message: string }> => {
    const response = await httpClient.post<{ message: string }>('/auth/change-password', params);
    return response.data;
  },
};

export default authApi;
