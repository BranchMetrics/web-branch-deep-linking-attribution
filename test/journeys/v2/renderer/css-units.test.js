import { remToPx } from '../../../../src/journeys/v2/renderer/css-units.js';

describe('journeys/v2/renderer remToPx', () => {
  it('converts rem lengths in declarations', () => {
    expect(remToPx('a{font-size:1.5rem;padding:.5rem 2rem}', 16)).toBe(
      'a{font-size:24px;padding:8px 32px}',
    );
    expect(remToPx('a{margin:-1rem}', 20)).toBe('a{margin:-20px}');
    expect(remToPx('a{width:calc(100% - 1rem)}', 16)).toBe(
      'a{width:calc(100% - 16px)}',
    );
  });

  it('rounds to three decimals', () => {
    expect(remToPx('a{top:0.333rem}', 16)).toBe('a{top:5.328px}');
  });

  it('leaves everything that is not a rem length alone', () => {
    const css =
      '.col-2rem{x:1}a{background:url(icons/2rem.svg)}b::after{content:"1rem"}c{d:\'3rem\'}/* 4rem */e{f:2em;g:10px}';
    expect(remToPx(css, 16)).toBe(css);
  });
});
