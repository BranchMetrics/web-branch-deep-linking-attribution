/**
 * Checks the public contract of the built dist/build.min.js that customers
 * load from the CDN (or require from npm). Run after `npm run build`.
 */
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const BUNDLE = readFileSync(
  process.env.BUNDLE_PATH || 'dist/build.min.js',
  'utf8',
);

// Public methods of window.branch in the last Closure-compiled release.
const PUBLIC_METHODS = [
  'addListener',
  'banner',
  'closeBanner',
  'closeJourney',
  'crossPlatformIds',
  'data',
  'deepview',
  'deepviewCta',
  'disableTracking',
  'first',
  'getAPIUrl',
  'getBrowserFingerprintId',
  'init',
  'lastAttributedTouchData',
  'link',
  'logEvent',
  'logout',
  'qrCode',
  'referringLink',
  'removeListener',
  'renderFinalize',
  'renderQueue',
  'setAPIResponseCallback',
  'setAPIUrl',
  'setBranchViewData',
  'setDMAParamsForEEA',
  'setIdentity',
  'setRequestMetaData',
  'track',
  'trackCommerceEvent',
];

function load(prepare) {
  const { window } = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only',
    url: 'https://example.com/',
  });
  if (prepare) {
    prepare(window);
  }
  window.eval(BUNDLE);
  return window;
}

describe('dist/build.min.js contract', function () {
  it('exposes window.branch with every public method', function () {
    const window = load();
    for (const name of PUBLIC_METHODS) {
      expect(typeof window.branch[name], name).toBe('function');
    }
  });

  it('replays calls queued by the on-page snippet', function () {
    const window = load(function (w) {
      w.branch = { _q: [['setAPIUrl', ['https://api.example.com']]], _v: 1 };
    });
    expect(window.branch._q).toBeUndefined();
    expect(window.branch.getAPIUrl()).toBe('https://api.example.com');
  });

  it('registers as the named AMD module "branch"', function () {
    let registered;
    const window = load(function (w) {
      w.define = function (id, factory) {
        registered = { id, value: factory() };
      };
      w.define.amd = {};
    });
    expect(registered.id).toBe('branch');
    expect(registered.value).toBe(window.branch);
  });

  it('names the AMD module with a plain string literal', function () {
    // webpack ignores define(`branch`, ...) as an AMD call and replaces
    // `define` with a stub that throws when the SDK loads.
    expect(BUNDLE).toContain('define("branch",');
    expect(BUNDLE).not.toContain('define(`branch`');
  });

  it('polyfills Array.prototype.includes only when it is missing', function () {
    const native = load().Array.prototype.includes;
    expect(native.toString()).toContain('[native code]');

    const window = load(function (w) {
      delete w.Array.prototype.includes;
    });
    const proto = window.Array.prototype;
    expect(Object.keys(proto)).not.toContain('includes');
    expect(window.eval('[1, NaN].includes(NaN)')).toBe(true);
    expect(window.eval('[1, 2, 3].includes(1, -2)')).toBe(false);
    expect(window.eval("['other', 'desktop'].includes('ios')")).toBe(false);
  });

  it('assigns module.exports in CommonJS environments', function () {
    const window = load(function (w) {
      w.module = { exports: {} };
      w.exports = w.module.exports;
    });
    expect(window.module.exports).toBe(window.branch);
  });

  it('does not run in strict mode or leak other globals', function () {
    const blank = new JSDOM('', { runScripts: 'outside-only' }).window;
    const before = new Set(Object.keys(blank));
    const added = Object.keys(load()).filter((key) => !before.has(key));
    expect(BUNDLE.startsWith('"use strict"')).toBe(false);
    expect(added).toEqual(['branch']);
  });
});
