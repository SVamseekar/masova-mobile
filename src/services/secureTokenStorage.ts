/**
 * Secure token storage using iOS Keychain / Android Keystore.
 */
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYCHAIN_SERVICE = 'com.masova.customer.auth';
export const AUTH_TOKEN_KEY = 'masova_auth_token';
export const REFRESH_TOKEN_KEY = 'masova_refresh_token';

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

const keychainOptions = {
  service: KEYCHAIN_SERVICE,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function getTokens(): Promise<StoredTokens> {
  try {
    const credentials = await Keychain.getGenericPassword(keychainOptions);
    if (!credentials) {
      return { accessToken: null, refreshToken: null };
    }

    const parsed = JSON.parse(credentials.password) as StoredTokens;
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
    };
  } catch (error) {
    console.warn('Failed to read tokens from Keychain:', error);
    return { accessToken: null, refreshToken: null };
  }
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  return tokens.accessToken;
}

export async function getRefreshToken(): Promise<string | null> {
  const tokens = await getTokens();
  return tokens.refreshToken;
}

export async function setTokens(
  accessToken: string | null,
  refreshToken: string | null
): Promise<void> {
  if (!accessToken) {
    await clearTokens();
    return;
  }

  try {
    await Keychain.setGenericPassword(
      'masova-customer',
      JSON.stringify({ accessToken, refreshToken }),
      keychainOptions
    );
  } catch (error) {
    console.warn('Failed to write tokens to Keychain:', error);
  }
}

export async function setAccessToken(accessToken: string): Promise<void> {
  const refreshToken = await getRefreshToken();
  await setTokens(accessToken, refreshToken);
}

export async function clearTokens(): Promise<void> {
  try {
    await Keychain.resetGenericPassword(keychainOptions);
  } catch (error) {
    console.warn('Failed to clear Keychain tokens:', error);
  }
}

/**
 * One-time migration for users who still have tokens in AsyncStorage.
 */
export async function migrateLegacyTokens(): Promise<StoredTokens> {
  const existing = await getTokens();
  if (existing.accessToken) {
    return existing;
  }

  const [legacyAccess, legacyRefresh] = await AsyncStorage.multiGet([
    AUTH_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
  ]);

  const accessToken = legacyAccess[1];
  const refreshToken = legacyRefresh[1];

  if (accessToken) {
    await setTokens(accessToken, refreshToken);
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  }

  return { accessToken, refreshToken };
}