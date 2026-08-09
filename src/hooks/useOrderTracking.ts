/**
 * useOrderTracking Hook
 * Combines REST API polling with WebSocket real-time updates for order tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOrder } from './useOrderQueries';
import { websocketService, ConnectionState } from '../services/websocketService';
import { Order, DeliveryTracking } from '../types';

interface UseOrderTrackingOptions {
  orderId: string;
  enableWebSocket?: boolean;
  pollingInterval?: number;
}

interface UseOrderTrackingResult {
  order: Order | undefined;
  deliveryTracking: DeliveryTracking | undefined;
  isLoading: boolean;
  error: Error | null;
  wsConnected: boolean;
  wsState: ConnectionState;
  refetch: () => void;
}

/**
 * Hook for real-time order tracking
 * Uses WebSocket for instant order + delivery updates + REST API polling fallback
 */
export const useOrderTracking = ({
  orderId,
  enableWebSocket = true,
  pollingInterval = 10000,
}: UseOrderTrackingOptions): UseOrderTrackingResult => {
  const [wsState, setWsState] = useState<ConnectionState>('disconnected');
  const [wsOrder, setWsOrder] = useState<Order | undefined>(undefined);
  const [wsDelivery, setWsDelivery] = useState<DeliveryTracking | undefined>(undefined);
  const previousStatusRef = useRef<string | undefined>(undefined);

  // Fetch order using React Query (with polling as fallback)
  const {
    data: apiOrder,
    isLoading,
    error,
    refetch,
  } = useOrder(orderId);

  // Use WebSocket order if available, otherwise use API order
  const order = wsOrder || apiOrder;

  // Track status changes
  const handleStatusChange = useCallback(
    (newStatus: string) => {
      previousStatusRef.current = newStatus;
    },
    []
  );

  // Watch for status changes from API order
  useEffect(() => {
    if (apiOrder?.status) {
      handleStatusChange(apiOrder.status);
    }
  }, [apiOrder?.status, handleStatusChange]);

  // Connect to WebSocket and subscribe to order & delivery updates
  useEffect(() => {
    if (!enableWebSocket || !orderId) return;

    let orderUnsub: (() => void) | undefined;
    let deliveryUnsub: (() => void) | undefined;
    let connectionStateUnsubscribe: (() => void) | undefined;

    const setupWebSocket = async () => {
      try {
        // Listen to connection state changes
        connectionStateUnsubscribe = websocketService.onConnectionStateChange(setWsState);

        // Connect if not already connected
        if (websocketService.getConnectionState() === 'disconnected') {
          await websocketService.connect().catch((err) => {
            console.log('[useOrderTracking] WebSocket connect fallback:', err?.message);
          });
        }

        // Subscribe to order updates
        orderUnsub = websocketService.subscribeToOrder(orderId, (updatedOrder) => {
          console.log('[useOrderTracking] Order update received:', updatedOrder.status);
          setWsOrder(updatedOrder);

          if (updatedOrder.status) {
            handleStatusChange(updatedOrder.status);
          }
        });

        // Subscribe to delivery updates
        deliveryUnsub = websocketService.subscribeToDelivery(orderId, (updatedDelivery) => {
          console.log('[useOrderTracking] Delivery update received:', updatedDelivery.status);
          setWsDelivery(updatedDelivery);
        });
      } catch (error) {
        // WebSocket failed - REST API polling will be used as fallback
        console.log('[useOrderTracking] WebSocket unavailable, using REST polling');
      }
    };

    setupWebSocket();

    // Cleanup on unmount
    return () => {
      if (orderUnsub) orderUnsub();
      if (deliveryUnsub) deliveryUnsub();
      if (connectionStateUnsubscribe) connectionStateUnsubscribe();
    };
  }, [orderId, enableWebSocket, handleStatusChange]);

  return {
    order,
    deliveryTracking: wsDelivery,
    isLoading,
    error: error as Error | null,
    wsConnected: wsState === 'connected',
    wsState,
    refetch,
  };
};

export default useOrderTracking;

