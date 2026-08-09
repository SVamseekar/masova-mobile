import { formatPrice, formatCurrency, centsToRupees, rupeesToCents } from '../money';

describe('Money Utilities', () => {
  describe('formatPrice', () => {
    it('formats price in paise/cents correctly', () => {
      expect(formatPrice(12900)).toBe('₹129');
      expect(formatPrice(8900)).toBe('₹89');
      expect(formatPrice(0)).toBe('₹0');
    });

    it('handles invalid inputs gracefully', () => {
      expect(formatPrice(NaN)).toBe('₹0');
      expect(formatPrice(null as any)).toBe('₹0');
      expect(formatPrice(undefined as any)).toBe('₹0');
    });
  });

  describe('formatCurrency', () => {
    it('formats standard currency with 2 decimals', () => {
      expect(formatCurrency(129.5)).toBe('₹129.50');
      expect(formatCurrency(100)).toBe('₹100.00');
    });

    it('accepts custom currency symbols', () => {
      expect(formatCurrency(50.25, '$')).toBe('$50.25');
    });

    it('handles invalid inputs gracefully', () => {
      expect(formatCurrency(NaN)).toBe('₹0.00');
      expect(formatCurrency(null as any)).toBe('₹0.00');
    });
  });

  describe('centsToRupees', () => {
    it('converts cents to rupees accurately', () => {
      expect(centsToRupees(1500)).toBe(15);
      expect(centsToRupees(250)).toBe(2.5);
      expect(centsToRupees(0)).toBe(0);
    });

    it('handles invalid inputs gracefully', () => {
      expect(centsToRupees(NaN)).toBe(0);
      expect(centsToRupees(undefined as any)).toBe(0);
    });
  });

  describe('rupeesToCents', () => {
    it('converts rupees to cents accurately', () => {
      expect(rupeesToCents(15)).toBe(1500);
      expect(rupeesToCents(2.5)).toBe(250);
      expect(rupeesToCents(0)).toBe(0);
    });

    it('handles invalid inputs gracefully', () => {
      expect(rupeesToCents(NaN)).toBe(0);
      expect(rupeesToCents(null as any)).toBe(0);
    });
  });
});
