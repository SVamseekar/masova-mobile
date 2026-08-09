import httpClient from '../http/client';
import { menuApi, customerApi, orderApi, paymentApi, deliveryApi, reviewApi } from '../api';

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
  setClientUserContext: jest.fn(),
  setClientSelectedStoreContext: jest.fn(),
  getClientUserContext: jest.fn(),
  getClientSelectedStoreContext: jest.fn(),
}));

describe('Domain API Contract Modules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('menuApi', () => {
    it('calls canonical GET /menu with storeId, category, and cuisine query parameters', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [] });

      await menuApi.getMenu({ storeId: 'DOM001', category: 'DOSA', cuisine: 'SOUTH_INDIAN' });

      expect(httpClient.get).toHaveBeenCalledWith('/menu?storeId=DOM001&category=DOSA&cuisine=SOUTH_INDIAN');
    });

    it('calls canonical GET /menu/{id} for item detail', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: { id: 'item_1', name: 'Masala Dosa', basePrice: 15000 } });

      const item = await menuApi.getMenuItem('item_1');

      expect(httpClient.get).toHaveBeenCalledWith('/menu/item_1');
      expect(item.basePrice).toBe(15000);
    });
  });

  describe('customerApi', () => {
    it('resolves customer by userId via GET /customers?userId=', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({
        data: [{ id: 'cust_999', userId: 'user_123', name: 'John Doe', email: 'john@example.com' }],
      });

      const customer = await customerApi.getByUserId('user_123');

      expect(httpClient.get).toHaveBeenCalledWith('/customers?userId=user_123');
      expect(customer.id).toBe('cust_999');
    });

    it('calls PATCH /customers/{id}/addresses/{addressId} for setting default address', async () => {
      (httpClient.patch as jest.Mock).mockResolvedValue({ data: { id: 'cust_999' } });

      await customerApi.setDefaultAddress('cust_999', 'addr_1');

      expect(httpClient.patch).toHaveBeenCalledWith('/customers/cust_999/addresses/addr_1', { isDefault: true });
    });
  });

  describe('orderApi', () => {
    it('posts to canonical /orders with items containing menuItemId, name, quantity, and price', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({ data: { id: 'ord_1', status: 'PENDING' } });

      await orderApi.create({
        storeId: 'DOM001',
        orderType: 'DELIVERY',
        paymentMethod: 'CASH',
        items: [
          { menuItemId: 'item_1', name: 'Paneer Butter Masala', quantity: 2, price: 250 },
        ],
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/orders',
        expect.objectContaining({
          storeId: 'DOM001',
          orderType: 'DELIVERY',
          paymentMethod: 'CASH',
          items: [
            expect.objectContaining({
              menuItemId: 'item_1',
              name: 'Paneer Butter Masala',
              quantity: 2,
              price: 250,
            }),
          ],
        })
      );
    });

    it('fetches customer orders via GET /orders?customerId=', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [] });

      await orderApi.getCustomerOrders('cust_999');

      expect(httpClient.get).toHaveBeenCalledWith('/orders?customerId=cust_999');
    });
  });

  describe('paymentApi', () => {
    it('formats amount to string with 2 decimals on /payments/initiate', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({ data: { amount: '250.00', razorpayOrderId: 'rzp_123' } });

      await paymentApi.initiate({
        orderId: 'ord_1',
        amount: 250,
        customerId: 'cust_999',
        customerEmail: 'customer@example.com',
        customerPhone: '9876543210',
      });

      expect(httpClient.post).toHaveBeenCalledWith('/payments/initiate', expect.objectContaining({ amount: '250.00' }));
    });
  });

  describe('deliveryApi', () => {
    it('calls canonical /delivery/{orderId}/otp and /delivery/verify', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({ data: { otp: '123456' } });

      await deliveryApi.generateOtp('ord_1');
      expect(httpClient.post).toHaveBeenCalledWith('/delivery/ord_1/otp');

      await deliveryApi.verifyOtp('ord_1', '123456');
      expect(httpClient.post).toHaveBeenCalledWith('/delivery/verify', { orderId: 'ord_1', otp: '123456' });
    });
  });

  describe('reviewApi', () => {
    it('submits review with overallRating header and body', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({ data: { id: 'rev_1', overallRating: 5 } });

      await reviewApi.create({
        orderId: 'ord_1',
        overallRating: 5,
        comment: 'Excellent food!',
      });

      expect(httpClient.post).toHaveBeenCalledWith('/reviews', expect.objectContaining({ overallRating: 5 }));
    });
  });

  describe('Phase B Product Parity Contracts', () => {
    it('calls PATCH /customers/{id} with preferences payload on updatePreferences', async () => {
      (httpClient.patch as jest.Mock).mockResolvedValue({ data: { id: 'cust_999' } });

      const prefs = {
        dietaryRestrictions: ['VEGETARIAN'],
        allergenAlerts: ['PEANUTS'],
        spiceLevel: 'MEDIUM',
        notifyOnOffers: true,
        notifyOnOrderStatus: true,
      };

      await customerApi.updatePreferences('cust_999', prefs);

      expect(httpClient.patch).toHaveBeenCalledWith('/customers/cust_999', { preferences: prefs });
    });

    it('calls GET /delivery/zones and maps isWithinDeliveryZone to inZone correctly', async () => {
      (httpClient.get as jest.Mock).mockResolvedValueOnce({ data: { isWithinDeliveryZone: false } });

      const checkOutside = await deliveryApi.checkDeliveryZone('DOM001', 17.385, 78.4867);
      expect(httpClient.get).toHaveBeenCalledWith('/delivery/zones?storeId=DOM001&lat=17.385&lng=78.4867&check=true');
      expect(checkOutside.inZone).toBe(false);

      (httpClient.get as jest.Mock).mockResolvedValueOnce({ data: { isWithinDeliveryZone: true, distanceKm: 2.5 } });
      const checkInside = await deliveryApi.checkDeliveryZone('DOM001', 17.385, 78.4867);
      expect(checkInside.inZone).toBe(true);
    });
  });
});
