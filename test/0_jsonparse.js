import { safejson } from '../src/0_jsonparse.js';

// Expected values are the output of Closure Library's goog.json.serialize,
// which safejson.serialize replaces.
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
    it(`serializes ${String(input)} like goog.json.serialize`, function () {
      expect(safejson.serialize(input)).toBe(expected);
    });
  }

  it('round-trips through JSON.parse', function () {
    const data = { title: 'Tëst 😀', tags: ['a', 'b'], nested: { n: 1 } };
    expect(JSON.parse(safejson.serialize(data))).toEqual(data);
  });
});
