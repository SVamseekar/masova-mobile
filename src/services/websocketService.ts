/**
 * WebSocket Service for Real-Time Order Tracking
 * Uses STOMP over WebSocket for order and delivery updates
 */

import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, DeliveryTracking } from '../types';

// WebSocket URLs based on environment
const getWebSocketUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8080/ws';
    }
    return 'http://localhost:8080/ws';
  }
  return 'wss://api.masova.com/ws';
};

const WS_URL = getWebSocketUrl();
const AUTH_TOKEN_KEY = 'masova_auth_token';

/**
 * Order update callback
 */
export type OrderUpdateCallback = (order: Order) => void;

/**
 * Delivery tracking update callback
 */
export type DeliveryUpdateCallback = (tracking: DeliveryTracking) => void;

/**
 * WebSocket connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * WebSocket Service Class
 */
class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private connectionState: ConnectionState = 'disconnected';
  private connectionStateListeners: Array<(state: ConnectionState) => void> = [];

  /**
   * Connect to WebSocket server
   * Returns a promise that resolves when connection is established
   */
  async connect(): Promise<void> {
    // If already connected, return immediately
    if (this.connectionState === 'connected' && this.client?.connected) {
      return Promise.resolve();
    }

    // If already connecting, wait for connection
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

    return new Promise(async (resolve, reject) => {
      try {
        // Get auth token
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

        // Use native WebSocket (SockJS is Node.js-only and crashes Hermes)
        const wsUrl = WS_URL.replace(/^http/, 'ws');
        const socketFactory = () => new WebSocket(wsUrl);

        // Create STOMP client
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
            console.log('[WebSocket] Connected');
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
            console.error('[WebSocket] WebSocket Error:', event);
            this.setConnectionState('error');
            reject(new Error('WebSocket connection error'));
          },
        });

        this.setConnectionState('connecting');
        this.client.activate();

        // Timeout after 10 seconds
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

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.client) {
      // Unsubscribe from all topics
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();

      // Deactivate client
      this.client.deactivate();
      this.client = null;
      this.setConnectionState('disconnected');
    }
  }

  /**
   * Subscribe to order updates
   */
  subscribeToOrder(orderId: string, callback: OrderUpdateCallback): () => void {
    if (!this.client) {
      console.warn('[WebSocket] Client not connected. Call connect() first.');
      return () => {};
    }

    const topic = `/topic/order/${orderId}`;
    const subscriptionKey = `order-${orderId}`;

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey)?.unsubscribe();
    }

    // Subscribe to topic
    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const order: Order = JSON.parse(message.body);
        console.log('[WebSocket] Order update received:', order.id, order.status);
        callback(order);
      } catch (error) {
        console.error('[WebSocket] Failed to parse order update:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log('[WebSocket] Subscribed to:', topic);

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
      console.log('[WebSocket] Unsubscribed from:', topic);
    };
  }

  /**
   * Subscribe to delivery tracking updates
   */
  subscribeToDelivery(orderId: string, callback: DeliveryUpdateCallback): () => void {
    if (!this.client) {
      console.warn('[WebSocket] Client not connected. Call connect() first.');
      return () => {};
    }

    const topic = `/topic/delivery/${orderId}`;
    const subscriptionKey = `delivery-${orderId}`;

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey)?.unsubscribe();
    }

    // Subscribe to topic
    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const tracking: DeliveryTracking = JSON.parse(message.body);
        console.log('[WebSocket] Delivery update received:', tracking.status);
        callback(tracking);
      } catch (error) {
        console.error('[WebSocket] Failed to parse delivery update:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    console.log('[WebSocket] Subscribed to:', topic);

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
      console.log('[WebSocket] Unsubscribed from:', topic);
    };
  }

  /**
   * Send message to server (if needed)
   */
  send(destination: string, body: any): void {
    if (!this.client || this.connectionState !== 'connected') {
      console.warn('[WebSocket] Cannot send message. Not connected.');
      return;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Add connection state listener
   */
  onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
    this.connectionStateListeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.connectionStateListeners.indexOf(listener);
      if (index > -1) {
        this.connectionStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Set connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.connectionStateListeners.forEach((listener) => listener(state));
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.setConnectionState('error');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnection failed:', error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

export default websocketService;
