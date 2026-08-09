import { analytics } from '../analytics';

jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    analytics.clearEventsLog();
  });

  it('tracks auth.login.success and auth.login.fail events', () => {
    analytics.track('auth.login.success', { userId: 'usr-1', customerId: 'cust-1', method: 'email' });
    analytics.track('auth.login.fail', { email: 'bad@masova.com', reason: 'Invalid credentials' });

    const log = analytics.getEventsLog();
    expect(log).toHaveLength(2);
    expect(log[0].event).toBe('auth.login.success');
    expect(log[1].event).toBe('auth.login.fail');
  });

  it('tracks order.create.success and order.create.fail events', () => {
    analytics.track('order.create.success', {
      orderId: 'ord-100',
      customerId: 'cust-1',
      totalAmount: 49.99,
      paymentMethod: 'UPI',
      orderType: 'DELIVERY',
    });
    analytics.track('order.create.fail', {
      customerId: 'cust-1',
      totalAmount: 49.99,
      reason: 'Out of stock',
    });

    const log = analytics.getEventsLog();
    expect(log).toHaveLength(2);
    expect(log[0].event).toBe('order.create.success');
    expect(log[1].event).toBe('order.create.fail');
  });

  it('tracks payment.success and payment.fail events', () => {
    analytics.track('payment.success', { orderId: 'ord-100', transactionId: 'txn-99', paymentMethod: 'UPI' });
    analytics.track('payment.fail', { orderId: 'ord-100', reason: 'Declined' });

    const log = analytics.getEventsLog();
    expect(log).toHaveLength(2);
    expect(log[0].event).toBe('payment.success');
    expect(log[1].event).toBe('payment.fail');
  });

  it('tracks menu.load.fail event', () => {
    analytics.track('menu.load.fail', { storeId: 'DOM001', reason: 'Network error 500' });

    const log = analytics.getEventsLog();
    expect(log).toHaveLength(1);
    expect(log[0].event).toBe('menu.load.fail');
  });

  it('bounds event log history size to 100 items', () => {
    for (let i = 0; i < 110; i++) {
      analytics.track('menu.load.fail', { reason: `Error ${i}` });
    }
    expect(analytics.getEventsLog()).toHaveLength(100);
  });
});
