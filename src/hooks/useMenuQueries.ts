/**
 * React Query hooks for menu-related API calls
 */

import { useQuery } from '@tanstack/react-query';
import { menuApi } from '../services/api';
import { MenuItem } from '../types';
import { useSelectedStore } from './useSelectedStore';

/**
 * Hook to fetch all menu items for the selected store
 */
export const useMenuItems = (params?: {
  category?: string;
  cuisine?: string;
  dietary?: string;
}) => {
  const { selectedStoreId } = useSelectedStore();

  return useQuery<MenuItem[]>({
    queryKey: ['menu', 'items', selectedStoreId, params],
    queryFn: () => menuApi.getMenu({ ...params, storeId: selectedStoreId || undefined }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch menu item by ID
 */
export const useMenuItem = (id: string) => {
  return useQuery<MenuItem>({
    queryKey: ['menu', 'item', id],
    queryFn: () => menuApi.getMenuItem(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch recommended items
 */
export const useRecommendedItems = () => {
  const { selectedStoreId } = useSelectedStore();

  return useQuery<MenuItem[]>({
    queryKey: ['menu', 'recommended', selectedStoreId],
    queryFn: () => menuApi.getRecommended(selectedStoreId || undefined),
    staleTime: 1000 * 60 * 10,
  });
};

/**
 * Hook to search menu items
 */
export const useMenuSearch = (query: string) => {
  const { selectedStoreId } = useSelectedStore();

  return useQuery<MenuItem[]>({
    queryKey: ['menu', 'search', selectedStoreId, query],
    queryFn: () => menuApi.searchMenu(query, selectedStoreId || undefined),
    enabled: query.length > 2,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Hook to fetch items by category
 */
export const useMenuByCategory = (category: string) => {
  const { selectedStoreId } = useSelectedStore();

  return useQuery<MenuItem[]>({
    queryKey: ['menu', 'category', selectedStoreId, category],
    queryFn: () => menuApi.getMenu({ storeId: selectedStoreId || undefined, category }),
    enabled: !!category,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch items by cuisine
 */
export const useMenuByCuisine = (cuisine: string) => {
  const { selectedStoreId } = useSelectedStore();

  return useQuery<MenuItem[]>({
    queryKey: ['menu', 'cuisine', selectedStoreId, cuisine],
    queryFn: () => menuApi.getMenu({ storeId: selectedStoreId || undefined, cuisine }),
    enabled: !!cuisine,
    staleTime: 1000 * 60 * 5,
  });
};
