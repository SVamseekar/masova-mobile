import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {
  getTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
  setAccessToken,
  clearTokens,
  migrateLegacyTokens,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '../secureTokenStorage';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' },
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiGet: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('secureTokenStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTokens', () => {
    it('stores tokens in Keychain', async () => {
      await setTokens('customer-access', 'customer-refresh');

      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'masova-customer',
        JSON.stringify({ accessToken: 'customer-access', refreshToken: 'customer-refresh' }),
        expect.objectContaining({ service: 'com.masova.customer.auth' })
      );
    });

    it('reads tokens from Keychain', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        password: JSON.stringify({ accessToken: 'token-a', refreshToken: 'token-r' }),
      });

      await expect(getTokens()).resolves.toEqual({
        accessToken: 'token-a',
        refreshToken: 'token-r',
      });
    });

    it('returns nulls if Keychain returns false', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);
      await expect(getTokens()).resolves.toEqual({ accessToken: null, refreshToken: null });
    });

    it('returns nulls and logs warning if Keychain throws error', async () => {
      const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (Keychain.getGenericPassword as jest.Mock).mockRejectedValue(new Error('Keychain error'));

      await expect(getTokens()).resolves.toEqual({ accessToken: null, refreshToken: null });
      expect(spyWarn).toHaveBeenCalled();

      spyWarn.mockRestore();
    });
  });

  describe('getAccessToken & getRefreshToken', () => {
    it('retrieves individual tokens', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        password: JSON.stringify({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
      });

      expect(await getAccessToken()).toBe('access-1');
      expect(await getRefreshToken()).toBe('refresh-1');
    });
  });

  describe('setTokens & setAccessToken', () => {
    it('clears tokens if accessToken is null', async () => {
      await setTokens(null, 'refresh-only');
      expect(Keychain.resetGenericPassword).toHaveBeenCalled();
    });

    it('handles write error gracefully with console warning', async () => {
      const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (Keychain.setGenericPassword as jest.Mock).mockRejectedValue(new Error('Write failed'));

      await setTokens('acc', 'ref');
      expect(spyWarn).toHaveBeenCalled();

      spyWarn.mockRestore();
    });

    it('setAccessToken preserves current refresh token', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        password: JSON.stringify({ accessToken: 'old-acc', refreshToken: 'current-ref' }),
      });

      await setAccessToken('new-acc');

      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'masova-customer',
        JSON.stringify({ accessToken: 'new-acc', refreshToken: 'current-ref' }),
        expect.anything()
      );
    });
  });

  describe('clearTokens', () => {
    it('resets generic password in Keychain', async () => {
      await clearTokens();
      expect(Keychain.resetGenericPassword).toHaveBeenCalled();
    });

    it('handles reset error with console warning', async () => {
      const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (Keychain.resetGenericPassword as jest.Mock).mockRejectedValue(new Error('Reset failed'));

      await clearTokens();
      expect(spyWarn).toHaveBeenCalled();

      spyWarn.mockRestore();
    });
  });

  describe('migrateLegacyTokens', () => {
    it('returns existing Keychain tokens if already present', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        password: JSON.stringify({ accessToken: 'existing-acc', refreshToken: 'existing-ref' }),
      });

      const res = await migrateLegacyTokens();
      expect(res).toEqual({ accessToken: 'existing-acc', refreshToken: 'existing-ref' });
      expect(AsyncStorage.multiGet).not.toHaveBeenCalled();
    });

    it('migrates legacy AsyncStorage auth keys to Keychain', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        [AUTH_TOKEN_KEY, 'legacy-token'],
        [REFRESH_TOKEN_KEY, 'legacy-refresh'],
      ]);

      const tokens = await migrateLegacyTokens();

      expect(tokens).toEqual({
        accessToken: 'legacy-token',
        refreshToken: 'legacy-refresh',
      });
      expect(Keychain.setGenericPassword).toHaveBeenCalled();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        AUTH_TOKEN_KEY,
        REFRESH_TOKEN_KEY,
      ]);
    });
  });
});