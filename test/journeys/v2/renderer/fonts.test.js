import {
  ensureFonts,
  removeFonts,
} from '../../../../src/journeys/v2/renderer/fonts.js';

const view = { document, nonce: 'n0nce', platform: 'android' };
const ROBOTO = {
  family: 'Roboto',
  url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
};
const SATISFY = {
  family: 'Satisfy',
  url: 'https://fonts.googleapis.com/css2?family=Satisfy&display=swap',
};
const PLEX = {
  family: 'IBM Plex Sans',
  url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;700&display=swap',
};

function pageFonts(...families) {
  Object.defineProperty(document, 'fonts', {
    value: families.map((family) => ({ family })),
    configurable: true,
  });
}

const linkedHrefs = () =>
  Array.from(document.head.querySelectorAll('link')).map((l) =>
    l.getAttribute('href'),
  );

describe('journeys/v2 fonts', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    delete document.fonts;
  });

  it('adds one nonce-tagged stylesheet link per URL, never twice', () => {
    ensureFonts([ROBOTO], view);
    ensureFonts([ROBOTO], view);
    const links = document.head.querySelectorAll(
      'link[data-branch-journey-font]',
    );
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe(ROBOTO.url);
    expect(links[0].getAttribute('nonce')).toBe('n0nce');
  });

  it('skips a family the page already has when the URL names no weights', () => {
    pageFonts('"satisfy" ');
    ensureFonts([SATISFY, PLEX], view);
    expect(linkedHrefs()).toEqual([PLEX.url]);
  });

  it('still links a URL naming weights, which the same-named page family may lack', () => {
    pageFonts('Roboto');
    ensureFonts([ROBOTO], view);
    expect(linkedHrefs()).toEqual([ROBOTO.url]);
  });

  it('links a font the page lacks, matching whole family names only', () => {
    pageFonts('Roboto Slab');
    ensureFonts([ROBOTO], view);
    expect(linkedHrefs()).toEqual([ROBOTO.url]);
  });

  it('links two families sharing one URL once', () => {
    const url =
      'https://fonts.googleapis.com/css?family=Source+Sans+Pro|Open+Sans';
    ensureFonts(
      [
        { family: 'Source Sans Pro', url },
        { family: 'Open Sans', url },
      ],
      view,
    );
    expect(linkedHrefs()).toEqual([url]);
  });

  it('returns only the links it added, and removeFonts removes just those', () => {
    const own = document.createElement('link');
    own.rel = 'stylesheet';
    own.href = ROBOTO.url;
    document.head.appendChild(own);
    const added = ensureFonts([ROBOTO, PLEX], { document, nonce: 'n0nce' });
    expect(added.map((l) => l.getAttribute('href'))).toEqual([PLEX.url]);
    removeFonts(added);
    expect(linkedHrefs()).toEqual([ROBOTO.url]);
  });
});
