/**
 * React Query hooks for order-related API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, deliveryApi } from '../services/api';
import { Order, CreateOrderRequest } from '../types';

/**
 * Hook to fetch order by ID
 */
export const useOrder = (orderId: string) => {
  return useQuery<Order>({
    queryKey: ['orders', orderId],
    queryFn: () => orderApi.getById(orderId),
    enabled: !!orderId,
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
};

/**
 * Hook to track order (public endpoint, no auth required)
 */
export const useTrackOrder = (orderId: string) => {
  return useQuery<Order>({
    queryKey: ['orders', 'track', orderId],
    queryFn: () => orderApi.track(orderId),
    enabled: !!orderId,
    refetchInterval: 15000,
  });
};

/**
 * Hook to fetch customer's orders
 */
export const useCustomerOrders = (customerId: string, page?: number) => {
  return useQuery<Order[]>({
    queryKey: ['orders', 'customer', customerId, page],
    queryFn: () => orderApi.getCustomerOrders(customerId, { page, size: 20 }),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Hook to fetch delivery tracking info
 */
export const useDeliveryTracking = (orderId: string) => {
  return useQuery({
    queryKey: ['delivery', 'track', orderId],
    queryFn: () => deliveryApi.track(orderId),
    enabled: !!orderId,
    refetchInterval: 10000,
  });
};

/**
 * Hook to create a new order
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => orderApi.create(data),
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'customer'] });
      queryClient.setQueryData(['orders', newOrder.id], newOrder);
    },
  });
};

/**
 * Hook to cancel an order
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => orderApi.cancel(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'customer'] });
    },
  });
};
