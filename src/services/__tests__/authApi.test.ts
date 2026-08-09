import httpClient, { setClientUserContext } from '../http/client';
import { setTokens, clearTokens, getAccessToken } from '../secureTokenStorage';
import { authApi } from '../api/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../http/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  setClientUserContext: jest.fn(),
}));

jest.mock('../secureTokenStorage', () => ({
  setTokens: jest.fn().mockResolvedValue(undefined),
  clearTokens: jest.fn().mockResolvedValue(undefined),
  getAccessToken: jest.fn().mockResolvedValue('acc_token'),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

describe('authApi Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('authenticates user and stores tokens in secureTokenStorage & client context', async () => {
      const mockResponse = {
        data: {
          accessToken: 'acc_123',
          refreshToken: 'ref_123',
          user: { id: 'user_99', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER' },
        },
      };
      (httpClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.login({ email: 'test@example.com', password: 'password123' });

      expect(httpClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(setTokens).toHaveBeenCalledWith('acc_123', 'ref_123');
      expect(setClientUserContext).toHaveBeenCalledWith('user_99');
      expect(result.accessToken).toBe('acc_123');
      expect(result.refreshToken).toBe('ref_123');
    });

    it('falls back to token field if accessToken is absent', async () => {
      const mockResponse = {
        data: {
          token: 'token_abc',
          user: { id: 'user_1' },
        },
      };
      (httpClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.login({ email: 'test@example.com', password: 'pass' });
      expect(setTokens).toHaveBeenCalledWith('token_abc', '');
      expect(result.accessToken).toBe('token_abc');
    });
  });

  describe('register', () => {
    it('registers user with role CUSTOMER and saves tokens', async () => {
      const mockResponse = {
        data: {
          accessToken: 'acc_reg',
          refreshToken: 'ref_reg',
          user: { id: 'user_new', name: 'New User' },
        },
      };
      (httpClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.register({
        name: 'New User',
        email: 'new@example.com',
        password: 'pass',
        phone: '9999999999',
      });

      expect(httpClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'New User',
        email: 'new@example.com',
        password: 'pass',
        phone: '9999999999',
        type: 'CUSTOMER',
        role: 'CUSTOMER',
      });
      expect(setTokens).toHaveBeenCalledWith('acc_reg', 'ref_reg');
      expect(setClientUserContext).toHaveBeenCalledWith('user_new');
      expect(result.accessToken).toBe('acc_reg');
    });
  });

  describe('refresh', () => {
    it('posts refresh token and updates stored tokens', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new_acc',
          refreshToken: 'new_ref',
        },
      };
      (httpClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.refresh('old_ref');

      expect(httpClient.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'old_ref' });
      expect(setTokens).toHaveBeenCalledWith('new_acc', 'new_ref');
      expect(result.accessToken).toBe('new_acc');
      expect(result.refreshToken).toBe('new_ref');
    });
  });

  describe('logout', () => {
    it('calls /auth/logout and clears tokens & user context even on HTTP error', async () => {
      (httpClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      await authApi.logout();

      expect(httpClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(clearTokens).toHaveBeenCalled();
      expect(setClientUserContext).toHaveBeenCalledWith(null);
    });
  });

  describe('getCurrentUser', () => {
    it('restores user from AsyncStorage and sets context (no /auth/me)', async () => {
      const mockUser = { id: 'user_curr', email: 'curr@example.com', name: 'Current User', role: 'CUSTOMER' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockUser));
      (getAccessToken as jest.Mock).mockResolvedValue(null);

      const user = await authApi.getCurrentUser();

      expect(httpClient.get).not.toHaveBeenCalledWith('/auth/me');
      expect(setClientUserContext).toHaveBeenCalledWith('user_curr');
      expect(user?.id).toBe('user_curr');
    });
  });

  describe('loginWithGoogle', () => {
    it('posts idToken to /auth/google and updates auth state', async () => {
      const mockResponse = {
        data: {
          accessToken: 'acc_goog',
          refreshToken: 'ref_goog',
          user: { id: 'user_goog' },
        },
      };
      (httpClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.loginWithGoogle('id_token_xyz');

      expect(httpClient.post).toHaveBeenCalledWith('/auth/google', { idToken: 'id_token_xyz' });
      expect(setTokens).toHaveBeenCalledWith('acc_goog', 'ref_goog');
      expect(setClientUserContext).toHaveBeenCalledWith('user_goog');
      expect(result.accessToken).toBe('acc_goog');
    });
  });

  describe('isAuthenticated', () => {
    it('returns true if token + stored user id exist', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue('acc_token');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ id: 'user_123', email: 'a@b.com', name: 'A', role: 'CUSTOMER' })
      );
      (httpClient.get as jest.Mock).mockRejectedValue(new Error('offline'));
      const authState = await authApi.isAuthenticated();
      expect(authState).toBe(true);
    });

    it('returns false if no access token', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const authState = await authApi.isAuthenticated();
      expect(authState).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('posts password parameters to /auth/change-password', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({ data: { message: 'Password updated successfully' } });

      const res = await authApi.changePassword({ currentPassword: 'old', newPassword: 'new' });

      expect(httpClient.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'old',
        newPassword: 'new',
      });
      expect(res.message).toBe('Password updated successfully');
    });
  });
});
