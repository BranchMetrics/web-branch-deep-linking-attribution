import { expect, test } from '@playwright/test';
import { TEMPLATES } from './fixtures/templates.js';
import { journeyEventTimes, openShop } from './shop.js';

// The backend's animations last 0.25s; the margin covers a loaded CI machine.
const DURATION_MS = 250;
const SLACK_MS = 150;

async function timings(browser, testInfo, template, v2) {
  const { defaultBrowserType, trace, ...device } = testInfo.project.use;
  const context = await browser.newContext(device);
  try {
    const page = await context.newPage();
    await openShop(page, { template, v2 });
    await page.evaluate(() => window.branch.closeJourney());
    await page.waitForFunction(() => window.__journeyAt.didCloseJourney);
    const at = await journeyEventTimes(page);
    return {
      enter: at.didShowJourney - at.willShowJourney,
      exit: at.didCloseJourney - at.willCloseJourney,
    };
  } finally {
    await context.close();
  }
}

for (const [name, template] of Object.entries(TEMPLATES)) {
  test(`${name} animates in and out @${template.device}`, async ({
    browser,
  }, testInfo) => {
    const v1 = await timings(browser, testInfo, template, false);
    const v2 = await timings(browser, testInfo, template, true);
    // Documented as firing once the entrance completes; v1 fires as it starts.
    expect(v2.enter, 'v2 entrance ms').toBeGreaterThanOrEqual(DURATION_MS - 30);
    expect(v2.enter, 'v2 entrance ms').toBeLessThan(DURATION_MS + SLACK_MS);
    expect(Math.abs(v2.exit - v1.exit), 'exit ms vs v1').toBeLessThan(SLACK_MS);
  });
}
