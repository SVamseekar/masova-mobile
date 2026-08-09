import httpClient from '../http/client';
import { MenuItem, Category, Cuisine, DietaryType } from '../../types';
import { resolveMenuImageUrl } from '../../utils/menuDisplay';
import { CONFIG } from '../../config';

export interface MenuQueryParams {
  storeId?: string;
  category?: Category | string;
  cuisine?: Cuisine | string;
  dietary?: DietaryType | string;
  search?: string;
  recommended?: boolean;
  tag?: string;
}

/**
 * Seed stores imageUrl as `/images/menu/{slug}.jpg` (frontend public assets).
 * Those files are also bundled in the mobile app via menuImages.ts — remote
 * absolutization is best-effort for any real CDN URLs.
 */
function absolutizeMediaUrl(url: string | undefined): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  // Keep relative seed paths as-is; MenuDishImage resolves them locally by slug
  if (url.startsWith('/images/menu/')) return url;
  const base = (CONFIG.API_BASE_URL || '').replace(/\/$/, '');
  const origin = base.replace(/\/api$/, '');
  if (url.startsWith('/')) return `${origin}${url}`;
  return `${base}/${url}`;
}

const mapMenuItem = (item: any): MenuItem => {
  const rawImage = resolveMenuImageUrl(item);
  return {
    ...item,
    id: item.id || item._id || '',
    basePrice: item.basePrice ?? item.price ?? 0,
    discountedPrice: item.discountedPrice ?? item.salePrice,
    imageUrl: absolutizeMediaUrl(rawImage || item.imageUrl || ''),
    isRecommended: item.isRecommended ?? item.recommended ?? false,
    isAvailable: item.isAvailable !== false && item.available !== false,
  };
};

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
