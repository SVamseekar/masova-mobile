/**
 * WebSocket Service for Real-Time Order Tracking
 * Uses STOMP over WebSocket for order and delivery updates via Gateway
 */

import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import CONFIG from '../config';
import { getAccessToken } from './secureTokenStorage';
import { Order, DeliveryTracking } from '../types';

export type OrderUpdateCallback = (order: Order) => void;
export type DeliveryUpdateCallback = (tracking: DeliveryTracking) => void;
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private connectionState: ConnectionState = 'disconnected';
  private connectionStateListeners: Array<(state: ConnectionState) => void> = [];

  async connect(): Promise<void> {
    if (this.connectionState === 'connected' && this.client?.connected) {
      return Promise.resolve();
    }

    if (this.connectionState === 'connecting') {
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.connectionState === 'connected') {
            resolve();
          } else if (this.connectionState === 'error') {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    const token = await getAccessToken();

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = CONFIG.WS_BASE_URL;
        const socketFactory = () => new WebSocket(wsUrl);

        this.client = new Client({
          webSocketFactory: socketFactory as any,
          connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
          debug: (str) => {
            if (__DEV__) {
              console.log('[WebSocket]', str);
            }
          },
          reconnectDelay: this.reconnectDelay,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            console.log('[WebSocket] Connected via Gateway');
            this.reconnectAttempts = 0;
            this.setConnectionState('connected');
            resolve();
          },
          onDisconnect: () => {
            console.log('[WebSocket] Disconnected');
            this.setConnectionState('disconnected');
          },
          onStompError: (frame) => {
            console.error('[WebSocket] Error:', frame.headers['message'], frame.body);
            this.setConnectionState('error');
            reject(new Error(frame.headers['message'] || 'STOMP error'));
          },
          onWebSocketError: (event) => {
            console.error('[WebSocket] Error:', event);
            this.setConnectionState('error');
            reject(new Error('WebSocket connection error'));
          },
        });

        this.setConnectionState('connecting');
        this.client.activate();

        setTimeout(() => {
          if (this.connectionState === 'connecting') {
            this.setConnectionState('error');
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        this.setConnectionState('error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();

      this.client.deactivate();
      this.client = null;
      this.setConnectionState('disconnected');
    }
  }

  subscribeToOrder(orderId: string, callback: OrderUpdateCallback): () => void {
    if (!this.client) {
      console.warn('[WebSocket] Client not connected.');
      return () => {};
    }

    const topic = `/topic/order/${orderId}`;
    const subscriptionKey = `order-${orderId}`;

    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey)?.unsubscribe();
    }

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const order: Order = JSON.parse(message.body);
        console.log('[WebSocket] Order update:', order.id, order.status);
        callback(order);
      } catch (error) {
        console.error('[WebSocket] Failed to parse order update:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);

    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    };
  }

  subscribeToDelivery(orderId: string, callback: DeliveryUpdateCallback): () => void {
    if (!this.client) {
      console.warn('[WebSocket] Client not connected.');
      return () => {};
    }

    const topic = `/topic/delivery/${orderId}`;
    const subscriptionKey = `delivery-${orderId}`;

    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey)?.unsubscribe();
    }

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const tracking: DeliveryTracking = JSON.parse(message.body);
        console.log('[WebSocket] Delivery update:', tracking.status);
        callback(tracking);
      } catch (error) {
        console.error('[WebSocket] Failed to parse delivery update:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);

    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    };
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
    this.connectionStateListeners.push(listener);
    return () => {
      const index = this.connectionStateListeners.indexOf(listener);
      if (index > -1) {
        this.connectionStateListeners.splice(index, 1);
      }
    };
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.connectionStateListeners.forEach((listener) => listener(state));
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
