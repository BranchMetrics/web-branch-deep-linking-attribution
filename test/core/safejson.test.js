import { safejson } from '../../src/core/safejson.js';

// Expected values pin safejson.serialize's established output, which differs
// from JSON.stringify.
describe('safejson.serialize', function () {
  const cases = [
    [null, 'null'],
    [undefined, 'null'],
    [NaN, 'null'],
    [-1.5, '-1.5'],
    [false, 'false'],
    ['a/b', '"a/b"'],
    ['tab\tnl\n\v\x00\x7f', '"tab\\tnl\\n\\u000b\\u0000\\u007f"'],
    ['한 é', '"\\ud55c \\u00e9"'],
    ['😀', '"\\ud83d\\ude00"'],
    [{ a: undefined, b: null, c: () => 1 }, '{"a":null,"b":null}'],
    [[1, undefined, () => 2], '[1,null,null]'],
    [new Date(0), '{}'],
    [new String('s'), '"s"'],
    [Object.assign(Object.create({ inherited: 1 }), { own: 2 }), '{"own":2}'],
  ];
  for (const [input, expected] of cases) {
    it(`serializes ${String(input)} as expected`, function () {
      expect(safejson.serialize(input)).toBe(expected);
    });
  }

  describe('nested values', function () {
    it('applies the undefined/function/Date rules at every depth', function () {
      const input = {
        a: {
          b: [{ c: undefined, d: () => 1, e: new Date(0) }, undefined],
          f: { g: { h: null } },
        },
      };
      expect(safejson.serialize(input)).toBe(
        '{"a":{"b":[{"c":null,"e":{}},null],"f":{"g":{"h":null}}}}',
      );
    });

    it('escapes non-ASCII in nested keys and values', function () {
      const input = { 'ü': { tags: ['é', { '😀': '한' }] } };
      expect(safejson.serialize(input)).toBe(
        '{"\\u00fc":{"tags":["\\u00e9",{"\\ud83d\\ude00":"\\ud55c"}]}}',
      );
    });

    it('keeps empty containers and key order', function () {
      const input = { z: {}, a: [], m: [[], [{}]] };
      expect(safejson.serialize(input)).toBe('{"z":{},"a":[],"m":[[],[{}]]}');
    });

    it('matches JSON.stringify for plain ASCII data', function () {
      const input = {
        $og_title: 'Title',
        $deeplink_path: 'a/b?c=1',
        custom: {
          level1: { level2: { level3: { n: 1.5, ok: true, list: [1, 'x'] } } },
        },
      };
      expect(safejson.serialize(input)).toBe(JSON.stringify(input));
    });

    it('serializes deep nesting and round-trips it', function () {
      let input = { leaf: 'é' };
      for (let i = 0; i < 500; i++) {
        input = i % 2 ? { child: input } : [input];
      }
      expect(JSON.parse(safejson.serialize(input))).toEqual(input);
    });

    it('throws instead of hanging on a circular reference', function () {
      const input = { a: {} };
      input.a.self = input;
      expect(function () {
        safejson.serialize(input);
      }).toThrow();
    });
  });

  it('round-trips through JSON.parse', function () {
    const data = { title: 'Tëst 😀', tags: ['a', 'b'], nested: { n: 1 } };
    expect(JSON.parse(safejson.serialize(data))).toEqual(data);
  });
});
