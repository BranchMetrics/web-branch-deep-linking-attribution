import {
  ensureFonts,
  fontFamilies,
  removeFonts,
} from '../../../../src/journeys/v2/renderer/fonts.js';

const view = { document, nonce: 'n0nce', platform: 'android' };
const ROBOTO =
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
const PLEX =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;700&display=swap';

describe('journeys/v2 fonts', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    delete document.fonts;
  });

  it('reads family names, and whether they name variants, from Google Fonts URLs', () => {
    expect(fontFamilies(PLEX)).toEqual([
      { name: 'IBM Plex Sans', variants: true },
    ]);
    expect(fontFamilies('not a url')).toEqual([]);
    // The css (v1) API, which Branch's custom-font docs use, separates families with |.
    expect(
      fontFamilies(
        'https://fonts.googleapis.com/css?family=Source+Sans+Pro:600,900|Open+Sans',
      ),
    ).toEqual([
      { name: 'Source Sans Pro', variants: true },
      { name: 'Open Sans', variants: false },
    ]);
  });

  it('adds one nonce-tagged stylesheet link per URL, never twice', () => {
    ensureFonts([ROBOTO], view);
    ensureFonts([ROBOTO], view);
    const links = document.head.querySelectorAll(
      'link[data-branch-journey-font]',
    );
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe(ROBOTO);
    expect(links[0].getAttribute('nonce')).toBe('n0nce');
  });

  it('skips a bare family the page already declares, never one with variants', () => {
    Object.defineProperty(document, 'fonts', {
      value: [{ family: '"Roboto"' }],
      configurable: true,
    });
    const bare = 'https://fonts.googleapis.com/css2?family=Roboto&display=swap';
    ensureFonts([bare, ROBOTO, PLEX], view);
    const hrefs = Array.from(document.head.querySelectorAll('link')).map((l) =>
      l.getAttribute('href'),
    );
    // The page's Roboto may lack the 500 and 700 that ROBOTO asks for.
    expect(hrefs).toEqual([ROBOTO, PLEX]);
  });

  it('returns only the links it added, and removeFonts removes just those', () => {
    const own = document.createElement('link');
    own.rel = 'stylesheet';
    own.href = ROBOTO;
    document.head.appendChild(own);
    const added = ensureFonts([ROBOTO, PLEX], { document, nonce: 'n0nce' });
    expect(added.map((l) => l.getAttribute('href'))).toEqual([PLEX]);
    removeFonts(added);
    const hrefs = Array.from(document.head.querySelectorAll('link')).map((l) =>
      l.getAttribute('href'),
    );
    expect(hrefs).toEqual([ROBOTO]);
  });
});
