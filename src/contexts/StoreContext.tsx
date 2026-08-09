/**
 * Store Context
 * Provides global selected store state across the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { Store } from '../types';
import { storeApi } from '../services/api';

import { setClientSelectedStoreContext } from '../services/http/client';

const SELECTED_STORE_KEY = '@masova_selected_store';

interface StoreContextType {
  selectedStore: Store | null;
  selectedStoreId: string | null;
  isLoading: boolean;
  setSelectedStore: (store: Store | null) => Promise<void>;
  refreshStore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Keep HTTP client header context in sync with selected store
  useEffect(() => {
    const storeIdOrCode = selectedStore?.storeCode || selectedStore?.id || null;
    setClientSelectedStoreContext(storeIdOrCode);
  }, [selectedStore]);

  // Load selected store from storage; if none, auto-pick first active store from API
  useEffect(() => {
    loadSelectedStore();
  }, []);

  const loadSelectedStore = async () => {
    try {
      const storedData = await AsyncStorage.getItem(SELECTED_STORE_KEY);
      if (storedData) {
        const store = JSON.parse(storedData) as Store;
        setSelectedStoreState(store);
        setClientSelectedStoreContext(store.storeCode || store.id || null);
        return;
      }

      // First launch: bootstrap from backend store list (no hardcode)
      try {
        const stores = await storeApi.getAll();
        const list = Array.isArray(stores) ? stores : [];
        const first =
          list.find((s) => (s.storeCode || s.id) && (s.status === 'ACTIVE' || !s.status)) ||
          list[0];
        if (first) {
          await AsyncStorage.setItem(SELECTED_STORE_KEY, JSON.stringify(first));
          setSelectedStoreState(first);
          setClientSelectedStoreContext(first.storeCode || first.id || null);
          queryClient.invalidateQueries({ queryKey: ['menu'] });
        }
      } catch (apiErr) {
        console.warn('Could not auto-select store from API:', apiErr);
      }
    } catch (err) {
      console.error('Failed to load selected store:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setSelectedStore = useCallback(async (store: Store | null) => {
    try {
      if (store) {
        await AsyncStorage.setItem(SELECTED_STORE_KEY, JSON.stringify(store));
      } else {
        await AsyncStorage.removeItem(SELECTED_STORE_KEY);
      }
      setSelectedStoreState(store);
      setClientSelectedStoreContext(store?.storeCode || store?.id || null);

      // Invalidate menu queries when store changes to force refetch
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    } catch (err) {
      console.error('Failed to save selected store:', err);
    }
  }, [queryClient]);

  const value: StoreContextType = {
    selectedStore,
    selectedStoreId: selectedStore?.storeCode || selectedStore?.id || null,
    isLoading,
    setSelectedStore,
    refreshStore: loadSelectedStore,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStoreContext = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return context;
};
