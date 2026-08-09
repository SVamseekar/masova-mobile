/**
 * Hook to manage selected store state
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { Store } from '../types';

const SELECTED_STORE_KEY = '@masova_selected_store';

export const useSelectedStore = () => {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Load selected store from storage on mount
  useEffect(() => {
    loadSelectedStore();
  }, []);

  const loadSelectedStore = async () => {
    try {
      const storedData = await AsyncStorage.getItem(SELECTED_STORE_KEY);
      if (storedData) {
        const store = JSON.parse(storedData);
        setSelectedStore(store);
      }
    } catch (err) {
      console.error('Failed to load selected store:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSelectedStore = useCallback(async (store: Store | null) => {
    try {
      if (store) {
        await AsyncStorage.setItem(SELECTED_STORE_KEY, JSON.stringify(store));
      } else {
        await AsyncStorage.removeItem(SELECTED_STORE_KEY);
      }
      setSelectedStore(store);

      // Invalidate menu queries when store changes
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    } catch (err) {
      console.error('Failed to save selected store:', err);
    }
  }, [queryClient]);

  return {
    selectedStore,
    selectedStoreId: selectedStore?.storeCode || selectedStore?.id || null,
    isLoading,
    setSelectedStore: saveSelectedStore,
    refreshStore: loadSelectedStore,
  };
};
