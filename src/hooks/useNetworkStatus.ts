/**
 * Network status hook
 * Uses @react-native-community/netinfo when the native module is linked.
 * Soft-degrades to "online" when native NetInfo is missing (stale APK / unit tests).
 */

import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isOffline: boolean;
}

type NetInfoState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

type NetInfoModule = {
  fetch: () => Promise<NetInfoState>;
  addEventListener: (listener: (state: NetInfoState) => void) => () => void;
};

const ONLINE: NetworkStatus = {
  isConnected: true,
  isInternetReachable: true,
  isOffline: false,
};

function getNetInfo(): NetInfoModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-community/netinfo');
    const NetInfo = mod?.default ?? mod;
    // Package throws at load time when native RNCNetInfo is null (stale APK).
    if (
      NetInfo &&
      typeof NetInfo.fetch === 'function' &&
      typeof NetInfo.addEventListener === 'function'
    ) {
      return NetInfo as NetInfoModule;
    }
  } catch (err) {
    if (__DEV__) {
      console.warn('[useNetworkStatus] NetInfo unavailable:', (err as Error)?.message || err);
    }
  }
  return null;
}

function toStatus(state: NetInfoState): NetworkStatus {
  const isConnected = state.isConnected ?? true;
  const isInternetReachable = state.isInternetReachable;
  const isOffline = isConnected === false || isInternetReachable === false;
  return { isConnected, isInternetReachable, isOffline };
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(ONLINE);

  useEffect(() => {
    const NetInfo = getNetInfo();
    if (!NetInfo) {
      if (__DEV__) {
        console.warn(
          '[useNetworkStatus] NetInfo native module unavailable — assuming online. Rebuild the app after installing @react-native-community/netinfo.'
        );
      }
      setStatus(ONLINE);
      return;
    }

    let cancelled = false;

    NetInfo.fetch()
      .then((state) => {
        if (!cancelled) setStatus(toStatus(state));
      })
      .catch(() => {
        if (!cancelled) setStatus(ONLINE);
      });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setStatus(toStatus(state));
    });

    return () => {
      cancelled = true;
      try {
        unsubscribe();
      } catch {
        // ignore
      }
    };
  }, []);

  return status;
}

export default useNetworkStatus;
