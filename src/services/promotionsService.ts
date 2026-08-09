/**
 * Customer promotions — real multi-item / basket deals from platform data.
 *
 * Never promotes a single SKU. Built from:
 *  1. Store marketing campaigns (GET /campaigns)
 *  2. Category-level deals (discounted or recommended clusters)
 *  3. Cuisine “feast” cards (top cuisines by item count)
 *  4. Free-delivery basket threshold
 */

import { MenuItem, Store } from '../types';
import { campaignApi, Campaign } from './api/campaignApi';
import { FREE_DELIVERY_THRESHOLD_MINOR } from '../utils/pricing';
import { formatPrice } from '../utils/money';
import { formatCategoryLabel, formatCuisineLabel } from '../utils/menuDisplay';

export type PromotionSource =
  | 'campaign'
  | 'category_deal'
  | 'cuisine_feast'
  | 'store_policy';

export interface CustomerPromotion {
  id: string;
  /** Big headline e.g. "20% OFF" or "Free delivery" */
  headline: string;
  title: string;
  subtitle: string;
  badge?: string;
  source: PromotionSource;
  /** Browse into this category/cuisine — never a single item */
  category?: string;
  cuisine?: string;
  /** Up to 3 dish names for stacked thumbs (visual only) */
  dishNames: string[];
  dishImageUrls: string[];
  /** Brand gold accent for badge/CTA; card visuals are photo-led in UI */
  accent: string;
  /** Kept for API compatibility; UI prefers dish photos over these washes */
  gradient: [string, string, string];
  ctaLabel: string;
}

/** Clean brand-aligned accents only — no rainbow muddy fills */
const ACCENTS = ['#FFD000', '#FFD000', '#F5C518', '#E8B923', '#FFD000', '#FFC107', '#FFD000'];

/** Neutral charcoal fallbacks if a card ever needs solid fills */
const NEUTRAL_GRADIENT: [string, string, string] = ['#141414', '#1C1C1C', '#121212'];

function themeAt(i: number) {
  return {
    accent: ACCENTS[i % ACCENTS.length],
    gradient: NEUTRAL_GRADIENT,
  };
}

function available(items: MenuItem[]) {
  return items.filter((i) => i.isAvailable !== false);
}

function discountPct(item: MenuItem): number | null {
  const base = item.basePrice;
  const disc = item.discountedPrice;
  if (base == null || disc == null || base <= 0 || disc >= base) return null;
  return Math.round((1 - disc / base) * 100);
}

function groupByCategory(items: MenuItem[]): Map<string, MenuItem[]> {
  const map = new Map<string, MenuItem[]>();
  for (const item of items) {
    if (!item.category) continue;
    const list = map.get(item.category) || [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}

function groupByCuisine(items: MenuItem[]): Map<string, MenuItem[]> {
  const map = new Map<string, MenuItem[]>();
  for (const item of items) {
    if (!item.cuisine) continue;
    const list = map.get(item.cuisine) || [];
    list.push(item);
    map.set(item.cuisine, list);
  }
  return map;
}

function thumbs(items: MenuItem[], n = 3): { names: string[]; urls: string[] } {
  const slice = items.slice(0, n);
  return {
    names: slice.map((i) => i.name).filter(Boolean),
    urls: slice.map((i) => i.imageUrl || '').filter(Boolean),
  };
}

function campaignToPromo(c: Campaign, index: number, menu: MenuItem[]): CustomerPromotion {
  const raw = (c.subject || c.name || 'Store offer').replace(/^SEED-/i, '').trim();
  const desc = c.description || c.message || '';
  const theme = themeAt(index);
  // Pull sample dishes from menu for visual richness
  const sample = thumbs(
    available(menu)
      .filter((i) => i.isRecommended)
      .concat(available(menu)),
    3
  );

  // Heuristic badge from campaign text
  let headline = 'DEAL';
  let badge = 'Campaign';
  const lower = `${raw} ${desc}`.toLowerCase();
  if (/\d+\s*%/.test(lower)) {
    const m = lower.match(/(\d+)\s*%/);
    headline = m ? `${m[1]}% OFF` : 'OFFER';
  } else if (/free delivery|delivery free/.test(lower)) {
    headline = 'FREE DELIVERY';
  } else if (/weekend|pizza/.test(lower)) {
    headline = 'WEEKEND';
  } else if (/loyalty|points|tier/.test(lower)) {
    headline = 'REWARDS';
    badge = 'Loyalty';
  } else if (c.status === 'SCHEDULED') {
    headline = 'SOON';
    badge = 'Coming up';
  }

  return {
    id: `campaign-${c.id}`,
    headline,
    title: raw,
    subtitle: desc || 'Branch-wide offer — apply at checkout',
    badge,
    source: 'campaign',
    dishNames: sample.names,
    dishImageUrls: sample.urls,
    accent: theme.accent,
    gradient: theme.gradient,
    ctaLabel: 'See menu',
  };
}

function categoryDeal(
  category: string,
  items: MenuItem[],
  currency: string | undefined,
  locale: string | undefined,
  index: number
): CustomerPromotion | null {
  if (items.length < 2) return null; // never single-item
  const theme = themeAt(index + 1);
  const label = formatCategoryLabel(category);
  const discounted = items.map(discountPct).filter((p): p is number => p != null);
  const recCount = items.filter((i) => i.isRecommended).length;
  const t = thumbs(items, 3);

  let headline = `${items.length}+ DISHES`;
  let badge = 'Category';
  let subtitle = `Explore ${items.length} ${label.toLowerCase()} picks at this branch`;

  if (discounted.length >= 2) {
    const avg = Math.round(discounted.reduce((a, b) => a + b, 0) / discounted.length);
    const max = Math.max(...discounted);
    headline = `UP TO ${max}% OFF`;
    badge = 'Sale';
    subtitle = `${discounted.length} ${label.toLowerCase()} dishes on deal · save ~${avg}%`;
  } else if (recCount >= 2) {
    headline = 'BESTSELLERS';
    badge = 'Popular';
    subtitle = `${recCount} guest favourites in ${label}`;
  } else {
    // Price band for the category
    const prices = items.map((i) => i.discountedPrice ?? i.basePrice).filter((p) => p > 0);
    if (prices.length >= 2) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      subtitle = `From ${formatPrice(min, currency, locale)} · ${items.length} options`;
      headline = label.toUpperCase().slice(0, 12);
    }
  }

  return {
    id: `cat-${category}`,
    headline,
    title: `${label} feast`,
    subtitle,
    badge,
    source: 'category_deal',
    category,
    dishNames: t.names,
    dishImageUrls: t.urls,
    accent: theme.accent,
    gradient: theme.gradient,
    ctaLabel: `Browse ${label}`,
  };
}

function cuisineFeast(
  cuisine: string,
  items: MenuItem[],
  index: number
): CustomerPromotion | null {
  if (items.length < 3) return null;
  const theme = themeAt(index + 3);
  const label = formatCuisineLabel(cuisine);
  const t = thumbs(
    [...items].sort((a, b) => Number(!!b.isRecommended) - Number(!!a.isRecommended)),
    3
  );
  return {
    id: `cuisine-${cuisine}`,
    headline: 'FULL SPREAD',
    title: `${label} menu`,
    subtitle: `${items.length} dishes · mix & match your plate`,
    badge: 'Cuisine',
    source: 'cuisine_feast',
    cuisine,
    dishNames: t.names,
    dishImageUrls: t.urls,
    accent: theme.accent,
    gradient: theme.gradient,
    ctaLabel: `Open ${label}`,
  };
}

export async function buildStorePromotions(opts: {
  store: Store | null;
  storeId: string | null;
  menuItems: MenuItem[];
}): Promise<CustomerPromotion[]> {
  const { store, storeId, menuItems } = opts;
  const currency = store?.currency;
  const locale = store?.locale;
  const menu = available(menuItems);
  const promos: CustomerPromotion[] = [];
  const seen = new Set<string>();

  const push = (p: CustomerPromotion | null) => {
    if (!p || seen.has(p.id)) return;
    seen.add(p.id);
    promos.push(p);
  };

  // 1) Platform campaigns → store-wide offers
  const campaigns = await campaignApi.listForStore(storeId || store?.storeCode || undefined);
  const activeCampaigns = campaigns.filter((c) => {
    const s = (c.status || '').toUpperCase();
    return ['SCHEDULED', 'SENT', 'SENDING', 'ACTIVE', 'DRAFT', ''].includes(s);
  });
  activeCampaigns.slice(0, 3).forEach((c, i) => push(campaignToPromo(c, i, menu)));

  // 2) Category clusters (prefer those with discounts or 3+ items)
  const byCat = groupByCategory(menu);
  const catEntries = Array.from(byCat.entries())
    .map(([cat, items]) => {
      const discN = items.filter((i) => discountPct(i) != null).length;
      const score = discN * 10 + items.filter((i) => i.isRecommended).length * 3 + items.length;
      return { cat, items, score };
    })
    .filter((e) => e.items.length >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  catEntries.forEach((e, i) => {
    if (promos.length >= 8) return;
    push(categoryDeal(e.cat, e.items, currency, locale, i));
  });

  // 3) Cuisine spreads
  const byCuisine = groupByCuisine(menu);
  Array.from(byCuisine.entries())
    .filter(([, items]) => items.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .forEach(([cuisine, items], i) => {
      if (promos.length >= 9) return;
      push(cuisineFeast(cuisine, items, i));
    });

  // 4) Free delivery basket deal (always multi-order policy)
  if (storeId || store) {
    const thresholdLabel = formatPrice(FREE_DELIVERY_THRESHOLD_MINOR, currency, locale);
    const sample = thumbs(menu.filter((i) => i.isRecommended).concat(menu), 3);
    const theme = themeAt(6);
    push({
      id: `policy-free-delivery-${storeId || 'store'}`,
      headline: 'FREE DELIVERY',
      title: `Orders from ${thresholdLabel}`,
      subtitle: 'No delivery fee when your basket hits the threshold — this branch only',
      badge: 'Basket deal',
      source: 'store_policy',
      dishNames: sample.names,
      dishImageUrls: sample.urls,
      accent: theme.accent,
      gradient: theme.gradient,
      ctaLabel: 'Start order',
    });
  }

  // Prefer cards that feel like real promos: campaigns + sales + basket first
  const rank = (p: CustomerPromotion) => {
    if (p.source === 'campaign') return 0;
    if (p.badge === 'Sale') return 1;
    if (p.source === 'store_policy') return 2;
    if (p.source === 'category_deal') return 3;
    return 4;
  };
  return promos.sort((a, b) => rank(a) - rank(b)).slice(0, 8);
}
