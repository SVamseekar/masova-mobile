/**
 * Screen capture / screenshot security helpers.
 *
 * Prevents screenshots and recent-apps previews on sensitive surfaces
 * (payment success / failure). Uses expo-screen-capture when available;
 * no-ops safely when the native module is missing (unit tests, partial installs).
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';

type ScreenCaptureModule = {
  preventScreenCaptureAsync: () => Promise<void>;
  allowScreenCaptureAsync: () => Promise<void>;
};

let screenCapture: ScreenCaptureModule | null | undefined;

function getScreenCapture(): ScreenCaptureModule | null {
  if (screenCapture !== undefined) {
    return screenCapture;
  }
  try {
    // Optional peer: installed as part of Phase F hardening when native rebuild is available.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-screen-capture') as ScreenCaptureModule;
    if (
      mod &&
      typeof mod.preventScreenCaptureAsync === 'function' &&
      typeof mod.allowScreenCaptureAsync === 'function'
    ) {
      screenCapture = mod;
      return screenCapture;
    }
  } catch {
    // Module not linked — soft-disable.
  }
  screenCapture = null;
  return null;
}

/**
 * Enable or disable screenshot / screen-recording protection for the current activity.
 * Safe to call repeatedly; failures are swallowed so payment UX is never blocked.
 */
export async function setScreenCaptureProtection(enabled: boolean): Promise<void> {
  const mod = getScreenCapture();
  if (!mod) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug(
        `[screenSecurity] capture protection ${enabled ? 'requested' : 'released'} ` +
          `(module unavailable on ${Platform.OS}; install expo-screen-capture for full FLAG_SECURE)`
      );
    }
    return;
  }

  try {
    if (enabled) {
      await mod.preventScreenCaptureAsync();
    } else {
      await mod.allowScreenCaptureAsync();
    }
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[screenSecurity] Failed to toggle capture protection:', error);
    }
  }
}

/**
 * Hook: while the hosting screen is mounted, block screenshots / screen recording.
 * Restores normal capture behavior on unmount.
 */
export function useSecureScreen(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    void setScreenCaptureProtection(true);
    return () => {
      void setScreenCaptureProtection(false);
    };
  }, [enabled]);
}
