/**
 * Customer-facing cart pricing aligned with MaSoVa platform (DE / EUR demo).
 *
 * Platform OrderService routes DE stores through EuVatEngine:
 *   TAKEAWAY / DELIVERY FOOD → 7% VAT (see eu-vat DE context-rates)
 * Seed uses the same 7% on demo orders.
 *
 * Amounts in cart are minor units (cents) matching menu basePrice.
 */

export type OrderTypeForTax = 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';

/** DE reduced food VAT for takeaway/delivery; standard for dine-in */
export function vatRatePercent(
  countryCode: string | undefined | null,
  orderType: OrderTypeForTax = 'DELIVERY'
): number {
  const cc = (countryCode || 'DE').toUpperCase();
  if (cc === 'IN') return 5; // legacy GST approx for India stores
  if (cc === 'DE' || cc === 'AT') {
    if (orderType === 'DINE_IN') return 19;
    return 7;
  }
  // Safe EU food takeaway default
  if (orderType === 'DINE_IN') return 19;
  return 7;
}

export function calculateTaxMinor(
  subtotalMinor: number,
  countryCode?: string | null,
  orderType: OrderTypeForTax = 'DELIVERY'
): number {
  const rate = vatRatePercent(countryCode, orderType) / 100;
  return Math.round(subtotalMinor * rate);
}

/** Free delivery at/above this subtotal (cents) — €25 */
export const FREE_DELIVERY_THRESHOLD_MINOR = 2500;
/** Flat delivery fee when below threshold (cents) — €2.50 */
export const DEFAULT_DELIVERY_FEE_MINOR = 250;

export function calculateDeliveryFeeMinor(subtotalMinor: number): number {
  return subtotalMinor >= FREE_DELIVERY_THRESHOLD_MINOR ? 0 : DEFAULT_DELIVERY_FEE_MINOR;
}

export function taxLabel(countryCode?: string | null, orderType: OrderTypeForTax = 'DELIVERY'): string {
  const rate = vatRatePercent(countryCode, orderType);
  const cc = (countryCode || 'DE').toUpperCase();
  if (cc === 'IN') return `Taxes & GST (${rate}%)`;
  return `VAT / MwSt (${rate}%)`;
}
