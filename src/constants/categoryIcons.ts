/**
 * Category → icon mapping for menu chips.
 * Prefer dish photos when available; these are fallbacks only.
 */

import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Explicit maps for platform MenuCategory enums */
/**
 * Match category name → icon carefully.
 * Ionicons food set is limited; never reuse drink icons for food.
 */
export const CATEGORY_ICONS: Record<string, IconName> = {
  // South Indian
  DOSA: 'ellipse-outline', // crepe/plate shape — not cafe
  IDLY_VADA: 'radio-button-on-outline', // round dumplings
  SOUTH_INDIAN_MEALS: 'restaurant-outline',
  RICE_VARIETIES: 'leaf-outline',
  // North Indian
  BIRYANI: 'flame-outline',
  CURRY_GRAVY: 'color-fill-outline',
  CURRY: 'color-fill-outline',
  BREAD_ROTI: 'disc-outline',
  CHAPATI_ROTI: 'disc-outline',
  NAAN_KULCHA: 'disc-outline',
  TANDOOR: 'flame',
  NORTH_INDIAN_MEALS: 'restaurant-outline',
  DAL_DISHES: 'water-outline',
  // Indo-Chinese
  NOODLES: 'git-branch-outline',
  FRIED_RICE: 'leaf-outline',
  MANCHURIAN: 'flash-outline',
  MOMOS: 'ellipse',
  SOUP: 'beaker-outline',
  STARTERS: 'sparkles-outline',
  MAIN_COURSE: 'restaurant',
  DIMSUM: 'ellipse',
  // Italian / Continental
  PIZZA: 'pizza-outline',
  PASTA: 'infinite-outline',
  RISOTTO: 'nutrition-outline',
  SALAD: 'leaf-outline',
  // American
  BURGER: 'fast-food-outline',
  SANDWICH: 'file-tray-full-outline',
  FRIES_SIDES: 'grid-outline',
  HOT_DOGS: 'remove-outline',
  SIDES: 'grid-outline',
  GRILLED: 'flame-outline',
  BAKED: 'sunny-outline',
  SIZZLER: 'flame',
  SIZZLERS: 'flame',
  // Drinks ONLY
  HOT_BEVERAGES: 'cafe-outline',
  COLD_BEVERAGES: 'water-outline',
  HOT_DRINKS: 'cafe-outline',
  COLD_DRINKS: 'water-outline',
  TEA_CHAI: 'cafe',
  JUICES: 'wine-outline',
  SHAKES: 'pint-outline',
  BEVERAGE: 'cafe-outline',
  // Desserts
  ICE_CREAM: 'ice-cream-outline',
  CAKES: 'gift-outline',
  INDIAN_SWEETS: 'heart-circle-outline',
  PASTRIES: 'flower-outline',
  COOKIES_BROWNIES: 'square-outline',
  DESSERT_SPECIALS: 'ice-cream-outline',
  DESSERT: 'ice-cream-outline',
  APPETIZER: 'sparkles-outline',
  RICE: 'leaf-outline',
};

/** Keyword heuristics when category id is unknown */
const KEYWORD_ICONS: { match: RegExp; icon: IconName }[] = [
  { match: /dosa|crepe/i, icon: 'ellipse-outline' },
  { match: /idly|idli|vada/i, icon: 'radio-button-on-outline' },
  { match: /biryani/i, icon: 'flame-outline' },
  { match: /pizza/i, icon: 'pizza-outline' },
  { match: /burger/i, icon: 'fast-food-outline' },
  { match: /noodle|pasta/i, icon: 'git-branch-outline' },
  { match: /rice/i, icon: 'leaf-outline' },
  { match: /curry|gravy|dal/i, icon: 'color-fill-outline' },
  { match: /naan|roti|bread|chapati/i, icon: 'disc-outline' },
  { match: /drink|beverage|juice|shake|cola/i, icon: 'water-outline' },
  { match: /tea|chai|coffee|espresso|cappuccino/i, icon: 'cafe-outline' },
  { match: /ice.?cream|dessert|sweet|cake|brownie|pastry/i, icon: 'ice-cream-outline' },
  { match: /salad/i, icon: 'leaf-outline' },
  { match: /soup/i, icon: 'beaker-outline' },
  { match: /side|fries/i, icon: 'grid-outline' },
  { match: /momo|dimsum/i, icon: 'ellipse' },
  { match: /manchurian|sizzler|tandoor|grill/i, icon: 'flame-outline' },
];

export function iconForCategory(categoryId: string, categoryName?: string): IconName {
  const key = (categoryId || '').toUpperCase();
  if (CATEGORY_ICONS[key]) return CATEGORY_ICONS[key];
  const label = `${categoryId} ${categoryName || ''}`;
  for (const row of KEYWORD_ICONS) {
    if (row.match.test(label)) return row.icon;
  }
  return 'restaurant-outline';
}
