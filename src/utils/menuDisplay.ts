/**
 * Display helpers for menu — prices + labels + image resolution.
 * Platform seeded menus: EUR minor units, image URLs on imageUrl / images[].
 */

import { MenuItem } from '../types';
import { formatPrice, DEFAULT_CURRENCY, DEFAULT_LOCALE } from './money';

export { toMajorUnits as toMajorPrice } from './money';

export function formatMenuPrice(
  price: number | undefined | null,
  currency?: string,
  locale?: string
): string {
  return formatPrice(price, currency || DEFAULT_CURRENCY, locale || DEFAULT_LOCALE);
}

export function formatCategoryLabel(category: string): string {
  if (!category) return '';
  return category
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatCuisineLabel(cuisine: string): string {
  return formatCategoryLabel(cuisine);
}

/** Resolve best image URL from heterogeneous platform payloads */
export function resolveMenuImageUrl(item: Partial<MenuItem> | Record<string, unknown> | null | undefined): string | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const any = item as Record<string, unknown>;
  const candidates: unknown[] = [
    any.imageUrl,
    any.image,
    any.photoUrl,
    any.thumbnailUrl,
    any.primaryImageUrl,
  ];
  if (Array.isArray(any.images) && any.images.length > 0) {
    const first = any.images[0];
    if (typeof first === 'string') candidates.push(first);
    else if (first && typeof first === 'object') {
      const o = first as Record<string, unknown>;
      candidates.push(o.url, o.imageUrl, o.src);
    }
  }
  if (Array.isArray(any.imageUrls)) {
    candidates.push(...(any.imageUrls as unknown[]));
  }
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) {
      const url = c.trim();
      // Relative platform paths → leave as-is for http client base if absolute needed later
      return url;
    }
  }
  return undefined;
}

export type MenuCategoryChip = {
  id: string;
  name: string;
  count: number;
  /** Representative dish for photo chip (matches category dishes) */
  sampleName?: string;
  sampleImageUrl?: string;
};

/** Category chips: real categories present on this store's menu */
export function categoriesFromMenu(items: MenuItem[]): MenuCategoryChip[] {
  const byCat = new Map<string, MenuItem[]>();
  for (const item of items) {
    if (!item.category) continue;
    const list = byCat.get(item.category) || [];
    list.push(item);
    byCat.set(item.category, list);
  }
  return Array.from(byCat.entries())
    .map(([id, list]) => {
      // Prefer recommended + available with an image for the chip photo
      const sample =
        list.find((i) => i.isRecommended && i.isAvailable !== false) ||
        list.find((i) => i.isAvailable !== false) ||
        list[0];
      return {
        id,
        name: formatCategoryLabel(id),
        count: list.length,
        sampleName: sample?.name,
        sampleImageUrl: sample?.imageUrl,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function recommendedFromMenu(items: MenuItem[], limit = 12): MenuItem[] {
  const rec = items.filter((i) => i.isRecommended && i.isAvailable !== false);
  const pool = rec.length > 0 ? rec : items.filter((i) => i.isAvailable !== false);
  return pool.slice(0, limit);
}
