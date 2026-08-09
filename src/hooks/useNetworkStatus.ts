/**
 * Network status hook
 * Uses @react-native-community/netinfo to monitor network connectivity
 */

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isOffline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    isOffline: false,
  });

  useEffect(() => {
    // Initial fetch
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected ?? true;
      const isInternetReachable = state.isInternetReachable;
      const isOffline = isConnected === false || isInternetReachable === false;
      setStatus({ isConnected, isInternetReachable, isOffline });
    });

    // Subscribe to state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? true;
      const isInternetReachable = state.isInternetReachable;
      const isOffline = isConnected === false || isInternetReachable === false;
      setStatus({ isConnected, isInternetReachable, isOffline });
    });

    return () => unsubscribe();
  }, []);

  return status;
}

export default useNetworkStatus;
