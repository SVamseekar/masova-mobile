import httpClient from '../http/client';
import { Customer, CustomerPreferences } from '../../types';

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

export const customerApi = {
  getByUserId: async (userId: string): Promise<Customer> => {
    const response = await httpClient.get<Customer[]>(`/customers?userId=${encodeURIComponent(userId)}`);
    if (!response.data || !response.data.length) {
      throw new Error(`Customer profile not found for user ${userId}`);
    }
    return response.data[0];
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await httpClient.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  getOrCreate: async (userData: { userId: string; name: string; email: string; phone?: string }): Promise<Customer> => {
    try {
      return await customerApi.getByUserId(userData.userId);
    } catch {
      // Fallback: search by email
      const response = await httpClient.get<Customer[]>(`/customers?email=${encodeURIComponent(userData.email)}`);
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      throw new Error(`Customer record not found for user ${userData.userId}`);
    }
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
