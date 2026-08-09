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
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * Pure helper to calculate exponential backoff delay with optional jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay = 1000,
  maxDelay = 30000,
  enableJitter = true
): number {
  if (attempt <= 0) return baseDelay;
  const expDelay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1));
  if (!enableJitter) return expDelay;
  // Apply +/- 20% jitter
  const jitter = expDelay * 0.2 * (Math.random() * 2 - 1);
  return Math.round(Math.max(baseDelay, expDelay + jitter));
}

export function buildOrderTopic(orderId: string): string {
  return `/topic/order/${orderId}`;
}

export function buildDeliveryTopic(orderId: string): string {
  return `/topic/delivery/${orderId}`;
}

interface ActiveSubscription {
  topic: string;
  callback: (message: IMessage) => void;
  stompSub?: StompSubscription;
}

class WebSocketService {
  private client: Client | null = null;
  private activeSubscriptions: Map<string, ActiveSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private connectionStateListeners: Array<(state: ConnectionState) => void> = [];
  private isExplicitDisconnect = false;

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

    this.isExplicitDisconnect = false;
    const token = await getAccessToken();

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = CONFIG.WS_BASE_URL;
        const socketFactory = () => new WebSocket(wsUrl);

        this.client = new Client({
          webSocketFactory: socketFactory as any,
          connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
          beforeConnect: async () => {
            // Refresh token before reconnecting or connecting
            try {
              const latestToken = await getAccessToken();
              if (latestToken && this.client) {
                this.client.connectHeaders = { Authorization: `Bearer ${latestToken}` };
              }
            } catch (err) {
              console.warn('[WebSocket] Failed to fetch latest token prior to connect:', err);
            }
          },
          debug: (str) => {
            if (__DEV__) {
              console.log('[WebSocket]', str);
            }
          },
          reconnectDelay: 0, // Handled manually via scheduleReconnect for exponential backoff & token refresh
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          onConnect: () => {
            console.log('[WebSocket] Connected via Gateway');
            this.reconnectAttempts = 0;
            this.setConnectionState('connected');
            this.resubscribeAll();
            resolve();
          },
          onDisconnect: () => {
            console.log('[WebSocket] Disconnected');
            if (!this.isExplicitDisconnect) {
              this.setConnectionState('reconnecting');
              this.scheduleReconnect();
            } else {
              this.setConnectionState('disconnected');
            }
          },
          onStompError: (frame) => {
            console.error('[WebSocket] STOMP Error:', frame.headers['message'], frame.body);
            this.setConnectionState('error');
            if (!this.client?.connected && !this.isExplicitDisconnect) {
              this.scheduleReconnect();
            }
            reject(new Error(frame.headers['message'] || 'STOMP error'));
          },
          onWebSocketError: (event) => {
            console.error('[WebSocket] WS Error:', event);
            this.setConnectionState('error');
            if (!this.isExplicitDisconnect) {
              this.scheduleReconnect();
            }
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
        console.error('[WebSocket] Connection setup failed:', error);
        this.setConnectionState('error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isExplicitDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.client) {
      this.activeSubscriptions.forEach((sub) => {
        sub.stompSub?.unsubscribe();
      });
      this.activeSubscriptions.clear();

      this.client.deactivate();
      this.client = null;
      this.setConnectionState('disconnected');
    }
  }

  private scheduleReconnect(): void {
    if (this.isExplicitDisconnect) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnect attempts reached');
      this.setConnectionState('error');
      return;
    }

    this.reconnectAttempts += 1;
    const delay = calculateBackoffDelay(
      this.reconnectAttempts,
      this.baseReconnectDelay,
      this.maxReconnectDelay
    );
    console.log(`[WebSocket] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(async () => {
      if (this.isExplicitDisconnect) return;
      try {
        this.setConnectionState('reconnecting');
        if (this.client) {
          const freshToken = await getAccessToken();
          if (freshToken) {
            this.client.connectHeaders = { Authorization: `Bearer ${freshToken}` };
          }
          this.client.activate();
        } else {
          await this.connect();
        }
      } catch (err) {
        console.error('[WebSocket] Reconnect attempt failed:', err);
      }
    }, delay);
  }

  private resubscribeAll(): void {
    if (!this.client || !this.client.connected) return;

    this.activeSubscriptions.forEach((sub, key) => {
      try {
        sub.stompSub?.unsubscribe();
        const stompSub = this.client!.subscribe(sub.topic, sub.callback);
        this.activeSubscriptions.set(key, { ...sub, stompSub });
      } catch (err) {
        console.error(`[WebSocket] Failed to resubscribe topic ${sub.topic}:`, err);
      }
    });
  }

  subscribeToOrder(orderId: string, callback: OrderUpdateCallback): () => void {
    const topic = buildOrderTopic(orderId);
    const key = `order-${orderId}`;

    const handler = (message: IMessage) => {
      try {
        const order: Order = JSON.parse(message.body);
        console.log('[WebSocket] Order update:', order.id, order.status);
        callback(order);
      } catch (error) {
        console.error('[WebSocket] Failed to parse order update:', error);
      }
    };

    let stompSub: StompSubscription | undefined;
    if (this.client && this.client.connected) {
      stompSub = this.client.subscribe(topic, handler);
    }

    this.activeSubscriptions.set(key, { topic, callback: handler, stompSub });

    return () => {
      const active = this.activeSubscriptions.get(key);
      active?.stompSub?.unsubscribe();
      this.activeSubscriptions.delete(key);
    };
  }

  subscribeToDelivery(orderId: string, callback: DeliveryUpdateCallback): () => void {
    const topic = buildDeliveryTopic(orderId);
    const key = `delivery-${orderId}`;

    const handler = (message: IMessage) => {
      try {
        const tracking: DeliveryTracking = JSON.parse(message.body);
        console.log('[WebSocket] Delivery update:', tracking.status);
        callback(tracking);
      } catch (error) {
        console.error('[WebSocket] Failed to parse delivery update:', error);
      }
    };

    let stompSub: StompSubscription | undefined;
    if (this.client && this.client.connected) {
      stompSub = this.client.subscribe(topic, handler);
    }

    this.activeSubscriptions.set(key, { topic, callback: handler, stompSub });

    return () => {
      const active = this.activeSubscriptions.get(key);
      active?.stompSub?.unsubscribe();
      this.activeSubscriptions.delete(key);
    };
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
    this.connectionStateListeners.push(listener);
    // Immediately inform listener of current state
    listener(this.connectionState);
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

