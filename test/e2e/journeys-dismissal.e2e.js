import { expect, test } from '@playwright/test';
import { TEMPLATES } from './fixtures/templates.js';
import { inJourney, journeyEvents, openShop } from './shop.js';

const TOP = TEMPLATES['top-banner'];

const DISMISSED_FOREVER = {
  ...TOP,
  html: (callback) =>
    TOP.html(callback).replace(
      '"position":"top"',
      '"position":"top","globalDismissPeriod":-1',
    ),
};

test.describe('@mobile', () => {
  test('a journey closed for good stays closed after a reload, though the server sends it again', async ({
    page,
  }) => {
    const { requests } = await openShop(page, { template: DISMISSED_FOREVER });
    await inJourney(page, '.branch-banner-close').click();
    await expect(page.locator('#branch-journey-host')).not.toBeAttached();

    await page.reload();
    await page.waitForFunction(() =>
      window.__journey.includes('willNotShowJourney'),
    );
    expect(requests.filter((path) => path === '/v1/pageview')).toHaveLength(2);
    expect(await journeyEvents(page)).not.toContain('didShowJourney');
    await expect(page.locator('#branch-journey-host')).not.toBeAttached();
  });

  test('the pageview after a reload tells the server which journey was closed', async ({
    page,
  }) => {
    await openShop(page, { template: TOP });
    await inJourney(page, '.branch-banner-close').click();
    await expect(page.locator('#branch-journey-host')).not.toBeAttached();

    const [pageview] = await Promise.all([
      page.waitForRequest((request) => request.url().endsWith('/v1/pageview')),
      page.reload(),
    ]);
    const sent = new URLSearchParams(pageview.postData() || '').get(
      'journey_dismissals',
    );
    expect(Object.values(JSON.parse(sent))).toEqual([
      expect.objectContaining({ view_id: 'e2e' }),
    ]);
  });
});
