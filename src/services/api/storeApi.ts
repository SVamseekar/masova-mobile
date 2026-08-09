import httpClient from '../http/client';
import { Store } from '../../types';

export interface LocationParams {
  lat?: number;
  lng?: number;
}

export const storeApi = {
  getStores: async (location?: LocationParams): Promise<Store[]> => {
    const params = new URLSearchParams();
    if (location?.lat !== undefined) params.append('lat', String(location.lat));
    if (location?.lng !== undefined) params.append('lng', String(location.lng));

    const queryString = params.toString();
    const url = queryString ? `/stores?${queryString}` : '/stores';
    const response = await httpClient.get<Store[]>(url);
    return response.data || [];
  },

  getAll: async (): Promise<Store[]> => {
    return storeApi.getStores();
  },

  getNearestStore: async (lat: number, lng: number): Promise<Store> => {
    const stores = await storeApi.getStores({ lat, lng });
    if (!stores.length) {
      throw new Error('No stores available near this location');
    }
    return stores[0];
  },

  getStoreById: async (idOrCode: string): Promise<Store> => {
    const response = await httpClient.get<Store>(`/stores/${idOrCode}`);
    return response.data;
  },
};

export default storeApi;
