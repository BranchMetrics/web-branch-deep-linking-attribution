import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect } from '@playwright/test';
import { DEVICES, fixtureName, NO_BANNER } from './config.mjs';
import { DUMMY_KEY, DUMMY_VIEW_ID } from './scrub.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SDK = resolve(HERE, '../../dist/build.min.js');

// Served by page.route. setAPIUrl rejects `localhost`.
export const ORIGIN = 'http://127.0.0.1';
export const ASSET_BASE = '__ASSET_BASE__';

export const isText = (contentType) =>
  /text|css|svg|json|javascript/.test(contentType);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
};

// Most specific first; with none visible, closeJourney() is used.
const CLOSE_SELECTORS = [
  '#branch-banner-close',
  '.branch-banner-close',
  '[aria-label="Close"]',
  '.branch-banner-continue',
  '.branch-banner-dismiss-background',
];

const QUIET_MS = 1000;
const TIMEOUT_MS = 10000;

function loadFixture(name) {
  const file = join(HERE, 'fixtures', `${name}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

// Chrome's CLS session windows: shifts <1s apart, window capped at 5s.
function sessionWindowCls(shifts) {
  let max = 0;
  let current = 0;
  let windowStart = 0;
  let previous = 0;
  for (const s of shifts) {
    if (current && s.t - previous < 1000 && s.t - windowStart < 5000) {
      current += s.value;
    } else {
      current = s.value;
      windowStart = s.t;
    }
    previous = s.t;
    max = Math.max(max, current);
  }
  return max;
}

function serveLocal(route, url, fixture, problems) {
  const parts = url.pathname.split('/').filter(Boolean);
  const reply = (contentType, body, status = 200) =>
    route.fulfill({ status, contentType, body });

  if (parts[0] === 'hosts') {
    const file = join(HERE, 'hosts', parts[1] || '');
    if (!existsSync(file)) return reply('text/plain', 'not found', 404);
    return reply(CONTENT_TYPES[extname(file)], readFileSync(file));
  }
  if (url.pathname === '/dist/build.min.js')
    return reply('application/javascript', readFileSync(SDK));

  const key = parts.slice(2).join('/');
  const relink = (text) =>
    text.split(ASSET_BASE).join(`${ORIGIN}/mock-assets/${parts[1]}`);
  const asset = parts[0] === 'mock-assets' && fixture?.assets[key];
  if (asset) {
    const body = Buffer.from(asset.body, 'base64');
    return reply(
      asset.contentType,
      isText(asset.contentType) ? relink(body.toString('utf8')) : body,
    );
  }
  const response = parts[0] === 'mock-api' && fixture?.api[`/${key}`];
  if (response)
    return reply(response.contentType, relink(response.body), response.status);
  problems.push(`unrecorded request: ${url.href}`);
  return reply('text/plain', 'no recording', 404);
}

// JSONP callback names differ per run.
function replayService(route, url, fixture, problems) {
  const service = fixture?.services[url.origin + url.pathname];
  if (!service) {
    problems.push(`external request: ${url.href}`);
    return route.abort();
  }
  const callback = url.searchParams.get('callback');
  return route.fulfill({
    status: service.status,
    contentType: service.contentType,
    body: callback
      ? service.body.replace(/branch_callback__\d+/, callback)
      : service.body,
  });
}

export const test = base.extend({
  device: [null, { option: true }],

  branch: async ({ page, device }, use) => {
    const problems = [];
    let fixture = null;
    let live = null;
    let closeAt = null;

    // Each load is a first visit, or a repeat load could skip the banner.
    // Top frame only: the banner iframe shares this origin's storage.
    await page.addInitScript(() => {
      if (window !== window.top) return;
      localStorage.clear();
      sessionStorage.clear();
    });

    page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') problems.push(`console error: ${m.text()}`);
    });
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin === ORIGIN)
        return serveLocal(route, url, fixture, problems);
      if (live) return route.continue();
      return replayService(route, url, fixture, problems);
    });

    const settle = async () => {
      const since = await page.evaluate(() => performance.now());
      await page.waitForFunction(
        ([since, quiet]) => {
          const last = window.__perf.shifts.at(-1)?.t ?? 0;
          return performance.now() - Math.max(since, last) >= quiet;
        },
        [since, QUIET_MS],
        { timeout: TIMEOUT_MS },
      );
    };

    const expectInitOk = async () =>
      expect(
        await page.evaluate(() => window.__perfSdk.initError),
        'SDK init error',
      ).toBeUndefined();

    await use({
      problems,

      async open(name, { live: liveApi = null, host = {} } = {}) {
        live = liveApi;
        closeAt = null;
        await page.context().clearCookies();
        const fixtureFile = fixtureName(name, device);
        if (!live) {
          fixture = loadFixture(fixtureFile);
          expect(fixture, `fixtures/${fixtureFile}.json`).not.toBeNull();
        }
        const query = new URLSearchParams({
          ...host,
          branch_api: live?.apiUrl ?? `${ORIGIN}/mock-api/${fixtureFile}`,
          branch_key: live?.branchKey ?? DUMMY_KEY,
        });
        if (name !== NO_BANNER)
          query.set('_branch_view_id', live?.viewId ?? DUMMY_VIEW_ID);
        await page.goto(`${ORIGIN}/hosts/article.html?${query}`);
        if (host.scroll)
          expect(await page.evaluate(() => window.scrollY), 'scrollY').toBe(
            Number(host.scroll),
          );
      },

      async waitForInit() {
        await page.waitForFunction(() => window.__perfSdk?.initAt, null, {
          timeout: TIMEOUT_MS,
        });
        await expectInitOk();
        await settle();
      },

      async waitForBanner() {
        await page.waitForFunction(
          () => window.__perfSdk?.shownAt || window.__perfSdk?.initError,
          null,
          { timeout: TIMEOUT_MS },
        );
        await expectInitOk();
        await settle();
      },

      // Measured on the content: center and corner templates draw a dialog
      // inside a viewport-sized iframe.
      async bannerBox() {
        return page.evaluate(() => {
          const iframe = document.getElementById('branch-banner-iframe');
          if (!iframe) return { position: null };
          const frame = iframe.getBoundingClientRect();
          const content = iframe.contentDocument
            ?.querySelector('.branch-banner-content')
            ?.getBoundingClientRect();
          const r = content
            ? {
                left: frame.left + content.left,
                top: frame.top + content.top,
                width: content.width,
                height: content.height,
              }
            : frame;
          const wide = r.width >= innerWidth * 0.9;
          const offCenter =
            Math.abs(r.left + r.width / 2 - innerWidth / 2) / innerWidth +
            Math.abs(r.top + r.height / 2 - innerHeight / 2) / innerHeight;
          let position = offCenter < 0.1 ? 'center' : 'corner';
          if (wide && r.height >= innerHeight * 0.9) position = 'full page';
          else if (wide)
            position =
              r.top + r.height / 2 < innerHeight / 2 ? 'top' : 'bottom';
          return {
            position,
            width: Math.round(r.width),
            height: Math.round(r.height),
          };
        });
      },

      async closeBanner() {
        const frame = page.frameLocator('#branch-banner-iframe');
        let closedBy = 'closeJourney()';
        closeAt = await page.evaluate(() => performance.now());
        for (const selector of CLOSE_SELECTORS) {
          const target = frame.locator(selector).first();
          if (!(await target.isVisible().catch(() => false))) continue;
          // Tap outside the dialog.
          const options = selector.includes('background')
            ? { position: { x: 4, y: 4 } }
            : {};
          // Shifts after real input don't count, so use the device's input.
          await (DEVICES[device].hasTouch
            ? target.tap(options)
            : target.click(options));
          closedBy = selector;
          break;
        }
        if (closedBy === 'closeJourney()')
          await page.evaluate(() => window.branch.closeJourney());
        await page.waitForFunction(() => window.__perfSdk.closedAt, null, {
          timeout: TIMEOUT_MS,
        });
        await settle();
        return closedBy;
      },

      async layoutShifts() {
        const { shifts } = await page.evaluate(() => window.__perf);
        const counted = shifts.filter((s) => !s.input);
        const largest = counted.reduce(
          (a, s) => (s.value > (a?.value ?? 0) ? s : a),
          null,
        );
        // CLS only keeps the worst session window, so a shift after closing
        // no bigger than the entrance would not move it. Counted on its own.
        const afterClose =
          closeAt === null
            ? 0
            : sessionWindowCls(counted.filter((s) => s.t >= closeAt));
        return {
          cls: sessionWindowCls(counted),
          afterClose,
          target: largest?.target ?? null,
        };
      },
    });

    expect(problems, 'page errors or unrecorded requests').toEqual([]);
  },
});

export { expect };
