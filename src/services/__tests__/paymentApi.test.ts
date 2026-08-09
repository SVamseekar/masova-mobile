import httpClient from '../http/client';
import { paymentApi } from '../api/paymentApi';

jest.mock('../http/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('paymentApi Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiate', () => {
    it('formats amount to string with 2 decimals on /payments/initiate', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({
        data: { amount: 250, razorpayOrderId: 'rzp_123' },
      });

      await paymentApi.initiate({
        orderId: 'ord_1',
        amount: 250,
        customerId: 'cust_999',
        customerEmail: 'customer@example.com',
        customerPhone: '9876543210',
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/payments/initiate',
        expect.objectContaining({ amount: '250.00' })
      );
    });
  });

  describe('verify', () => {
    it('posts payment verification payload to /payments/verify', async () => {
      const mockRes = { transactionId: 'tx_1', status: 'SUCCESS' };
      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockRes });

      const res = await paymentApi.verify({
        orderId: 'ord_1',
        razorpayOrderId: 'rzp_1',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: 'sig_1',
      });

      expect(httpClient.post).toHaveBeenCalledWith('/payments/verify', {
        orderId: 'ord_1',
        razorpayOrderId: 'rzp_1',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: 'sig_1',
      });
      expect(res).toEqual(mockRes);
    });
  });

  describe('getByOrderId', () => {
    it('fetches payment transaction by orderId', async () => {
      const mockRes = { transactionId: 'tx_1', amount: 250, status: 'PAID' };
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockRes });

      const res = await paymentApi.getByOrderId('ord_1');

      expect(httpClient.get).toHaveBeenCalledWith('/payments?orderId=ord_1');
      expect(res).toEqual(mockRes);
    });
  });
});
