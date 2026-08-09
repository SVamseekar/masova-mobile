import httpClient from '../http/client';
import { MenuItem, Category, Cuisine, DietaryType } from '../../types';

export interface MenuQueryParams {
  storeId?: string;
  category?: Category | string;
  cuisine?: Cuisine | string;
  dietary?: DietaryType | string;
  search?: string;
  recommended?: boolean;
  tag?: string;
}

const mapMenuItem = (item: any): MenuItem => ({
  ...item,
  id: item.id || item._id || '',
  basePrice: item.basePrice ?? item.price ?? 0,
});

export const menuApi = {
  getMenu: async (params?: MenuQueryParams): Promise<MenuItem[]> => {
    const query = new URLSearchParams();
    if (params?.storeId) query.append('storeId', params.storeId);
    if (params?.category) query.append('category', params.category);
    if (params?.cuisine) query.append('cuisine', params.cuisine);
    if (params?.dietary) query.append('dietary', params.dietary);
    if (params?.search) query.append('search', params.search);
    if (params?.recommended !== undefined) query.append('recommended', String(params.recommended));
    if (params?.tag) query.append('tag', params.tag);

    const queryString = query.toString();
    const url = queryString ? `/menu?${queryString}` : '/menu';
    const response = await httpClient.get<any[]>(url);
    return (response.data || []).map(mapMenuItem);
  },

  getMenuItem: async (id: string): Promise<MenuItem> => {
    const response = await httpClient.get<any>(`/menu/${id}`);
    return mapMenuItem(response.data);
  },

  getRecommended: async (storeId?: string): Promise<MenuItem[]> => {
    return menuApi.getMenu({ storeId, recommended: true });
  },

  searchMenu: async (search: string, storeId?: string): Promise<MenuItem[]> => {
    return menuApi.getMenu({ storeId, search });
  },
};

export default menuApi;
