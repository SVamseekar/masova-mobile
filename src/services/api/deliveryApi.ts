import httpClient from '../http/client';
import { DeliveryTracking } from '../../types';

export interface DeliveryOtpResponse {
  otp: string;
  expiresAt: string;
}

export interface DeliveryZoneCheck {
  inZone: boolean;
  isWithinDeliveryZone?: boolean;
  zoneName?: string;
  distanceKm?: number;
}

export const deliveryApi = {
  track: async (orderId: string): Promise<DeliveryTracking> => {
    const response = await httpClient.get<DeliveryTracking>(`/delivery/track/${orderId}`);
    return response.data;
  },

  generateOtp: async (orderId: string): Promise<DeliveryOtpResponse> => {
    const response = await httpClient.post<DeliveryOtpResponse>(`/delivery/${orderId}/otp`);
    return response.data;
  },

  verifyOtp: async (orderId: string, otp: string): Promise<{ success: boolean; message?: string }> => {
    const response = await httpClient.post<{ success: boolean; message?: string }>('/delivery/verify', {
      orderId,
      otp,
    });
    return response.data;
  },

  checkDeliveryZone: async (storeId: string, latitude: number, longitude: number): Promise<DeliveryZoneCheck> => {
    const response = await httpClient.get<any>(
      `/delivery/zones?storeId=${encodeURIComponent(storeId)}&lat=${latitude}&lng=${longitude}&check=true`
    );
    const raw = response.data || {};
    const inZoneValue = raw.inZone ?? raw.isWithinDeliveryZone ?? true;
    return {
      ...raw,
      inZone: Boolean(inZoneValue),
    };
  },
};

export default deliveryApi;
