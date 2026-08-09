import httpClient from '../http/client';
import { Order, CreateOrderRequest } from '../../types';

export interface GetCustomerOrdersOptions {
  page?: number;
  size?: number;
  status?: string;
}

export const orderApi = {
  create: async (data: CreateOrderRequest): Promise<Order> => {
    // Map items to backend expectations (must include name & price per item)
    const formattedItems = data.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name || 'Menu Item',
      quantity: item.quantity,
      price: item.price || 0,
      variant: item.variant,
      customizations: item.customizations,
      specialInstructions: item.specialInstructions,
    }));

    const payload = {
      ...data,
      customerName: data.customerName || 'Customer',
      items: formattedItems,
    };

    const response = await httpClient.post<Order>('/orders', payload);
    return response.data;
  },

  getById: async (orderId: string): Promise<Order> => {
    const response = await httpClient.get<Order>(`/orders/${orderId}`);
    return response.data;
  },

  track: async (orderId: string): Promise<Order> => {
    const response = await httpClient.get<Order>(`/orders/track/${orderId}`);
    return response.data;
  },

  getCustomerOrders: async (customerId: string, options?: GetCustomerOrdersOptions): Promise<Order[]> => {
    const params = new URLSearchParams();
    params.append('customerId', customerId);
    if (options?.status) params.append('status', options.status);
    if (options?.page !== undefined) params.append('page', String(options.page));
    if (options?.size !== undefined) params.append('size', String(options.size));

    const response = await httpClient.get<Order[] | { content: Order[] }>(`/orders?${params.toString()}`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.content || [];
  },

  cancel: async (orderId: string, reason?: string): Promise<Order> => {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    const response = await httpClient.delete<Order>(`/orders/${orderId}${params}`);
    return response.data;
  },
};

export default orderApi;
