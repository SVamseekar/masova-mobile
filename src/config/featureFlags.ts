/**
 * Feature Flags Configuration for MaSoVa Mobile
 * Allows toggling features locally and provides hooks for remote flag config.
 */

export type FeatureFlagKey =
  | 'ENABLE_REVIEWS'
  | 'ENABLE_LOYALTY'
  | 'ENABLE_DELIVERY_TRACKING_WS'
  | 'ENABLE_OFFLINE_BANNER'
  | 'ENABLE_PREFERENCES_EDIT'
  | 'ENABLE_STRICT_STORE_GUARD'
  | 'ENABLE_PAYMENT_GATEWAY';

export type FeatureFlagsMap = Record<FeatureFlagKey, boolean>;

const DEFAULT_FEATURE_FLAGS: FeatureFlagsMap = {
  ENABLE_REVIEWS: true,
  ENABLE_LOYALTY: true,
  ENABLE_DELIVERY_TRACKING_WS: true,
  ENABLE_OFFLINE_BANNER: true,
  ENABLE_PREFERENCES_EDIT: true,
  ENABLE_STRICT_STORE_GUARD: true,
  ENABLE_PAYMENT_GATEWAY: true,
};

let flagOverrides: Partial<FeatureFlagsMap> = {};

/**
 * Returns whether a feature flag is enabled.
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  if (flag in flagOverrides) {
    return Boolean(flagOverrides[flag]);
  }
  return DEFAULT_FEATURE_FLAGS[flag] ?? false;
}

/**
 * Gets all current feature flags merged with active overrides.
 */
export function getAllFeatureFlags(): FeatureFlagsMap {
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...flagOverrides,
  };
}

/**
 * Set an override for a feature flag (useful for testing or runtime debug toggle).
 */
export function setFeatureFlagOverride(flag: FeatureFlagKey, enabled: boolean): void {
  flagOverrides[flag] = enabled;
}

/**
 * Reset all feature flag overrides.
 */
export function resetFeatureFlagOverrides(): void {
  flagOverrides = {};
}

export const featureFlags = {
  isEnabled: isFeatureEnabled,
  getAll: getAllFeatureFlags,
  setOverride: setFeatureFlagOverride,
  resetOverrides: resetFeatureFlagOverrides,
};

export default featureFlags;
