import websocketService, {
  calculateBackoffDelay,
  buildOrderTopic,
  buildDeliveryTopic,
} from '../websocketService';

describe('websocketService unit tests', () => {
  describe('topic builders', () => {
    it('builds order topic correctly', () => {
      expect(buildOrderTopic('ord-123')).toBe('/topic/order/ord-123');
    });

    it('builds delivery topic correctly', () => {
      expect(buildDeliveryTopic('ord-123')).toBe('/topic/delivery/ord-123');
    });
  });

  describe('calculateBackoffDelay', () => {
    it('returns baseDelay for attempt <= 0', () => {
      expect(calculateBackoffDelay(0, 1000, 30000, false)).toBe(1000);
      expect(calculateBackoffDelay(-1, 1000, 30000, false)).toBe(1000);
    });

    it('calculates exponential backoff without jitter', () => {
      expect(calculateBackoffDelay(1, 1000, 30000, false)).toBe(1000);
      expect(calculateBackoffDelay(2, 1000, 30000, false)).toBe(2000);
      expect(calculateBackoffDelay(3, 1000, 30000, false)).toBe(4000);
      expect(calculateBackoffDelay(4, 1000, 30000, false)).toBe(8000);
    });

    it('caps backoff at maxDelay', () => {
      expect(calculateBackoffDelay(10, 1000, 30000, false)).toBe(30000);
    });

    it('applies jitter within expected bounds (+/- 20%)', () => {
      const delay = calculateBackoffDelay(3, 1000, 30000, true);
      // Expected exp value: 4000. Jitter range: 3200..4800
      expect(delay).toBeGreaterThanOrEqual(3200);
      expect(delay).toBeLessThanOrEqual(4800);
    });
  });

  describe('connection state management', () => {
    it('allows registering and unregistering connection state listeners', () => {
      const listener = jest.fn();
      const unsubscribe = websocketService.onConnectionStateChange(listener);

      // Immediately called with current state
      expect(listener).toHaveBeenCalledWith('disconnected');

      unsubscribe();
    });
  });
});
