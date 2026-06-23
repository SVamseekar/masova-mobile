import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {
  getTokens,
  setTokens,
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