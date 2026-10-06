import {
  getCss,
  getCtaText,
  getIframeCss,
  getJs,
  getMetadata,
  removeScriptAndCss,
} from '../../src/journeys/template.js';

const CSS =
  '<style type="text/css" id="branch-css">#branch-banner{color:red}</style>';
const IFRAME_CSS =
  '<style type="text/css" id="branch-iframe-css">#branch-banner-iframe{border:0}</style>';
const JS = '<script type="text/javascript">var a = 1;</script>';
const JSON_TAG = '<script type="application/json">{"position":"top"}</script>';
const HTML = `<html><head>${CSS}${IFRAME_CSS}</head><body><div id="branch-banner"></div>${JS}${JSON_TAG}</body></html>`;

describe('journeys/template', () => {
  it('extracts metadata, css, iframe css and js', () => {
    expect(getMetadata(HTML)).toEqual({ position: 'top' });
    expect(getCss(HTML)).toBe('#branch-banner{color:red}');
    expect(getIframeCss(HTML)).toBe('#branch-banner-iframe{border:0}');
    expect(getJs(HTML)).toBe('var a = 1;');
  });

  it('returns undefined for missing blocks', () => {
    expect(getMetadata('<div></div>')).toBeUndefined();
    expect(getCss('<div></div>')).toBeUndefined();
    expect(getIframeCss('<div></div>')).toBeUndefined();
    expect(getJs('<div></div>')).toBeUndefined();
  });

  it('throws on invalid metadata JSON', () => {
    expect(() =>
      getMetadata('<script type="application/json">{oops</script>'),
    ).toThrow();
  });

  it('removeScriptAndCss strips the four blocks and keeps the rest', () => {
    expect(removeScriptAndCss(HTML)).toBe(
      '<html><head></head><body><div id="branch-banner"></div></body></html>',
    );
  });

  it('getCtaText prefers has_app only when hasApp is true', () => {
    const metadata = { ctaText: { has_app: 'Open', no_app: 'Get' } };
    expect(getCtaText(metadata, true)).toBe('Open');
    expect(getCtaText(metadata, false)).toBe('Get');
    expect(getCtaText({ ctaText: { no_app: 'Get' } }, true)).toBe('Get');
    expect(getCtaText(undefined, true)).toBeUndefined();
  });
});
