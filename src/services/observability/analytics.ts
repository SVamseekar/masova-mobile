import * as Sentry from '@sentry/react-native';
import { CONFIG } from '../../config';

export type AnalyticsEventName =
  | 'auth.login.success'
  | 'auth.login.fail'
  | 'order.create.success'
  | 'order.create.fail'
  | 'payment.success'
  | 'payment.fail'
  | 'menu.load.fail';

export interface AnalyticsEventPayloads {
  'auth.login.success': { userId: string; customerId?: string; method?: string };
  'auth.login.fail': { email?: string; reason: string };
  'order.create.success': { orderId: string; customerId: string; totalAmount: number; paymentMethod: string; orderType: string };
  'order.create.fail': { customerId?: string; totalAmount?: number; reason: string };
  'payment.success': { orderId: string; transactionId?: string; paymentMethod: string };
  'payment.fail': { orderId: string; reason: string };
  'menu.load.fail': { storeId?: string; reason: string };
}

class AnalyticsService {
  private eventsLog: Array<{ event: string; payload: unknown; timestamp: string }> = [];

  /**
   * Track an analytics event with strongly typed payload.
   */
  track<E extends AnalyticsEventName>(event: E, payload: AnalyticsEventPayloads[E]): void {
    const timestamp = new Date().toISOString();
    const eventEntry = { event, payload, timestamp };

    this.eventsLog.push(eventEntry);

    if (this.eventsLog.length > 100) {
      this.eventsLog.shift();
    }

    if (__DEV__) {
      console.log(`[Analytics] 📊 ${event}:`, JSON.stringify(payload));
    }

    if (CONFIG.SENTRY_DSN) {
      try {
        Sentry.addBreadcrumb({
          category: 'analytics',
          message: event,
          data: payload as Record<string, unknown>,
          level: event.endsWith('.fail') ? 'warning' : 'info',
        });
      } catch {
        // Silently ignore breadcrumb failure if Sentry is inactive
      }
    }
  }

  /**
   * Get recent events log for diagnostics/testing.
   */
  getEventsLog() {
    return [...this.eventsLog];
  }

  /**
   * Clear event log (useful for tests).
   */
  clearEventsLog() {
    this.eventsLog = [];
  }
}

export const analytics = new AnalyticsService();
export default analytics;
