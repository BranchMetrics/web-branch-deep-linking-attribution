import { expect, test } from '@playwright/test';
import { TEMPLATES } from './fixtures/templates.js';
import { inJourney, journeyEvents, openShop } from './shop.js';

// With the exit animation disabled, v2 removes the journey while the click is still
// bubbling through the page.

const TYPES = [
  'pointerdown',
  'touchstart',
  'pointerup',
  'touchend',
  'mousedown',
  'mouseup',
  'click',
  'focusin',
  'focusout',
];

function recordPageEvents(page) {
  return page.addInitScript((types) => {
    window.__pageSaw = [];
    window.__pageErrors = [];
    window.addEventListener('error', (e) =>
      window.__pageErrors.push(e.message),
    );
    for (const target of [window, document]) {
      for (const type of types) {
        target.addEventListener(type, (e) => {
          const t = e.target;
          window.__pageSaw.push({
            on: target === window ? 'window' : 'document',
            type,
            target: t?.id || t?.nodeName,
            connected: t?.isConnected ?? null,
          });
          // As outside-click handlers do; none may throw on a detached target.
          if (type === 'click' && t?.nodeType === 1) {
            const menu = document.querySelector('header');
            menu.contains(t);
            t.closest('a, button, [role="button"]');
            t.getBoundingClientRect();
            t.matches('.x');
            for (let n = t; n; n = n.parentNode) {}
          }
        });
      }
    }
  }, TYPES);
}

async function closeAndRecord(page, testInfo, exitDisabled) {
  await recordPageEvents(page);
  await openShop(page, {
    template: testInfo.project.use.isMobile
      ? TEMPLATES['top-banner']
      : TEMPLATES['desktop-corner-card'],
    initOptions: { disable_exit_animation: exitDisabled },
  });
  await page.evaluate(() => {
    window.__pageSaw = [];
  });
  const close = inJourney(page, '.branch-banner-close');
  await (testInfo.project.use.hasTouch ? close.tap() : close.click());
  await expect.poll(() => journeyEvents(page)).toContain('didCloseJourney');
  await expect(page.locator('#branch-journey-host')).not.toBeAttached();
  return page.evaluate(() => ({
    saw: window.__pageSaw,
    errors: window.__pageErrors,
    focused: document.activeElement?.nodeName,
  }));
}

test('page listeners see a close the same whether or not the exit animates', async ({
  browser,
}, testInfo) => {
  const { defaultBrowserType, trace, ...device } = testInfo.project.use;
  const run = async (exitDisabled) => {
    const context = await browser.newContext(device);
    try {
      return await closeAndRecord(
        await context.newPage(),
        testInfo,
        exitDisabled,
      );
    } finally {
      await context.close();
    }
  };
  const animated = await run(false);
  const instant = await run(true);

  expect(instant.errors).toEqual([]);
  expect(animated.errors).toEqual([]);
  expect(instant.focused).toBe(animated.focused);
  // The click finds the host detached, and Chromium fires focusout before it, not after.
  const withoutConnected = ({ saw }) => saw.map(({ connected, ...e }) => e);
  const withoutFocusout = (r) =>
    withoutConnected(r).filter((e) => e.type !== 'focusout');
  const focusouts = (r) =>
    withoutConnected(r).filter((e) => e.type === 'focusout');
  expect(withoutFocusout(instant)).toEqual(withoutFocusout(animated));
  expect(focusouts(instant)).toEqual(focusouts(animated));
  expect(withoutConnected(instant)).toContainEqual({
    on: 'document',
    type: 'click',
    target: 'branch-journey-host',
  });
  const detached = (r) =>
    r.saw.filter((e) => e.connected === false).map((e) => e.type);
  expect(detached(animated)).toEqual([]);
  expect(new Set(detached(instant))).toEqual(new Set(['click']));
});
