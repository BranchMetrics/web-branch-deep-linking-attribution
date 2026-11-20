import { render } from '../../src/journeys/v2/renderer/index.js';

// Every server fixture renders a visible banner in Chromium, Firefox and WebKit.

const DIR = '../journeys/v2/fixtures/server-payload/';
const FIXTURES = import.meta.glob(
  '../journeys/v2/fixtures/server-payload/*.render-payload.json',
  { import: 'default', eager: true },
);

let journey = null;

afterEach(() => {
  journey?.discard();
  journey = null;
  document.body.innerHTML = '';
});

describe('server payload fixtures in a real browser', () => {
  it('has fixtures', () => {
    expect(Object.keys(FIXTURES).length).toBeGreaterThan(0);
  });

  for (const [path, fixture] of Object.entries(FIXTURES)) {
    const name = path.slice(DIR.length, -'.render-payload.json'.length);
    it(`${name} renders a visible banner`, async () => {
      await new Promise((resolve) => {
        journey = render(
          // Without the entrance, onShown fires at once and the box is final.
          {
            ...fixture.render,
            animation: { ...fixture.render.animation, css: '' },
          },
          {
            platform: 'android',
            onAction() {},
            onShown: resolve,
          },
        );
      });
      const banner = document
        .getElementById('branch-journey-host')
        .shadowRoot.getElementById('branch-banner');
      const box = banner.getBoundingClientRect();
      expect(box.width, `${name}: width`).toBeGreaterThan(0);
      expect(box.height, `${name}: height`).toBeGreaterThan(0);
      expect(journey.bannerHeight(), `${name}: bannerHeight()`).toBeGreaterThan(
        0,
      );
    });
  }
});
