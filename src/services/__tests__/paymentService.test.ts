import PaymentService, {
  initiatePayment,
  openRazorpayCheckout,
  verifyPayment,
  processPayment,
} from '../paymentService';
import { paymentApi } from '../api';

jest.mock('../api', () => ({
  paymentApi: {
    initiate: jest.fn(),
    verify: jest.fn(),
    getStatus: jest.fn(),
  },
}));

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('calls paymentApi.initiate with payment data', async () => {
      const mockInitRes = { amount: 500, razorpayOrderId: 'order_rzp_1', razorpayKeyId: 'rzp_test_123', currency: 'INR' };
      (paymentApi.initiate as jest.Mock).mockResolvedValue(mockInitRes);

      const params = {
        orderId: 'ord_1',
        amount: 500,
        customerId: 'cust_1',
        customerEmail: 'c@ex.com',
        customerPhone: '9876543210',
        storeId: 'DOM001',
      };

      const res = await initiatePayment(params);
      expect(paymentApi.initiate).toHaveBeenCalledWith(params);
      expect(res).toEqual(mockInitRes);
    });

    it('logs and throws error if initiate fails', async () => {
      (paymentApi.initiate as jest.Mock).mockRejectedValue(new Error('Network error'));

      const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        initiatePayment({
          orderId: 'ord_1',
          amount: 500,
          customerId: 'cust_1',
          customerEmail: 'c@ex.com',
          customerPhone: '9876543210',
          storeId: 'DOM001',
        })
      ).rejects.toThrow('Network error');

      spyConsole.mockRestore();
    });
  });

  describe('openRazorpayCheckout', () => {
    it('throws native SDK unavailable error when react-native-razorpay is not installed', async () => {
      const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockOptions = {
        key: 'rzp_key',
        amount: 50000,
        currency: 'INR',
        name: 'MaSoVa',
        description: 'Order #ord_1',
        order_id: 'order_rzp_1',
        prefill: { name: 'User', email: 'u@ex.com', contact: '9999999999' },
        theme: { color: '#E53E3E' },
      };

      await expect(openRazorpayCheckout(mockOptions)).rejects.toThrow(
        'Native payment SDK (react-native-razorpay) is not available in this environment'
      );

      spyConsole.mockRestore();
    });
  });

  describe('verifyPayment', () => {
    it('returns true when payment status is SUCCESS, PAID, or INITIATED', async () => {
      (paymentApi.verify as jest.Mock).mockResolvedValue({ status: 'SUCCESS' });
      const r1 = await verifyPayment({ orderId: 'o1', razorpayPaymentId: 'p1', razorpayOrderId: 'r1', razorpaySignature: 's1' });
      expect(r1).toBe(true);

      (paymentApi.verify as jest.Mock).mockResolvedValue({ status: 'PAID' });
      const r2 = await verifyPayment({ orderId: 'o1', razorpayPaymentId: 'p1', razorpayOrderId: 'r1', razorpaySignature: 's1' });
      expect(r2).toBe(true);
    });

    it('returns false when status is FAILED', async () => {
      (paymentApi.verify as jest.Mock).mockResolvedValue({ status: 'FAILED' });
      const r = await verifyPayment({ orderId: 'o1', razorpayPaymentId: 'p1', razorpayOrderId: 'r1', razorpaySignature: 's1' });
      expect(r).toBe(false);
    });

    it('logs and throws error if verify fails', async () => {
      (paymentApi.verify as jest.Mock).mockRejectedValue(new Error('Server error'));

      const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        verifyPayment({ orderId: 'o1', razorpayPaymentId: 'p1', razorpayOrderId: 'r1', razorpaySignature: 's1' })
      ).rejects.toThrow('Server error');

      spyConsole.mockRestore();
    });
  });

  describe('processPayment', () => {
    it('handles payment process when native checkout throws', async () => {
      const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => {});

      (paymentApi.initiate as jest.Mock).mockResolvedValue({
        razorpayKeyId: 'key_123',
        amount: 50000,
        currency: 'INR',
        razorpayOrderId: 'rzp_ord_123',
      });

      await expect(
        processPayment({
          orderId: 'ord_99',
          amount: 500,
          customerId: 'cust_99',
          customerName: 'Anna',
          customerEmail: 'anna@example.com',
          customerPhone: '9876543210',
          storeId: 'DOM001',
        })
      ).rejects.toThrow('Native payment SDK (react-native-razorpay) is not available in this environment');

      spyConsole.mockRestore();
    });
  });

  describe('PaymentService Export', () => {
    it('exports all methods', () => {
      expect(PaymentService.initiate).toBeDefined();
      expect(PaymentService.openCheckout).toBeDefined();
      expect(PaymentService.verify).toBeDefined();
      expect(PaymentService.process).toBeDefined();
    });
  });
});
