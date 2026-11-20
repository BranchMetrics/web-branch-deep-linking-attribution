import { cleanCreativeHtml } from '../../src/journeys/v2/renderer/sanitize.js';

// Real parsers and loaders: jsdom never fires onerror for a broken image.
describe('journeys/v2 cleanCreativeHtml in a real browser', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    delete window.__ranCreative;
  });

  it('neither parsing nor inserting the creative runs its handlers or URLs', async () => {
    window.__ranCreative = false;
    const run = 'window.__ranCreative = true';
    const fragment = cleanCreativeHtml(
      document,
      `<img id="i" src="x:broken" onerror="${run}">` +
        `<svg><a id="a" xlink:href="java&#9;script:${run}"><text>x</text></a>` +
        `<image href="x:broken" onerror="${run}"></image></svg>` +
        `<a id="h" href="\u0001 JaVaScRiPt:${run}">x</a>` +
        `<iframe src="javascript:parent.__ranCreative = true"></iframe>`,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    document.body.appendChild(fragment);
    document.getElementById('a').dispatchEvent(new MouseEvent('click'));
    document.getElementById('h').click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(window.__ranCreative).toBe(false);
    expect(document.getElementById('a').attributes).toHaveLength(1);
    expect(document.getElementById('h').hasAttribute('href')).toBe(false);
    expect(document.querySelector('iframe')).toBeNull();
  });
});
