/**
 * Checks the public contract of the built dist/build.min.js that customers
 * load from the CDN (or require from npm). Run after `pnpm run build`.
 */
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const BUNDLE = readFileSync(
  process.env.BUNDLE_PATH || 'dist/build.min.js',
  'utf8',
);

// The script-tag loader from the README's Installation section.
const README_SNIPPET = readFileSync('README.md', 'utf8')
  .split('```html\n<script>\n')[1]
  .split('\n\n  branch.init')[0];

// Public methods of window.branch that customers rely on.
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

  it('keeps the same window.branch surface, own and inherited', function () {
    const window = load();
    const names = new Set();
    for (
      let o = window.branch;
      o && o !== window.Object.prototype;
      o = Object.getPrototypeOf(o)
    ) {
      for (const key of Object.getOwnPropertyNames(o)) {
        names.add(key);
      }
    }
    const surface = [...names]
      .sort()
      .map((key) => `${key}: ${typeof window.branch[key]}`);
    expect(surface).toEqual([
      '_api: function',
      // Per-instance SDK runtime state (src/core/context.ts).
      '_ctx: object',
      '_listeners: object',
      '_publishEvent: function',
      '_queue: function',
      '_referringLink: function',
      '_server: object',
      '_storage: object',
      '_windowRedirect: function',
      'addListener: function',
      'banner: function',
      'closeBanner: function',
      'closeJourney: function',
      'constructor: function',
      'crossPlatformIds: function',
      'data: function',
      'deepview: function',
      'deepviewCta: function',
      'disableTracking: function',
      'first: function',
      'getAPIUrl: function',
      'getBrowserFingerprintId: function',
      'init: function',
      'init_state: number',
      'init_state_fail_code: number',
      'init_state_fail_details: object',
      'lastAttributedTouchData: function',
      'link: function',
      'logEvent: function',
      'logout: function',
      'qrCode: function',
      'referringLink: function',
      'removeListener: function',
      'renderFinalize: function',
      'renderQueue: function',
      'requestMetadata: object',
      'sdk: string',
      'setAPIResponseCallback: function',
      'setAPIUrl: function',
      'setBranchViewData: function',
      'setDMAParamsForEEA: function',
      'setIdentity: function',
      'setRequestMetaData: function',
      'track: function',
      'trackCommerceEvent: function',
    ]);
  });

  it('keeps window.branch.constructor callable with and without new', function () {
    const window = load();
    const Ctor = window.branch.constructor;

    // Without `new`: returns one shared default instance, separate from
    // window.branch (the pre-class constructor function did this).
    const shared = Ctor();
    expect(shared).not.toBe(window.branch);
    expect(Ctor()).toBe(shared);
    expect(typeof shared.init).toBe('function');

    // With `new`: a fresh instance every time.
    const fresh = new Ctor();
    expect(fresh).not.toBe(window.branch);
    expect(fresh).not.toBe(shared);
    expect(fresh instanceof Ctor).toBe(true);
    expect(window.branch instanceof Ctor).toBe(true);
    expect(Object.keys(Object.getPrototypeOf(window.branch))).not.toContain(
      'constructor',
    );
  });

  it('re-initializes `this` in place when window.branch.constructor gets an instance', function () {
    const window = load();
    const branch = window.branch;
    branch.setAPIUrl('https://api.example.com');
    branch.addListener('evt', function () {});
    const queue = branch._queue;

    // Called as a method, the pre-class constructor reset window.branch itself.
    expect(branch.constructor()).toBeUndefined();
    expect(window.branch).toBe(branch);
    expect(branch._queue).not.toBe(queue);
    expect(branch._listeners).toEqual([]);
    expect(branch.init_state).toBe(0);
  });

  it('supports ES5 subclassing through window.branch.constructor', function () {
    const window = load();
    const Base = window.branch.constructor;
    function Sub() {
      Base.call(this);
    }
    Sub.prototype = Object.create(Base.prototype);

    const sub = new Sub();
    expect(sub instanceof Base).toBe(true);
    expect(Object.keys(sub)).toEqual(Object.keys(new Base()));
    expect(typeof sub._queue).toBe('function');
    expect(() => sub.link({}, function () {})).not.toThrow();
  });

  it('replays calls queued by the on-page snippet', function () {
    const window = load(function (w) {
      w.branch = { _q: [['setAPIUrl', ['https://api.example.com']]], _v: 1 };
    });
    expect(window.branch._q).toBeUndefined();
    expect(window.branch.getAPIUrl()).toBe('https://api.example.com');
  });

  it('runs the documented loader snippet before the SDK loads', function () {
    const window = load(function (w) {
      // The snippet inserts the SDK before the first script on the page (its own).
      w.document.head.appendChild(w.document.createElement('script'));
      w.eval(README_SNIPPET);
      // Stubs exist for every method, so early calls queue instead of throwing.
      w.branch.referringLink();
      w.branch.setAPIUrl('https://api.example.com');
    });
    expect(window.branch._q).toBeUndefined();
    expect(window.branch.getAPIUrl()).toBe('https://api.example.com');
  });

  it('stubs every public method in each copy of the loader snippet', function () {
    // The SDK calls these on itself; pages never need to queue them.
    const internal = ['renderFinalize', 'renderQueue'];
    const expected = PUBLIC_METHODS.filter((m) => !internal.includes(m)).sort();
    const onpage = readFileSync('src/snippet/onpage.js', 'utf8')
      .match(/\[\s*('[\w]+',\s*)+\]/)[0]
      .match(/[\w]+/g);
    const snippetMethods = (html) =>
      html.match(/"([\w ]+)"\.split\(" "\)/)[1].split(' ');

    expect(onpage.sort()).toEqual(expected);
    expect(snippetMethods(README_SNIPPET).sort()).toEqual(expected);
    expect(
      snippetMethods(
        readFileSync('examples/example.template.html', 'utf8'),
      ).sort(),
    ).toEqual(expected);
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
