import httpClient from '../http/client';
import { Customer, CustomerPreferences } from '../../types';
import { normalizeLoyaltyInfo, normalizeOrderStats } from '../../utils/loyaltyProgram';

export interface AddAddressRequest {
  label: string;
  addressLine1?: string;
  street?: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  landmark?: string;
  instructions?: string;
  isDefault?: boolean;
}

function mapCustomer(raw: any): Customer {
  if (!raw) {
    throw new Error('Empty customer payload');
  }
  // Platform nests loyalty under loyaltyInfo; some DTOs flatten fields
  const loyaltySource =
    raw.loyaltyInfo ||
    raw.loyalty_info ||
    raw.loyalty ||
    (raw.totalPoints != null || raw.points != null
      ? {
          totalPoints: raw.totalPoints ?? raw.points,
          pointsEarned: raw.pointsEarned,
          pointsRedeemed: raw.pointsRedeemed,
          tier: raw.tier || raw.loyaltyTier,
          pointHistory: raw.pointHistory,
        }
      : null);

  const loyalty =
    normalizeLoyaltyInfo(loyaltySource) ||
    normalizeLoyaltyInfo({ totalPoints: 0, tier: 'BRONZE' });
  const orderStats =
    normalizeOrderStats(raw.orderStats || raw.order_stats) ||
    normalizeOrderStats({
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
    });

  return {
    ...raw,
    id: raw.id || raw._id || '',
    userId: raw.userId || raw.user_id || '',
    name: raw.name || '',
    email: raw.email || '',
    phone: raw.phone,
    profilePicture: raw.profilePicture || raw.profile_picture,
    addresses: Array.isArray(raw.addresses) ? raw.addresses : [],
    loyaltyInfo: loyalty,
    orderStats,
    isActive: raw.isActive ?? raw.active ?? true,
    preferences: raw.preferences,
  };
}

export const customerApi = {
  /**
   * Resolve customer by JWT user id (platform: GET /customers?userId=).
   * Optional email fallback when userId is missing on the customer row.
   */
  getByUserId: async (userId: string, email?: string): Promise<Customer> => {
    const response = await httpClient.get<any>(
      `/customers?userId=${encodeURIComponent(userId)}`
    );
    let list = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.content)
        ? response.data.content
        : response.data
          ? [response.data]
          : [];

    if (!list.length && email) {
      const byEmail = await httpClient.get<any>(
        `/customers?email=${encodeURIComponent(email)}`
      );
      list = Array.isArray(byEmail.data)
        ? byEmail.data
        : byEmail.data
          ? [byEmail.data]
          : [];
    }

    if (!list.length) {
      throw new Error(`Customer profile not found for user ${userId}`);
    }
    const match =
      list.find(
        (c: any) => (c.userId || c.user_id) === userId || c.id === userId
      ) || list[0];
    return mapCustomer(match);
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await httpClient.get<any>(`/customers/${id}`);
    return mapCustomer(response.data);
  },

  getOrCreate: async (userData: { userId: string; name: string; email: string; phone?: string }): Promise<Customer> => {
    return customerApi.getByUserId(userData.userId);
  },

  updateProfile: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const response = await httpClient.patch<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  updatePreferences: async (id: string, preferences: CustomerPreferences): Promise<Customer> => {
    const response = await httpClient.patch<Customer>(`/customers/${id}`, { preferences });
    return response.data;
  },

  addAddress: async (customerId: string, address: AddAddressRequest): Promise<Customer> => {
    const payload = {
      label: address.label || 'HOME',
      addressLine1: address.addressLine1 || address.street || '',
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state || 'Telangana',
      postalCode: address.postalCode || address.zipCode || '500001',
      country: address.country || 'India',
      latitude: address.latitude || address.coordinates?.latitude,
      longitude: address.longitude || address.coordinates?.longitude,
      landmark: address.landmark || address.instructions,
      isDefault: address.isDefault ?? false,
    };
    const response = await httpClient.post<Customer>(`/customers/${customerId}/addresses`, payload);
    return response.data;
  },

  updateAddress: async (customerId: string, addressId: string, address: Partial<AddAddressRequest>): Promise<Customer> => {
    const response = await httpClient.patch<Customer>(`/customers/${customerId}/addresses/${addressId}`, address);
    return response.data;
  },

  setDefaultAddress: async (customerId: string, addressId: string): Promise<Customer> => {
    const response = await httpClient.patch<Customer>(`/customers/${customerId}/addresses/${addressId}`, { isDefault: true });
    return response.data;
  },

  deleteAddress: async (customerId: string, addressId: string): Promise<Customer> => {
    const response = await httpClient.delete<Customer>(`/customers/${customerId}/addresses/${addressId}`);
    return response.data;
  },

  removeAddress: async (customerId: string, addressId: string): Promise<Customer> => {
    return customerApi.deleteAddress(customerId, addressId);
  },

  addLoyaltyPoints: async (
    customerId: string,
    data: { points: number; type: 'EARNED' | 'REDEEMED' | 'BONUS' | 'EXPIRED'; description: string; orderId?: string }
  ): Promise<Customer> => {
    const response = await httpClient.post<Customer>(`/customers/${customerId}/loyalty`, data);
    return response.data;
  },
};

export default customerApi;
