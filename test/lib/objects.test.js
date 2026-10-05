import {
  addPropertyIfNotNull,
  addPropertyIfNotNullorEmpty,
  cleanBannerText,
  convertObjectValuesToString,
  convertValueToString,
  delay,
  getBooleanOrNull,
  isBoolean,
  isKey,
  merge,
  removePropertiesFromObject,
  snakeToCamel,
  validateParameterType,
} from '../../src/lib/objects.js';

describe('lib/objects', () => {
  describe('merge', () => {
    it('returns an empty object when "to" is null', () => {
      expect(merge(null, { a: 1 })).toEqual({ a: 1 });
    });

    it('merges nested-looking keys shallowly, overwriting existing values', () => {
      const to = { a: 1, nested: { x: 1 } };
      const from = { nested: { y: 2 }, b: 2 };
      expect(merge(to, from)).toEqual({ a: 1, nested: { y: 2 }, b: 2 });
    });

    it('removes null/undefined entries from "to" when removeNull is set', () => {
      const to = { a: 1, b: 2 };
      const from = { a: null, b: undefined, c: 3 };
      expect(merge(to, from, true)).toEqual({ c: 3 });
    });

    it('returns "to" unchanged when "from" is not an object', () => {
      const to = { a: 1 };
      expect(merge(to, null)).toBe(to);
    });
  });

  describe('isKey', () => {
    it('detects branch keys', () => {
      expect(isKey('key_live_abc')).toBe(true);
      expect(isKey('abc')).toBe(false);
    });
  });

  describe('snakeToCamel', () => {
    it('converts dash-separated strings to camelCase', () => {
      expect(snakeToCamel('foo-bar')).toBe('fooBar');
    });
  });

  describe('cleanBannerText', () => {
    it('escapes angle brackets', () => {
      expect(cleanBannerText('<b>hi</b>')).toBe('&lt;b&gt;hi&lt;/b&gt;');
    });

    it('returns null for non-strings', () => {
      expect(cleanBannerText(null)).toBe(null);
    });
  });

  describe('addPropertyIfNotNull', () => {
    it('adds the property when value is present', () => {
      expect(addPropertyIfNotNull({}, 'a', 1)).toEqual({ a: 1 });
    });

    it('skips null and undefined values', () => {
      expect(addPropertyIfNotNull({}, 'a', null)).toEqual({});
      expect(addPropertyIfNotNull({}, 'a', undefined)).toEqual({});
    });

    it('skips empty objects', () => {
      expect(addPropertyIfNotNull({}, 'a', {})).toEqual({});
    });
  });

  describe('addPropertyIfNotNullorEmpty', () => {
    it('adds non-empty strings', () => {
      expect(addPropertyIfNotNullorEmpty({}, 'a', 'x')).toEqual({ a: 'x' });
    });

    it('skips empty strings and non-strings', () => {
      expect(addPropertyIfNotNullorEmpty({}, 'a', '')).toEqual({});
      expect(addPropertyIfNotNullorEmpty({}, 'a', 5)).toEqual({});
    });
  });

  describe('removePropertiesFromObject', () => {
    it('removes the given keys in place', () => {
      const obj = { a: 1, b: 2, c: 3 };
      removePropertiesFromObject(obj, ['a', 'c']);
      expect(obj).toEqual({ b: 2 });
    });

    it('is a no-op for invalid inputs', () => {
      const obj = { a: 1 };
      removePropertiesFromObject(obj, []);
      expect(obj).toEqual({ a: 1 });
      removePropertiesFromObject(null, ['a']);
    });
  });

  describe('validateParameterType', () => {
    it('validates primitive types', () => {
      expect(validateParameterType('x', 'string')).toBe(true);
      expect(validateParameterType(1, 'string')).toBe(false);
    });

    it('validates arrays explicitly', () => {
      expect(validateParameterType([1, 2], 'array')).toBe(true);
      expect(validateParameterType({}, 'array')).toBe(false);
    });

    it('rejects null objects', () => {
      expect(validateParameterType(null, 'object')).toBe(false);
    });
  });

  describe('convertValueToString', () => {
    it('stringifies objects and arrays', () => {
      expect(convertValueToString({ a: 1 })).toBe(JSON.stringify({ a: 1 }));
      expect(convertValueToString([1, 2])).toBe(JSON.stringify([1, 2]));
    });

    it('converts null to the string "null"', () => {
      expect(convertValueToString(null)).toBe('null');
    });

    it('converts other values via toString', () => {
      expect(convertValueToString(5)).toBe('5');
    });
  });

  describe('convertObjectValuesToString', () => {
    it('stringifies every value in the object', () => {
      expect(convertObjectValuesToString({ a: 1, b: true })).toEqual({
        a: '1',
        b: 'true',
      });
    });

    it('returns {} for invalid input', () => {
      expect(convertObjectValuesToString(null)).toEqual({});
      expect(convertObjectValuesToString({})).toEqual({});
    });
  });

  describe('getBooleanOrNull', () => {
    it('returns null for undefined', () => {
      expect(getBooleanOrNull(undefined)).toBe(null);
    });

    it('passes through other values, including false', () => {
      expect(getBooleanOrNull(false)).toBe(false);
      expect(getBooleanOrNull(true)).toBe(true);
    });
  });

  describe('isBoolean', () => {
    it('only true for actual booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(null)).toBe(false);
    });
  });

  describe('delay', () => {
    it('executes immediately when delay is 0', () => {
      const operation = vi.fn();
      delay(operation, 0);
      expect(operation).toHaveBeenCalledOnce();
    });

    it('schedules via setTimeout for positive delays', () => {
      vi.useFakeTimers();
      const operation = vi.fn();
      delay(operation, 50);
      expect(operation).not.toHaveBeenCalled();
      vi.advanceTimersByTime(50);
      expect(operation).toHaveBeenCalledOnce();
      vi.useRealTimers();
    });
  });
});
