import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';
import { TEMPLATES } from './fixtures/templates.js';
import { inJourney, openShop } from './shop.js';

// Per channel, to absorb anti-aliasing between the iframe and shadow DOM paths.
const CHANNEL_TOLERANCE = 40;
// Of the creative's area, not the screen's, so a small creative can't lose an icon.
const MAX_DIFF_RATIO = 0.01;

function diff(a, b) {
  const one = PNG.sync.read(a);
  const two = PNG.sync.read(b);
  expect([two.width, two.height]).toEqual([one.width, one.height]);
  const out = new PNG({ width: one.width, height: one.height });
  let changed = 0;
  for (let i = 0; i < one.data.length; i += 4) {
    const delta = Math.max(
      Math.abs(one.data[i] - two.data[i]),
      Math.abs(one.data[i + 1] - two.data[i + 1]),
      Math.abs(one.data[i + 2] - two.data[i + 2]),
    );
    const hit = delta > CHANNEL_TOLERANCE;
    changed += hit;
    out.data[i] = hit ? 255 : 128 + one.data[i] / 2;
    out.data[i + 1] = hit ? 0 : 128 + one.data[i + 1] / 2;
    out.data[i + 2] = hit ? 0 : 128 + one.data[i + 2] / 2;
    out.data[i + 3] = 255;
  }
  return { changed, image: PNG.sync.write(out) };
}

async function shot(page, template, v2) {
  await openShop(page, { template, v2 });
  const rendered = await page.evaluate(() =>
    document.getElementById('branch-journey-host') ? 'v2' : 'v1',
  );
  // A v2 fallback would compare v1 with itself.
  expect(rendered, 'renderer that drew the journey').toBe(v2 ? 'v2' : 'v1');
  await page.waitForLoadState('networkidle');
  return page.screenshot({ animations: 'disabled' });
}

async function creativeArea(page) {
  const { width, height } = await inJourney(
    page,
    '#branch-banner',
  ).boundingBox();
  const dpr = await page.evaluate(() => devicePixelRatio);
  return width * height * dpr * dpr;
}

for (const [name, template] of Object.entries(TEMPLATES)) {
  test(`${name} looks the same in v2 as in v1 @${template.device}`, async ({
    browser,
  }, testInfo) => {
    // Separate contexts, so neither run sees the other's storage.
    const { defaultBrowserType, trace, ...device } = testInfo.project.use;
    const contexts = await Promise.all(
      [0, 1].map(() => browser.newContext(device)),
    );
    try {
      const [v1Page, v2Page] = await Promise.all(
        contexts.map((context) => context.newPage()),
      );
      const v1 = await shot(v1Page, template, false);
      const v2 = await shot(v2Page, template, true);
      const { changed, image } = diff(v1, v2);
      for (const [label, body] of [
        ['v1', v1],
        ['v2', v2],
        ['diff', image],
      ]) {
        const path = testInfo.outputPath(`${label}.png`);
        writeFileSync(path, body);
        await testInfo.attach(label, { path, contentType: 'image/png' });
      }
      const ratio = changed / (await creativeArea(v2Page));
      expect(
        ratio,
        `differing pixels per creative pixel (${name})`,
      ).toBeLessThan(template.allowedDiff ?? MAX_DIFF_RATIO);
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
    }
  });
}
