import {
  calculateDiffBetweenArrays,
  isStandardEvent,
  separateEventAndCustomData,
  validateCommerceEventParams,
} from '../../src/lib/validation.js';

describe('lib/validation', () => {
  describe('calculateDiffBetweenArrays', () => {
    it('returns elements present in toCheck but not in original', () => {
      expect(calculateDiffBetweenArrays(['a', 'b'], ['b', 'c'])).toEqual(['c']);
    });

    it('returns an empty array when there is no difference', () => {
      expect(calculateDiffBetweenArrays(['a', 'b'], ['a'])).toEqual([]);
    });
  });

  describe('isStandardEvent', () => {
    it('recognizes standard event names', () => {
      expect(isStandardEvent('PURCHASE')).toBe(true);
    });

    it('rejects unknown event names', () => {
      expect(isStandardEvent('NOT_A_REAL_EVENT')).toBe(false);
    });
  });

  describe('validateCommerceEventParams', () => {
    it('rejects a missing/invalid event name', () => {
      expect(validateCommerceEventParams(null, { a: 1 })).toMatch(/event name/);
      expect(validateCommerceEventParams('not-purchase', { a: 1 })).toMatch(
        /event name/,
      );
    });

    it('rejects missing or empty commerce_data', () => {
      expect(validateCommerceEventParams('purchase', null)).toMatch(
        /commerce_data/,
      );
      expect(validateCommerceEventParams('purchase', {})).toMatch(
        /commerce_data/,
      );
    });

    it('rejects disallowed root keys', () => {
      expect(
        validateCommerceEventParams('purchase', { not_allowed: true }),
      ).toMatch(/root of commerce_data/);
    });

    it('returns null for valid commerce data', () => {
      expect(
        validateCommerceEventParams('purchase', {
          transaction_id: 't1',
          products: [{ sku: 'a' }],
        }),
      ).toBe(null);
    });

    // Characterization test: pins current (buggy) behavior. A null entry in
    // products passes the `typeof product !== 'object'` check (typeof null
    // is 'object'), so Object.keys(null) is called and throws.
    it('throws when a product entry is null', () => {
      expect(() =>
        validateCommerceEventParams('purchase', { products: [null] }),
      ).toThrow();
    });
  });

  describe('separateEventAndCustomData', () => {
    it('splits recognized event fields from custom data', () => {
      const result = separateEventAndCustomData({
        revenue: 10,
        custom_field: 'x',
      });
      expect(result.event_data).toEqual({ revenue: 10 });
      expect(result.custom_data).toEqual({ custom_field: 'x' });
    });

    it('returns null for empty input', () => {
      expect(separateEventAndCustomData({})).toBe(null);
      expect(separateEventAndCustomData(null)).toBe(null);
    });
  });
});
