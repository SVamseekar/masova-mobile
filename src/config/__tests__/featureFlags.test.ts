import {
  isFeatureEnabled,
  getAllFeatureFlags,
  setFeatureFlagOverride,
  resetFeatureFlagOverrides,
} from '../featureFlags';

describe('Feature Flags Module', () => {
  beforeEach(() => {
    resetFeatureFlagOverrides();
  });

  it('returns default flag values', () => {
    expect(isFeatureEnabled('ENABLE_REVIEWS')).toBe(true);
    expect(isFeatureEnabled('ENABLE_LOYALTY')).toBe(true);
    expect(isFeatureEnabled('ENABLE_OFFLINE_BANNER')).toBe(true);
  });

  it('allows overriding flag values dynamically', () => {
    setFeatureFlagOverride('ENABLE_REVIEWS', false);
    expect(isFeatureEnabled('ENABLE_REVIEWS')).toBe(false);

    setFeatureFlagOverride('ENABLE_REVIEWS', true);
    expect(isFeatureEnabled('ENABLE_REVIEWS')).toBe(true);
  });

  it('resets overrides properly', () => {
    setFeatureFlagOverride('ENABLE_LOYALTY', false);
    expect(isFeatureEnabled('ENABLE_LOYALTY')).toBe(false);

    resetFeatureFlagOverrides();
    expect(isFeatureEnabled('ENABLE_LOYALTY')).toBe(true);
  });

  it('returns all feature flags map', () => {
    const flags = getAllFeatureFlags();
    expect(flags).toHaveProperty('ENABLE_REVIEWS', true);
    expect(flags).toHaveProperty('ENABLE_LOYALTY', true);
    expect(flags).toHaveProperty('ENABLE_DELIVERY_TRACKING_WS', true);
  });
});
