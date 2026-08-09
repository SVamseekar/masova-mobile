/**
 * Local favorites (saved dishes).
 * Persists menu item ids + snapshot for offline list display.
 * Optionally mirrors ids to customer preferences.favoriteMenuItems when logged in.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MenuItem } from '../types';
import { customerApi } from './api';

const FAVORITES_KEY = 'masova_favorite_items';

export type FavoriteSnapshot = {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  discountedPrice?: number;
  imageUrl?: string;
  rating?: number;
  dietaryInfo?: string[];
  category?: string;
  cuisine?: string;
};

async function readAll(): Promise<FavoriteSnapshot[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: FavoriteSnapshot[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}

function toSnapshot(item: MenuItem): FavoriteSnapshot {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    basePrice: item.basePrice,
    discountedPrice: item.discountedPrice,
    imageUrl: item.imageUrl,
    rating: item.rating,
    dietaryInfo: item.dietaryInfo as string[] | undefined,
    category: item.category,
    cuisine: item.cuisine,
  };
}

export const favoritesService = {
  getAll: readAll,

  isFavorite: async (itemId: string): Promise<boolean> => {
    const all = await readAll();
    return all.some((i) => i.id === itemId);
  },

  toggle: async (item: MenuItem): Promise<boolean> => {
    const all = await readAll();
    const exists = all.some((i) => i.id === item.id);
    const next = exists
      ? all.filter((i) => i.id !== item.id)
      : [...all, toSnapshot(item)];
    await writeAll(next);
    return !exists;
  },

  remove: async (itemId: string): Promise<void> => {
    const all = await readAll();
    await writeAll(all.filter((i) => i.id !== itemId));
  },

  /** Best-effort sync ids to backend customer preferences */
  syncToCustomer: async (userId: string): Promise<void> => {
    try {
      const all = await readAll();
      const customer = await customerApi.getByUserId(userId);
      await customerApi.updatePreferences(customer.id, {
        ...(customer.preferences || {}),
        favoriteMenuItems: all.map((i) => i.id),
      } as any);
    } catch {
      // local favorites still work offline
    }
  },
};

export default favoritesService;
