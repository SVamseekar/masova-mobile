import {
  formatPrice,
  formatCurrency,
  formatMajor,
  toMajorUnits,
  centsToRupees,
  rupeesToCents,
  DEFAULT_CURRENCY,
} from '../money';

describe('money utils (platform EUR)', () => {
  describe('toMajorUnits', () => {
    it('divides integer cents >= 100', () => {
      expect(toMajorUnits(890)).toBe(8.9);
      expect(toMajorUnits(12900)).toBe(129);
    });
    it('keeps small major values', () => {
      expect(toMajorUnits(8.9)).toBe(8.9);
      expect(toMajorUnits(12)).toBe(12);
    });
  });

  describe('formatPrice', () => {
    it('defaults to EUR not INR', () => {
      const s = formatPrice(890);
      expect(s).toMatch(/8[,.]90/);
      expect(s).not.toContain('₹');
      expect(DEFAULT_CURRENCY).toBe('EUR');
    });

    it('formats zero', () => {
      const s = formatPrice(0);
      expect(s).toMatch(/0/);
      expect(s).not.toContain('₹');
    });

    it('handles NaN', () => {
      expect(formatPrice(NaN)).not.toContain('₹');
      expect(formatPrice(null as any)).not.toContain('₹');
    });

    it('can format INR when store is India', () => {
      const s = formatPrice(12900, 'INR', 'en-IN');
      expect(s).toContain('₹');
    });
  });

  describe('formatMajor', () => {
    it('does not divide again', () => {
      const s = formatMajor(12.5, 'EUR', 'de-DE');
      expect(s).toMatch(/12[,.]50/);
    });
  });

  describe('formatCurrency (legacy)', () => {
    it('formats major amount with EUR by default', () => {
      const s = formatCurrency(129.5);
      expect(s).not.toContain('₹');
    });
  });

  describe('cents helpers (compat names)', () => {
    it('centsToRupees aliases toMajorUnits', () => {
      expect(centsToRupees(1500)).toBe(15);
    });
    it('rupeesToCents multiplies', () => {
      expect(rupeesToCents(15.5)).toBe(1550);
    });
  });
});
