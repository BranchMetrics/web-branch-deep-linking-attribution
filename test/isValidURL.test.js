import { config } from '../src/0_config.js';
import { utils } from '../src/1_utils.js';
import { Branch } from '../src/6_branch.js';

// Same URL rules as isValidURL, written without a regex, to check the pattern against.
const ALNUM = 'abcdefghijklmnopqrstuvwxyz0123456789';
const charIn = function (set) {
  return function (c) {
    return c !== undefined && set.includes(c);
  };
};
const isAlnum = charIn(ALNUM);
const isDigit = charIn('0123456789');
const isHostChar = charIn(`${ALNUM}.-`);
const isPathChar = charIn(`${ALNUM}-%_.~+`);
const isQueryChar = charIn(`${ALNUM};&%_.~+=-`);
const isFragmentChar = charIn(`${ALNUM}-_`);
const isLabel = function (s) {
  return (
    s.length > 0 &&
    isAlnum(s[0]) &&
    isAlnum(s[s.length - 1]) &&
    [...s].every((c) => isAlnum(c) || c === '-')
  );
};
const isTld = function (s) {
  return s.length >= 2 && [...s].every((c) => c >= 'a' && c <= 'z');
};
const isOctet = function (s) {
  return s.length >= 1 && s.length <= 3 && [...s].every(isDigit);
};
const asciiLowerCase = function (s) {
  return [...s]
    .map((c) => (c >= 'A' && c <= 'Z' ? c.toLowerCase() : c))
    .join('');
};

const referenceIsValidURL = function (url) {
  if (!url || url.trim() === '') {
    return false;
  }
  const s = asciiLowerCase(url);
  let i;
  if (s.startsWith('https://')) {
    i = 8;
  } else if (s.startsWith('http://')) {
    i = 7;
  } else {
    return false;
  }
  const hostStart = i;
  while (isHostChar(s[i])) {
    i++;
  }
  const parts = s.slice(hostStart, i).split('.');
  const isDomain =
    parts.length >= 2 &&
    isTld(parts[parts.length - 1]) &&
    parts.slice(0, -1).every(isLabel);
  const isIPv4 = parts.length === 4 && parts.every(isOctet);
  if (!isDomain && !isIPv4) {
    return false;
  }
  if (s[i] === ':') {
    const portStart = ++i;
    while (isDigit(s[i])) {
      i++;
    }
    if (i === portStart) {
      return false;
    }
  }
  while (s[i] === '/') {
    i++;
    while (isPathChar(s[i])) {
      i++;
    }
  }
  if (s[i] === '?') {
    i++;
    while (isQueryChar(s[i])) {
      i++;
    }
  }
  if (s[i] === '#') {
    i++;
    while (isFragmentChar(s[i])) {
      i++;
    }
  }
  return i === s.length;
};

// Small deterministic PRNG (mulberry32) so fuzz failures are reproducible.
const prng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const timeMs = function (fn) {
  const start = performance.now();
  fn();
  return performance.now() - start;
};

describe('utils.isValidURL', function () {
  describe('accepts', function () {
    it.each([
      ['single-character label', 'https://a.io'],
      ['uppercase host (case-insensitive)', 'https://A.IO'],
      ['uppercase scheme and host', 'HTTPS://EXAMPLE.COM'],
      ['http scheme', 'http://api2.branch.io'],
      ['https scheme', 'https://api2.branch.io'],
      ['deep subdomains', 'http://x.y.z.example.com'],
      ['all-digit label', 'https://123.example.com'],
      ['hyphenated labels', 'https://a-b.c-d.example.co.uk'],
      ['mixed letters, digits, hyphens', 'https://a1-b2.example.com'],
      ['consecutive hyphens inside a label', 'https://a--b.example.com'],
      ['punycode label', 'https://xn--80ak6aa92e.com'],
      ['long TLD', 'https://example.museum'],
      ['port', 'https://api2.branch.io:443'],
      ['port and trailing slash', 'http://localhost.dev:8080/'],
      ['trailing slash', 'https://example.com/'],
      ['multi-segment path', 'https://example.com/a/b/c'],
      [
        'encoded and unreserved path chars',
        'https://example.com/a%20b/~c_d.e+f',
      ],
      ['query string', 'https://example.com?a=1&b=2'],
      [
        'path, query with semicolon, fragment',
        'https://example.com/p?q=1;r=2#frag',
      ],
      ['fragment only', 'https://example.com#top'],
      ['empty query', 'https://example.com/?'],
      ['empty fragment', 'https://example.com/#'],
      ['IPv4 host', 'http://192.168.0.1'],
      ['IPv4 host with port and path', 'http://10.0.0.1:3000/health'],
      // Existing behaviour, kept as-is: octets are not range-checked.
      ['IPv4-shaped host with out-of-range octets', 'http://999.999.999.999'],
      ['63-character label', `https://${'a'.repeat(63)}.com`],
      ['many labels', `https://${'a.'.repeat(100)}com`],
    ])('%s: %s', function (_name, url) {
      expect(utils.isValidURL(url)).toBe(true);
    });
  });

  describe('rejects', function () {
    it.each([
      ['empty string', ''],
      ['whitespace only', '   '],
      ['null', null],
      ['undefined', undefined],
      ['ftp scheme', 'ftp://example.com'],
      ['javascript: URL', 'javascript:alert(1)'],
      ['mailto: URL', 'mailto:a@b.co'],
      ['misspelled scheme', 'htt://www.example.com'],
      ['missing scheme', '://www.example.com'],
      ['no scheme at all', 'example.com'],
      ['one slash after scheme', 'https:/example.com'],
      ['three slashes after scheme', 'https:///example.com'],
      ['no TLD', 'https://example'],
      ['trailing dot', 'https://example.com.'],
      ['empty TLD after dot', 'https://example.'],
      ['leading dot', 'https://.example.com'],
      ['empty label before TLD', 'https://.com'],
      ['empty label between dots', 'https://a..example.com'],
      ['label starting with a hyphen', 'https://-a.example.com'],
      ['label ending with a hyphen', 'https://a-.example.com'],
      ['label that is only a hyphen', 'https://-.example.com'],
      ['underscore in host', 'https://exa_mple.com'],
      ['one-letter TLD', 'https://example.c'],
      ['numeric TLD', 'https://example.123'],
      ['non-ASCII host', 'https://exämple.com'],
      ['non-numeric port', 'https://example.com:abc'],
      ['empty port', 'https://example.com:'],
      ['userinfo', 'https://user@example.com'],
      ['IPv6 host', 'http://[::1]'],
      ['IPv4 with three octets', 'http://1.2.3'],
      ['IPv4 with five octets', 'http://1.2.3.4.5'],
      ['leading whitespace', ' https://example.com'],
      ['trailing whitespace', 'https://example.com '],
      ['space in path', 'https://www.example.com/path with spaces'],
      ['space in query', 'https://example.com/?q=a b'],
      ['quote in path', 'https://example.com/a"b'],
      ['angle brackets in query', 'https://example.com?q=<x>'],
      ['two fragments', 'https://example.com#a#b'],
      ['embedded newline', 'https://example.com/path\nhttps://x.co'],
    ])('%s: %j', function (_name, url) {
      expect(utils.isValidURL(url)).toBe(false);
    });
  });

  describe('matches the regex-free reference', function () {
    it('agrees on every host built from [a 1 - . !] up to 7 characters', function () {
      const alphabet = ['a', '1', '-', '.', '!'];
      const suffixes = ['', '.io', '-.io', '.1.2', ':80', '/p?q#f'];
      let compared = 0;
      const mismatches = [];
      const visit = function (host, depth) {
        for (const suffix of suffixes) {
          const url = `http://${host}${suffix}`;
          compared++;
          if (utils.isValidURL(url) !== referenceIsValidURL(url)) {
            mismatches.push(url);
          }
        }
        if (depth === 0) {
          return;
        }
        for (const ch of alphabet) {
          visit(host + ch, depth - 1);
        }
      };
      visit('', 7);
      expect(mismatches).toEqual([]);
      expect(compared).toBeGreaterThan(500000);
    });

    it('agrees on every port/path/query/fragment tail up to 4 characters', function () {
      const alphabet = [
        ':',
        '1',
        '/',
        '?',
        '#',
        'a',
        '.',
        '%',
        ' ',
        '=',
        '&',
        ';',
        '-',
        '_',
      ];
      let compared = 0;
      const mismatches = [];
      const visit = function (tail, depth) {
        for (const host of ['https://ex.com', 'http://1.2.3.4']) {
          const url = host + tail;
          compared++;
          if (utils.isValidURL(url) !== referenceIsValidURL(url)) {
            mismatches.push(url);
          }
        }
        if (depth === 0) {
          return;
        }
        for (const ch of alphabet) {
          visit(tail + ch, depth - 1);
        }
      };
      visit('', 4);
      expect(mismatches).toEqual([]);
      expect(compared).toBeGreaterThan(80000);
    });

    it('agrees on 20,000 random URL-shaped strings', function () {
      const random = prng(1160);
      const pick = function (items) {
        return items[Math.floor(random() * items.length)];
      };
      const hostChars = 'aZ09-._!:@'.split('');
      const tailChars = 'a0-._~%+/?#;&= "<'.split('');
      const schemes = [
        'http://',
        'https://',
        'HTTP://',
        'htp://',
        'https:/',
        '',
      ];
      const randomString = function (chars, max) {
        let out = '';
        const len = Math.floor(random() * (max + 1));
        for (let i = 0; i < len; i++) {
          out += pick(chars);
        }
        return out;
      };
      const mismatches = [];
      for (let i = 0; i < 20000; i++) {
        // Hosts stay short so a regression to the exponential pattern fails fast instead of hanging.
        const url =
          pick(schemes) +
          randomString(hostChars, 14) +
          pick(['', '.com', '.co.uk', '.1']) +
          randomString(tailChars, 10);
        if (utils.isValidURL(url) !== referenceIsValidURL(url)) {
          mismatches.push(url);
        }
      }
      expect(mismatches).toEqual([]);
    });
  });

  describe('does not backtrack exponentially', function () {
    const BUDGET_MS = 250;

    // Sized one step past where the old pattern takes ~1 s on a fast laptop (its time
    // roughly doubles per extra character). The fixed pattern finishes in well under 1 ms.
    // Kept short on purpose: a regression fails in a few seconds instead of hanging the run,
    // because a backtracking regex cannot be interrupted by the test timeout.
    it.each([
      ['digit run, then an invalid char', `http://${'0'.repeat(31)}!`],
      ['letter run, then an invalid char', `http://${'a'.repeat(31)}!`],
      ['alternating letter-hyphen run', `http://${'a-'.repeat(29)}!`],
      ['run ending in a hyphen', `http://${'a'.repeat(31)}-`],
      ['run, dot, then a numeric TLD', `http://${'a'.repeat(30)}.1`],
      [
        'several runs as labels, then an invalid char',
        `http://${`${'a'.repeat(12)}.`.repeat(3)}!`,
      ],
      [
        'run before a valid TLD and a bad port',
        `http://${'0'.repeat(28)}.com:x`,
      ],
    ])('rejects quickly: %s', function (_name, url) {
      expect(timeMs(() => utils.isValidURL(url))).toBeLessThan(BUDGET_MS);
      expect(utils.isValidURL(url)).toBe(false);
    });

    // Long inputs. Only shapes the old pattern also handled quickly, so these guard
    // against new slowdowns without being able to hang the run.
    it.each([
      ['IPv4-like run', `http://${'1.'.repeat(3000)}!`, false],
      [
        'long path, then a space',
        `https://example.com${'/a'.repeat(5000)} `,
        false,
      ],
      [
        'long query, then a space',
        `https://example.com/?${'a=1&'.repeat(2500)} `,
        false,
      ],
      ['long valid host', `https://${'a-b1.'.repeat(2000)}com`, true],
    ])('handles long input quickly: %s', function (_name, url, expected) {
      expect(timeMs(() => utils.isValidURL(url))).toBeLessThan(BUDGET_MS);
      expect(utils.isValidURL(url)).toBe(expected);
    });
  });

  describe('through branch.setAPIUrl', function () {
    let original;
    beforeEach(function () {
      original = config.api_endpoint;
    });
    afterEach(function () {
      config.api_endpoint = original;
      vi.restoreAllMocks();
    });

    it('sets a valid URL', function () {
      Branch.prototype.setAPIUrl.call({}, 'https://api.example.com');
      expect(config.api_endpoint).toBe('https://api.example.com');
    });

    it('rejects an invalid URL quickly and keeps the current endpoint', function () {
      const error = vi
        .spyOn(console, 'error')
        .mockImplementation(function () {});
      const elapsed = timeMs(function () {
        Branch.prototype.setAPIUrl.call({}, `http://${'0'.repeat(31)}!`);
      });
      expect(elapsed).toBeLessThan(250);
      expect(config.api_endpoint).toBe(original);
      expect(error).toHaveBeenCalledWith(
        'setAPIUrl: Invalid URL format. Default URL will be set.',
      );
    });
  });
});
