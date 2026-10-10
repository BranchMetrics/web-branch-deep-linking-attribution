import { expect, test } from '@playwright/test';
import { CTA_URL, TEMPLATES } from './fixtures/templates.js';
import { inJourney, journeyEvents, openShop } from './shop.js';

const host = (page) => page.locator('#branch-journey-host');
const box = (locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  });
const viewport = (page) =>
  page.evaluate(() => ({ width: innerWidth, height: innerHeight }));

test.describe('@mobile', () => {
  test('a tap on the CTA opens the link', async ({ page }) => {
    await openShop(page, { template: TEMPLATES['top-banner'] });
    await Promise.all([
      page.waitForURL(`${CTA_URL}**`),
      inJourney(page, '#branch-mobile-action').tap(),
    ]);
  });

  test('a tap on close dismisses it and gives the page its space back', async ({
    page,
  }) => {
    const { requests } = await openShop(page, {
      template: TEMPLATES['top-banner'],
    });
    const header = page.locator('header');
    await expect.poll(async () => (await box(header)).top).toBe(76);
    await inJourney(page, '.branch-banner-close').tap();
    await expect(host(page)).not.toBeAttached();
    await expect.poll(async () => (await box(header)).top).toBe(0);
    expect(requests).toContain('/v1/dismiss');
  });

  test('a top banner spans the width and pushes the page by its height, also after rotating', async ({
    page,
  }) => {
    await openShop(page, { template: TEMPLATES['top-banner'] });
    const banner = inJourney(page, '#branch-banner');
    const header = page.locator('header');
    for (const rotate of [false, true]) {
      if (rotate) {
        const { width, height } = await viewport(page);
        await page.setViewportSize({ width: height, height: width });
      }
      const { width } = await viewport(page);
      await expect.poll(async () => (await box(banner)).width).toBe(width);
      const { height } = await box(banner);
      await expect.poll(async () => (await box(header)).top).toBe(height);
    }
  });

  test('a floating button stays at its offset while the page scrolls', async ({
    page,
  }) => {
    await openShop(page, { template: TEMPLATES['floating-button'] });
    const banner = inJourney(page, '#branch-banner');
    await page.evaluate(() => window.scrollTo(0, 800));
    const { height } = await viewport(page);
    await expect.poll(async () => (await box(banner)).bottom).toBe(height - 24);
  });

  test('a full-page journey stops the page scrolling until it closes', async ({
    page,
    browserName,
  }) => {
    // The browser suite covers the lock in WebKit with a real wheel.
    test.skip(
      browserName === 'webkit',
      'Playwright has no wheel or touch scrolling in mobile WebKit',
    );
    await openShop(page, { template: TEMPLATES['full-page'] });
    const swipeUp = async () => {
      const { width, height } = await viewport(page);
      await page.mouse.move(width / 2, height / 2);
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(200);
    };
    await swipeUp();
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await inJourney(page, '.branch-banner-close').tap();
    await expect(host(page)).not.toBeAttached();
    await swipeUp();
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  });

  for (const v2 of [false, true]) {
    test(`a top banner pushes down a fixed nav holding the injector, until it closes (${v2 ? 'v2' : 'v1'})`, async ({
      page,
    }) => {
      await openShop(page, {
        template: TEMPLATES['top-banner'],
        v2,
        fixedNav: true,
      });
      const header = page.locator('header');
      await expect.poll(async () => (await box(header)).top).toBe(76);
      await page.evaluate(() => window.branch.closeJourney());
      await expect.poll(() => journeyEvents(page)).toContain('didCloseJourney');
      await expect.poll(async () => (await box(header)).top).toBe(0);
    });

    test(`a tap on the backdrop closes a center modal (${v2 ? 'v2' : 'v1'})`, async ({
      page,
    }) => {
      const { requests } = await openShop(page, {
        template: TEMPLATES['center-modal'],
        v2,
      });
      await page.touchscreen.tap(10, 10);
      await expect.poll(() => journeyEvents(page)).toContain('didCloseJourney');
      expect(requests).toContain('/v1/dismiss');
    });
  }
});
