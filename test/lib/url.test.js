import {
  extractDeeplinkPath,
  extractMobileDeeplinkPath,
  getParamValue,
  isValidURL,
  processReferringLink,
  removeTrailingDotZeros,
} from '../../src/lib/url.js';

describe('lib/url', () => {
  describe('getParamValue', () => {
    it('returns the search param value', () => {
      if (testUtils.go('?test=testsearch')) {
        expect(getParamValue('test')).toBe('testsearch');
      }
    });

    it('returns undefined if not set', () => {
      if (testUtils.go('')) {
        expect(getParamValue('test')).toBe(undefined);
      }
    });
  });

  describe('extractDeeplinkPath', () => {
    it('strips protocol and domain', () => {
      expect(extractDeeplinkPath('https://domain.name/some/path')).toBe(
        'some/path',
      );
    });

    it('returns null for falsy input', () => {
      expect(extractDeeplinkPath(null)).toBe(null);
    });
  });

  describe('extractMobileDeeplinkPath', () => {
    it('strips a custom scheme', () => {
      expect(extractMobileDeeplinkPath('AppName://some/path')).toBe(
        'some/path',
      );
    });

    it('strips a leading slash when there is no scheme', () => {
      expect(extractMobileDeeplinkPath('/some/path')).toBe('some/path');
    });

    it('passes through a path with neither scheme nor leading slash', () => {
      expect(extractMobileDeeplinkPath('some/path')).toBe('some/path');
    });

    it('returns null for falsy input', () => {
      expect(extractMobileDeeplinkPath(null)).toBe(null);
    });
  });

  describe('isValidURL', () => {
    it('accepts well-formed http(s) urls', () => {
      expect(isValidURL('https://example.com/path?a=1#hash')).toBe(true);
      expect(isValidURL('http://127.0.0.1:8080')).toBe(true);
    });

    it('rejects blank or malformed urls', () => {
      expect(isValidURL('')).toBe(false);
      expect(isValidURL('   ')).toBe(false);
      expect(isValidURL('not a url')).toBe(false);
    });
  });

  describe('processReferringLink', () => {
    it('leaves fully-qualified http(s) links alone', () => {
      expect(processReferringLink('https://bnc.lt/abc')).toBe(
        'https://bnc.lt/abc',
      );
    });

    it('prefixes bare paths with the link service endpoint', () => {
      const result = processReferringLink('/abc');
      expect(result.endsWith('/abc')).toBe(true);
      expect(result).not.toBe('/abc');
    });

    it('returns null for falsy input', () => {
      expect(processReferringLink(null)).toBe(null);
    });
  });

  describe('removeTrailingDotZeros', () => {
    it('strips trailing .0 segments', () => {
      expect(removeTrailingDotZeros('14.0.0')).toBe('14');
    });

    it('leaves other version strings alone', () => {
      expect(removeTrailingDotZeros('14.5')).toBe('14.5');
    });

    it('passes through falsy input', () => {
      expect(removeTrailingDotZeros('')).toBe('');
      expect(removeTrailingDotZeros(undefined)).toBe(undefined);
    });
  });
});
