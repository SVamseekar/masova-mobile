/**
 * React Query hooks for menu-related API calls
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { menuApi } from '../services/api';
import { MenuItem } from '../types';
import { useSelectedStore } from './useSelectedStore';

/**
 * Hook to fetch all menu items
 * Includes storeId in query key to ensure proper cache invalidation when store changes
 */
export const useMenuItems = (params?: {
  category?: string;
  cuisine?: string;
  dietary?: string;
}) => {
  const { selectedStoreId } = useSelectedStore();

  return useQuery<MenuItem[]>({
    queryKey: ['menu', 'items', selectedStoreId, params],
    queryFn: () => menuApi.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch menu item by ID
 */
export const useMenuItem = (id: string) => {
  return useQuery<MenuItem>({
    queryKey: ['menu', 'item', id],
    queryFn: () => menuApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch recommended items
 * Includes storeId in query key to ensure proper cache invalidation when store changes
 */
export const useRecommendedItems = () => {
  const { selectedStoreId } = useSelectedStore();

  return useQuery<MenuItem[]>({
    queryKey: ['menu', 'recommended', selectedStoreId],
    queryFn: () => menuApi.getRecommended(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to search menu items
 */
export const useMenuSearch = (query: string) => {
  return useQuery<MenuItem[]>({
    queryKey: ['menu', 'search', query],
    queryFn: () => menuApi.search(query),
    enabled: query.length > 2, // Only search if query is at least 3 characters
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to fetch items by category
 */
export const useMenuByCategory = (category: string) => {
  return useQuery<MenuItem[]>({
    queryKey: ['menu', 'category', category],
    queryFn: () => menuApi.getByCategory(category),
    enabled: !!category,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to fetch items by cuisine
 */
export const useMenuByCuisine = (cuisine: string) => {
  return useQuery<MenuItem[]>({
    queryKey: ['menu', 'cuisine', cuisine],
    queryFn: () => menuApi.getByCuisine(cuisine),
    enabled: !!cuisine,
    staleTime: 1000 * 60 * 5,
  });
};
