/**
 * Platform campaigns (marketing) — GET /api/campaigns
 * Manager-only on some deployments; customer calls fail soft → empty list.
 */

import httpClient from '../http/client';

export interface Campaign {
  id: string;
  storeId?: string;
  name: string;
  description?: string;
  subject?: string;
  message?: string;
  status?: string;
  channel?: string;
  scheduledFor?: string;
  sentAt?: string;
}

function normalizeList(data: unknown): Campaign[] {
  if (Array.isArray(data)) return data as Campaign[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.content)) return o.content as Campaign[];
    if (Array.isArray(o.data)) return o.data as Campaign[];
  }
  return [];
}

export const campaignApi = {
  /**
   * List campaigns for a store. Soft-fails to [] on 401/403/network.
   */
  listForStore: async (storeId?: string): Promise<Campaign[]> => {
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      params.append('size', '20');
      const qs = params.toString();
      const response = await httpClient.get<any>(`/campaigns${qs ? `?${qs}` : ''}`);
      return normalizeList(response.data);
    } catch {
      return [];
    }
  },
};

export default campaignApi;
