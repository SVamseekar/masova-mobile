import httpClient from '../http/client';
import { orderApi } from '../api/orderApi';
import { CreateOrderRequest } from '../../types';

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

describe('orderApi Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates order with formatted item payloads', async () => {
      const mockOrder = { id: 'ord_100', status: 'PENDING' };
      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockOrder });

      const request: CreateOrderRequest = {
        storeId: 'DOM001',
        orderType: 'DELIVERY',
        paymentMethod: 'CASH',
        items: [
          { menuItemId: 'item_1', name: 'Paneer Masala', quantity: 2, price: 250 },
        ],
      };

      const result = await orderApi.create(request);

      expect(httpClient.post).toHaveBeenCalledWith('/orders', {
        storeId: 'DOM001',
        orderType: 'DELIVERY',
        paymentMethod: 'CASH',
        customerName: 'Customer',
        items: [
          {
            menuItemId: 'item_1',
            name: 'Paneer Masala',
            quantity: 2,
            price: 250,
            variant: undefined,
            customizations: undefined,
            specialInstructions: undefined,
          },
        ],
      });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('getById', () => {
    it('fetches order details by orderId', async () => {
      const mockOrder = { id: 'ord_100', status: 'CONFIRMED' };
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockOrder });

      const result = await orderApi.getById('ord_100');

      expect(httpClient.get).toHaveBeenCalledWith('/orders/ord_100');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('track', () => {
    it('calls tracking endpoint for order', async () => {
      const mockOrder = { id: 'ord_100', status: 'OUT_FOR_DELIVERY' };
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockOrder });

      const result = await orderApi.track('ord_100');

      expect(httpClient.get).toHaveBeenCalledWith('/orders/track/ord_100');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('getCustomerOrders', () => {
    it('fetches customer orders with pagination and status options', async () => {
      const mockOrders = [{ id: 'ord_1' }, { id: 'ord_2' }];
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockOrders });

      const result = await orderApi.getCustomerOrders('cust_99', {
        status: 'DELIVERED',
        page: 0,
        size: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith('/orders?customerId=cust_99&status=DELIVERED&page=0&size=10');
      expect(result).toEqual(mockOrders);
    });

    it('extracts content array when paginated response object is returned', async () => {
      const mockOrders = [{ id: 'ord_1' }];
      (httpClient.get as jest.Mock).mockResolvedValue({ data: { content: mockOrders } });

      const result = await orderApi.getCustomerOrders('cust_99');

      expect(httpClient.get).toHaveBeenCalledWith('/orders?customerId=cust_99');
      expect(result).toEqual(mockOrders);
    });

    it('returns empty array if response data is missing', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: null });

      const result = await orderApi.getCustomerOrders('cust_99');
      expect(result).toEqual([]);
    });
  });

  describe('cancel', () => {
    it('cancels order with optional reason parameter', async () => {
      const mockCancelled = { id: 'ord_100', status: 'CANCELLED' };
      (httpClient.delete as jest.Mock).mockResolvedValue({ data: mockCancelled });

      const result = await orderApi.cancel('ord_100', 'Changed mind');

      expect(httpClient.delete).toHaveBeenCalledWith('/orders/ord_100?reason=Changed%20mind');
      expect(result).toEqual(mockCancelled);
    });

    it('cancels order without reason query param when omitted', async () => {
      (httpClient.delete as jest.Mock).mockResolvedValue({ data: { id: 'ord_100' } });

      await orderApi.cancel('ord_100');
      expect(httpClient.delete).toHaveBeenCalledWith('/orders/ord_100');
    });
  });
});
