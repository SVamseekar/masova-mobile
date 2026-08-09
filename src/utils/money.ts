/**
 * Money and Currency Utilities
 * Formats monetary amounts in paise / cents or standard currency representations.
 */

/**
 * Formats base price in paise/cents (integer) to display string with rupee symbol.
 * Example: 12900 -> "₹129", 0 -> "₹0"
 */
export const formatPrice = (priceInCents: number): string => {
  if (isNaN(priceInCents) || priceInCents === null || priceInCents === undefined) {
    return '₹0';
  }
  const mainCurrency = priceInCents / 100;
  return `₹${mainCurrency.toFixed(0)}`;
};

/**
 * Formats standard amount (number) to currency display with decimal precision.
 * Example: 129.5 -> "₹129.50"
 */
export const formatCurrency = (amount: number, currencySymbol: string = '₹'): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${currencySymbol}0.00`;
  }
  return `${currencySymbol}${amount.toFixed(2)}`;
};

/**
 * Converts cents/paise to standard currency units (e.g. 1500 -> 15.00)
 */
export const centsToRupees = (cents: number): number => {
  if (isNaN(cents) || cents === null || cents === undefined) {
    return 0;
  }
  return cents / 100;
};

/**
 * Converts rupees to cents/paise (e.g. 15.5 -> 1550)
 */
export const rupeesToCents = (rupees: number): number => {
  if (isNaN(rupees) || rupees === null || rupees === undefined) {
    return 0;
  }
  return Math.round(rupees * 100);
};
