import httpClient from '../http/client';
import { customerApi } from '../api/customerApi';

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

describe('customerApi Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByUserId', () => {
    it('returns customer profile when array is returned', async () => {
      const mockCustomer = { id: 'cust_123', userId: 'user_456', name: 'John' };
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [mockCustomer] });

      const result = await customerApi.getByUserId('user_456');

      expect(httpClient.get).toHaveBeenCalledWith('/customers?userId=user_456');
      expect(result).toEqual(mockCustomer);
    });

    it('throws error when no profile is returned', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [] });

      await expect(customerApi.getByUserId('user_missing')).rejects.toThrow(
        'Customer profile not found for user user_missing'
      );
    });
  });

  describe('getById', () => {
    it('fetches customer profile by ID', async () => {
      const mockCustomer = { id: 'cust_123', name: 'John' };
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockCustomer });

      const result = await customerApi.getById('cust_123');

      expect(httpClient.get).toHaveBeenCalledWith('/customers/cust_123');
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('getOrCreate', () => {
    it('delegates to getByUserId', async () => {
      const mockCustomer = { id: 'cust_123', userId: 'user_456' };
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [mockCustomer] });

      const result = await customerApi.getOrCreate({ userId: 'user_456', name: 'John', email: 'j@ex.com' });

      expect(httpClient.get).toHaveBeenCalledWith('/customers?userId=user_456');
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('updateProfile', () => {
    it('patches customer profile', async () => {
      const mockUpdated = { id: 'cust_123', name: 'John Updated' };
      (httpClient.patch as jest.Mock).mockResolvedValue({ data: mockUpdated });

      const result = await customerApi.updateProfile('cust_123', { name: 'John Updated' });

      expect(httpClient.patch).toHaveBeenCalledWith('/customers/cust_123', { name: 'John Updated' });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('updatePreferences', () => {
    it('patches preferences object', async () => {
      const prefs = {
        dietaryRestrictions: ['VEGETARIAN'],
        allergenAlerts: ['PEANUTS'],
        spiceLevel: 'MEDIUM' as const,
        notifyOnOffers: true,
        notifyOnOrderStatus: true,
      };
      (httpClient.patch as jest.Mock).mockResolvedValue({ data: { id: 'cust_123', preferences: prefs } });

      const result = await customerApi.updatePreferences('cust_123', prefs);

      expect(httpClient.patch).toHaveBeenCalledWith('/customers/cust_123', { preferences: prefs });
      expect(result.preferences).toEqual(prefs);
    });
  });

  describe('address operations', () => {
    it('addAddress posts formatted address payload', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({ data: { id: 'cust_123' } });

      await customerApi.addAddress('cust_123', {
        label: 'HOME',
        street: '123 Main St',
        city: 'Hyderabad',
        state: 'Telangana',
        zipCode: '500032',
        coordinates: { latitude: 17.4, longitude: 78.4 },
      });

      expect(httpClient.post).toHaveBeenCalledWith('/customers/cust_123/addresses', {
        label: 'HOME',
        addressLine1: '123 Main St',
        addressLine2: undefined,
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500032',
        country: 'India',
        latitude: 17.4,
        longitude: 78.4,
        landmark: undefined,
        isDefault: false,
      });
    });

    it('updateAddress patches specified address', async () => {
      (httpClient.patch as jest.Mock).mockResolvedValue({ data: { id: 'cust_123' } });

      await customerApi.updateAddress('cust_123', 'addr_1', { label: 'WORK' });

      expect(httpClient.patch).toHaveBeenCalledWith('/customers/cust_123/addresses/addr_1', { label: 'WORK' });
    });

    it('setDefaultAddress patches isDefault: true', async () => {
      (httpClient.patch as jest.Mock).mockResolvedValue({ data: { id: 'cust_123' } });

      await customerApi.setDefaultAddress('cust_123', 'addr_1');

      expect(httpClient.patch).toHaveBeenCalledWith('/customers/cust_123/addresses/addr_1', { isDefault: true });
    });

    it('deleteAddress and removeAddress delete specified address', async () => {
      (httpClient.delete as jest.Mock).mockResolvedValue({ data: { id: 'cust_123' } });

      await customerApi.deleteAddress('cust_123', 'addr_1');
      expect(httpClient.delete).toHaveBeenCalledWith('/customers/cust_123/addresses/addr_1');

      await customerApi.removeAddress('cust_123', 'addr_2');
      expect(httpClient.delete).toHaveBeenCalledWith('/customers/cust_123/addresses/addr_2');
    });
  });

  describe('addLoyaltyPoints', () => {
    it('posts loyalty points transaction', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({ data: { id: 'cust_123', loyaltyPoints: 100 } });

      const result = await customerApi.addLoyaltyPoints('cust_123', {
        points: 50,
        type: 'EARNED',
        description: 'Order reward',
      });

      expect(httpClient.post).toHaveBeenCalledWith('/customers/cust_123/loyalty', {
        points: 50,
        type: 'EARNED',
        description: 'Order reward',
      });
      expect((result as any).loyaltyPoints).toBe(100);
    });
  });
});
