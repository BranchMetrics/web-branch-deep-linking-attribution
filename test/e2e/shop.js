import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { API, BFP, KEY } from '../behavior/fixtures.js';
import { CTA_URL } from './fixtures/templates.js';

// A customer page loading the built SDK, with every request answered locally.

const SHOP = 'https://shop.example.test/';
const SDK_URL = 'https://cdn.branch.io/branch-latest.min.js';
const SDK = readFileSync('dist/build.min.js', 'utf8');

function solidPng(width, height, [r, g, b]) {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = 255;
  }
  return PNG.sync.write(png);
}
const IMAGE = solidPng(64, 64, [234, 88, 12]);

const PAGE_CSS =
  'body { margin: 0; font: 16px/1.5 system-ui, sans-serif; color: #18181B; }' +
  'header { display: flex; align-items: center; height: 56px; padding: 0 16px; background: #0F172A; color: #fff; }' +
  'main { padding: 16px; } .hero { height: 180px; border-radius: 8px; background: #CBD5E1; }' +
  'p { margin: 12px 0; } .tall { height: 2000px; }' +
  '.fixed-nav header { position: fixed; top: 0; left: 0; right: 0; } .fixed-nav main { padding-top: 72px; }';

function shopHtml({ nonce, initOptions, fixedNav }) {
  const n = nonce ? ` nonce="${nonce}"` : '';
  return `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style${n}>${PAGE_CSS}</style>
<script${n} src="${SDK_URL}"></script>
<script${n}>
  window.__journey = [];
  window.__journeyAt = {};
  branch.addListener(function (event) {
    window.__journey.push(event);
    window.__journeyAt[event] = performance.now();
  });
  branch.init(${JSON.stringify(KEY)}, ${JSON.stringify(initOptions)});
</script>
</head><body${fixedNav ? ' class="fixed-nav"' : ''}>
<header>Shop${fixedNav ? '<div class="branch-journeys-top"></div>' : ''}</header>
<main><div class="hero"></div>
<p>Free shipping on orders over $50. Browse new arrivals in every category.</p>
<p>Members get early access to sales and exclusive offers.</p>
<div class="tall"></div></main>
</body></html>`;
}

const json = (body) => ({
  status: 200,
  contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*' },
  body: JSON.stringify(body),
});

// Resolves to the Branch API paths requested; the array keeps filling. `nonce` is for
// the page's own tags (init needs it separately); `fixedNav` adds a fixed header
// holding the templates' injector.
export async function openShop(
  page,
  {
    template,
    v2 = true,
    csp,
    nonce,
    initOptions = {},
    fixedNav = false,
    waitForShown = true,
  },
) {
  const requests = [];
  // Last registered wins, so the catch-all goes first.
  await page.route('**/*', (route) => route.abort());
  await page.route(`${SHOP}**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      headers: csp ? { 'content-security-policy': csp } : {},
      body: shopHtml({ nonce, initOptions, fixedNav }),
    }),
  );
  await page.route('https://cdn.branch.io/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: IMAGE }),
  );
  await page.route(SDK_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: SDK,
    }),
  );
  await page.route('https://app.link/_r**', (route) => {
    const callback = new URL(route.request().url()).searchParams.get(
      'callback',
    );
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `${callback}(${JSON.stringify(BFP)});`,
    });
  });
  await page.route('https://api2.branch.io/**', (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = new URLSearchParams(request.postData() || '');
    requests.push(path);
    if (path === '/v1/open') {
      return route.fulfill(json(API.openBody()));
    }
    if (path === '/v1/pageview') {
      return route.fulfill(
        json({
          branch_view_enabled: true,
          use_v2_renderer: v2,
          template: template.html(body.get('callback_string')),
          animationConfig: template.animation,
          event_data: { branch_view_data: { id: 'e2e' } },
          journey_link_data: {
            type: template.device,
            url: 'https://bnc.lt/j/e2e',
          },
        }),
      );
    }
    return route.fulfill(json({}));
  });
  await page.route(`${new URL(CTA_URL).origin}/**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<p>app link</p>',
    }),
  );

  await page.goto(SHOP);
  if (waitForShown) {
    await page.waitForFunction(() =>
      window.__journey.includes('didShowJourney'),
    );
  }
  return { requests };
}

// Playwright's CSS engine pierces open shadow roots.
export const inJourney = (page, selector) =>
  page.locator(`#branch-journey-host ${selector}`);

export const journeyEvents = (page) => page.evaluate(() => window.__journey);

export const journeyEventTimes = (page) =>
  page.evaluate(() => window.__journeyAt);
