/**
 * Money utilities — MaSoVa platform customer app.
 *
 * Platform DOM stores use EUR with amounts often in minor units (cents):
 *   890 → €8.90
 * Amounts already in major units (< 100 absolute, or fractional) stay as-is.
 *
 * Default currency is EUR (not INR). Always pass store.currency when available.
 */

export const DEFAULT_CURRENCY = 'EUR';
export const DEFAULT_LOCALE = 'de-DE';

export function resolveLocale(currency?: string, locale?: string): string {
  if (locale) return locale;
  const cur = (currency || DEFAULT_CURRENCY).toUpperCase();
  if (cur === 'EUR') return 'de-DE';
  if (cur === 'INR') return 'en-IN';
  if (cur === 'USD' || cur === 'GBP') return 'en-US';
  return DEFAULT_LOCALE;
}

/**
 * Convert API amount to major currency units for display/math.
 * Heuristic aligned with seeded DOM menus (integer cents >= 100).
 */
export function toMajorUnits(amount: number | undefined | null): number {
  if (amount == null || Number.isNaN(Number(amount))) return 0;
  const n = Number(amount);
  if (Math.abs(n) >= 100 && Number.isInteger(n)) return n / 100;
  return n;
}

/**
 * Format a price that may be in minor or major units.
 * Example: formatPrice(890, 'EUR') → "8,90 €" (de-DE)
 */
export function formatPrice(
  amount: number | undefined | null,
  currency: string = DEFAULT_CURRENCY,
  locale?: string
): string {
  const major = toMajorUnits(amount);
  const cur = (currency || DEFAULT_CURRENCY).toUpperCase();
  const loc = resolveLocale(cur, locale);
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${cur} ${major.toFixed(2)}`;
  }
}

/**
 * Format an amount already in major units (e.g. order totals from some APIs).
 */
export function formatMajor(
  amount: number | undefined | null,
  currency: string = DEFAULT_CURRENCY,
  locale?: string
): string {
  if (amount == null || Number.isNaN(Number(amount))) {
    return formatPrice(0, currency, locale);
  }
  const cur = (currency || DEFAULT_CURRENCY).toUpperCase();
  const loc = resolveLocale(cur, locale);
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${cur} ${Number(amount).toFixed(2)}`;
  }
}

/** @deprecated Prefer formatPrice / formatMajor — kept for tests & call sites */
export function formatCurrency(
  amount: number,
  currencyOrSymbol: string = DEFAULT_CURRENCY
): string {
  // If caller passed a symbol like "€", fall back to EUR
  if (currencyOrSymbol.length === 1 || currencyOrSymbol === '₹') {
    const cur = currencyOrSymbol === '₹' ? 'INR' : currencyOrSymbol === '€' ? 'EUR' : DEFAULT_CURRENCY;
    return formatMajor(amount, cur);
  }
  return formatMajor(amount, currencyOrSymbol);
}

export const centsToMajor = toMajorUnits;
/** @deprecated name — use toMajorUnits */
export const centsToRupees = toMajorUnits;

export function majorToMinor(major: number): number {
  if (isNaN(major) || major == null) return 0;
  return Math.round(major * 100);
}

/** @deprecated name — use majorToMinor */
export const rupeesToCents = majorToMinor;
