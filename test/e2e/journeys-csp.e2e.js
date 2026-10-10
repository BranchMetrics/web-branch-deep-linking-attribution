import { expect, test } from '@playwright/test';
import { CTA_URL, TEMPLATES } from './fixtures/templates.js';
import { inJourney, openShop } from './shop.js';

const NONCE = 'e2eN0nce';
const CSP = [
  "default-src 'none'",
  `script-src 'nonce-${NONCE}' https://cdn.branch.io https://app.link`,
  `style-src 'nonce-${NONCE}'`,
  'img-src https: data:',
  'connect-src https://api2.branch.io',
  'font-src https:',
].join('; ');

test.beforeEach(async ({ page }) => {
  // Init scripts aren't subject to the page's CSP.
  await page.addInitScript(() => {
    window.__violations = [];
    document.addEventListener(
      'securitypolicyviolation',
      (e) =>
        window.__violations.push(`${e.effectiveDirective} ${e.blockedURI}`),
      true,
    );
  });
});

const violations = (page) => page.evaluate(() => window.__violations);

function templateFor(testInfo) {
  return testInfo.project.use.isMobile
    ? TEMPLATES['top-banner']
    : TEMPLATES['desktop-corner-card'];
}

test('renders, styled, under a strict CSP when given the nonce', async ({
  page,
}, testInfo) => {
  const template = templateFor(testInfo);
  const { requests } = await openShop(page, {
    template,
    csp: CSP,
    nonce: NONCE,
    initOptions: { nonce: NONCE },
  });
  // Only styled if the shadow root's <style> was allowed.
  await expect(inJourney(page, '#branch-mobile-action')).toHaveCSS(
    'background-color',
    'rgb(88, 13, 181)',
  );
  expect(await violations(page)).toEqual([]);

  await inJourney(page, '.branch-banner-close').click();
  await expect(page.locator('#branch-journey-host')).not.toBeAttached();
  expect(requests).toContain('/v1/dismiss');
  expect(await violations(page)).toEqual([]);
});

test('runs the CTA script under a strict CSP when given the nonce', async ({
  page,
}, testInfo) => {
  const template = templateFor(testInfo);
  await openShop(page, {
    template,
    csp: CSP,
    nonce: NONCE,
    initOptions: { nonce: NONCE },
  });
  await Promise.all([
    page.waitForURL(`${CTA_URL}**`),
    inJourney(page, '#branch-mobile-action').click(),
  ]);
});

// Proves the listener works, so the empty lists above mean something.
test('reports blocked styles when the nonce is missing', async ({
  page,
}, testInfo) => {
  const template = templateFor(testInfo);
  await openShop(page, {
    template,
    csp: CSP,
    nonce: NONCE,
    waitForShown: false,
  });
  await expect
    .poll(async () => (await violations(page)).join('\n'))
    .toContain('style-src');
});
