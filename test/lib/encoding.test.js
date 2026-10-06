import {
  base64Decode,
  base64encode,
  decodeBFPs,
  decodeSymbols,
  encodeBFPs,
  isBase64Encoded,
} from '../../src/lib/encoding.js';

describe('lib/encoding', () => {
  describe('base64encode / base64Decode', () => {
    it('round-trips a plain string', () => {
      const encoded = base64encode('hello world');
      expect(encoded).toBe(btoa('hello world'));
      expect(base64Decode(encoded)).toBe('hello world');
    });

    it('returns the input unchanged if it is not base64 encoded', () => {
      expect(base64Decode('not base64 !!')).toBe('not base64 !!');
    });
  });

  describe('isBase64Encoded', () => {
    it('returns true for base64-encoded strings', () => {
      expect(isBase64Encoded(btoa('hi'))).toBe(true);
    });

    it('returns false for non-strings, empty strings, and non-base64 strings', () => {
      expect(isBase64Encoded(null)).toBe(false);
      expect(isBase64Encoded('')).toBe(false);
      expect(isBase64Encoded('   ')).toBe(false);
      expect(isBase64Encoded('not base64 !!')).toBe(false);
    });
  });

  describe('encodeBFPs / decodeBFPs', () => {
    it('base64-encodes plain BFP fields and leaves already-encoded ones alone', () => {
      expect(
        encodeBFPs({ browser_fingerprint_id: '79336952217731267' }),
      ).toEqual({
        browser_fingerprint_id: btoa('79336952217731267'),
      });
      const once = encodeBFPs({ browser_fingerprint_id: '79336952217731267' });
      expect(encodeBFPs({ ...once })).toEqual(once);
    });

    it('encodes the alternative BFP field as well', () => {
      expect(
        encodeBFPs({ alternative_browser_fingerprint_id: 'abc123' }),
      ).toEqual({
        alternative_browser_fingerprint_id: btoa('abc123'),
      });
    });

    it('passes null through', () => {
      expect(encodeBFPs(null)).toBe(null);
      expect(decodeBFPs(null)).toBe(null);
    });

    it('decodes encoded BFP fields back to plain values', () => {
      const encoded = encodeBFPs({
        browser_fingerprint_id: '79336952217731267',
        alternative_browser_fingerprint_id: 'abc123',
      });
      expect(decodeBFPs(encoded)).toEqual({
        browser_fingerprint_id: '79336952217731267',
        alternative_browser_fingerprint_id: 'abc123',
      });
    });
  });
});

describe('decodeSymbols', () => {
  it('decodes the HTML entities node-api escapes, and maps nullish to null', () => {
    expect(
      decodeSymbols('Tom &amp; Jerry &lt;3 &quot;hi&quot; caf&eacute;'),
    ).toBe('Tom & Jerry <3 "hi" café');
    expect(decodeSymbols(undefined)).toBeNull();
    expect(decodeSymbols(null)).toBeNull();
  });

  it('decodes the full entity table and leaves unknown entities alone', () => {
    expect(
      decodeSymbols(
        '&lt;&gt;&amp;&quot;&apos;&brvbar;&laquo;&acute;&middot;&raquo;&iquest;&times;&divide;',
      ),
    ).toBe('<>&"\'¦«´·»¿×÷');
    expect(decodeSymbols('&Agrave;&AElig;&Ntilde;&szlig;&eacute;&yuml;')).toBe(
      'ÀÆÑßéÿ',
    );
    expect(decodeSymbols('&unknown;')).toBe('&unknown;');
  });

  it('double-decodes escaped entities', () => {
    // NOTE: possible bug: &amp; is decoded before most entities (and twice), so
    // literal text like "&amp;quot;" or "&amp;amp;" is decoded two levels deep.
    expect(decodeSymbols('&amp;quot;')).toBe('"');
    expect(decodeSymbols('&amp;amp;')).toBe('&');
    // but &lt; runs before &amp;, so this one is only decoded once
    expect(decodeSymbols('&amp;lt;')).toBe('&lt;');
  });
});
