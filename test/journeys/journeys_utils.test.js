import { createContext } from '../../src/core/context.js';
import { utils } from '../../src/core/utils.js';
import { setEnv } from '../../src/env/env.js';
import { journeys_utils } from '../../src/journeys/journeys_utils.js';
import { makeFakeEnv } from '../helpers/fake-env.js';

describe('getRelativeHeightValueOrFalseFromBannerHeight', function () {
  const assert = testUtils.unplanned();
  it('should return false when bannerHeight is in pixel values', function () {
    const bannerHeight = '350px';
    const expected = false;
    assert.strictEqual(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(
        bannerHeight,
      ),
      expected,
      'false when bannerHeight is pixels',
    );
  });

  it('should return the height value when bannerHeight is provided with viewHeight units - 100vh', function () {
    const bannerHeight = '100vh';
    const expected = '100';
    assert.strictEqual(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(
        bannerHeight,
      ),
      expected,
      '100 from bannerHeight of 100vh',
    );
  });

  it('should return the height value when bannerHeight is provided with viewHeight units - 99vh', function () {
    const bannerHeight = '99vh';
    const expected = '99';
    assert.strictEqual(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(
        bannerHeight,
      ),
      expected,
      '99 from bannerHeight of 99vh',
    );
  });

  it('should return the height value when bannerHeight is provided with viewHeight units - 5vh', function () {
    const bannerHeight = '5vh';
    const expected = '5';
    assert.strictEqual(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(
        bannerHeight,
      ),
      expected,
      '5 from bannerHeight of 5vh',
    );
  });

  it('should return the height value when bannerHeight is provided with percentage units - 100%', function () {
    const bannerHeight = '100%';
    const expected = '100';
    assert.strictEqual(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(
        bannerHeight,
      ),
      expected,
      '100 from bannerHeight of 100%',
    );
  });

  it('should return the height value when bannerHeight is provided with percentage units - 99%', function () {
    const bannerHeight = '99%';
    const expected = '99';
    assert.strictEqual(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(
        bannerHeight,
      ),
      expected,
      '99 from bannerHeight of 99%',
    );
  });

  it('should return the height value when bannerHeight is provided with percentage units - 5%', function () {
    const bannerHeight = '5%';
    const expected = '5';
    assert.strictEqual(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(
        bannerHeight,
      ),
      expected,
      '5 from bannerHeight of 5%',
    );
  });
});

describe('addIframeOuterCSS generated CSS (no BE-supplied cssIframeContainer)', function () {
  const assert = testUtils.unplanned();

  beforeEach(function () {
    journeys_utils.branch = { _ctx: createContext() };
  });

  afterEach(function () {
    const existing = document.getElementById('branch-iframe-css');
    if (existing?.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    document.body.removeAttribute('style');
  });

  it('should give body the same transition duration as the iframe', function () {
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';
    journeys_utils.isDesktopJourney = false;
    journeys_utils.entryAnimationDisabled = false;
    journeys_utils.animationSpeed = 200;
    journeys_utils.divToInjectParents = [];

    journeys_utils.addIframeOuterCSS(undefined, {});

    const expectedDurationSeconds = journeys_utils.animationSpeed / 1000;
    assert.strictEqual(
      document.body.style.transition,
      'all 0' + expectedDurationSeconds + 's ease',
    );

    const css = document.getElementById('branch-iframe-css').innerHTML;
    assert.ok(
      css.indexOf(
        'body { -webkit-transition: all ' +
          expectedDurationSeconds +
          's ease; }',
      ) !== -1,
      'body -webkit-transition duration should match the iframe duration',
    );
    assert.ok(
      css.indexOf(
        '-webkit-transition: all ' +
          expectedDurationSeconds +
          's ease; transition: all 0' +
          expectedDurationSeconds +
          's ease;',
      ) !== -1,
      'iframe rule should use the same duration as body',
    );
  });
});

describe('animateBannerExit margin/position restore timing', function () {
  const assert = testUtils.unplanned();
  let banner;

  beforeEach(function () {
    vi.useFakeTimers();
    banner = document.createElement('div');
    document.body.appendChild(banner);

    journeys_utils.branch = { _ctx: createContext(), _publishEvent: vi.fn() };
    journeys_utils.journeyLinkData = {};
    journeys_utils.divToInjectParents = [];
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';
    journeys_utils.bodyMarginTop = '10px';
    journeys_utils.exitAnimationDisabled = false;
    journeys_utils.entryAnimationDisabled = false;
    journeys_utils.animationSpeed = 250;
    journeys_utils.animationDelay = 20;
    journeys_utils.isSafeAreaEnabled = false;
    document.body.style.marginTop = '86px';
  });

  afterEach(function () {
    vi.useRealTimers();
    vi.restoreAllMocks();
    journeys_utils.exitAnimationIsRunning = false;
    if (banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
    document.body.removeAttribute('style');
    document.body.className = '';
  });

  it('restores body margin and banner position synchronously, before the delayed teardown', function () {
    journeys_utils.animateBannerExit(banner);

    // synchronous: happens immediately, not inside the delayed setTimeout
    assert.strictEqual(banner.style.top, '-' + journeys_utils.bannerHeight);
    assert.strictEqual(
      document.body.style.marginTop,
      journeys_utils.bodyMarginTop,
    );

    // teardown (removal) is still deferred at this point
    assert.strictEqual(document.body.contains(banner), true);

    vi.advanceTimersByTime(
      journeys_utils.animationSpeed + journeys_utils.animationDelay,
    );

    assert.strictEqual(document.body.contains(banner), false);
  });
});

describe('addIframeInnerCSS entrance and use_v2_renderer', function () {
  const assert = testUtils.unplanned();
  let iframe;

  beforeEach(function () {
    journeys_utils.branch = { _ctx: createContext() };
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';
    journeys_utils.isHalfPage = false;
    journeys_utils.isFullPage = false;
    journeys_utils.isDesktopJourney = false;
    journeys_utils.journeyVariant = null;
    journeys_utils.use_v2_renderer = false;

    iframe = journeys_utils.createIframe();
    document.body.appendChild(iframe);
    iframe.contentWindow.document.body.innerHTML =
      '<div id="branch-banner"><div class="branch-banner-content">hi</div></div>';
  });

  afterEach(function () {
    journeys_utils.use_v2_renderer = false;
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  });

  it('does not move the iframe when use_v2_renderer is true', function () {
    journeys_utils.use_v2_renderer = true;

    journeys_utils.addIframeInnerCSS(iframe, '');

    assert.strictEqual(iframe.style.top, '');
  });

  it('still moves the iframe when use_v2_renderer is false (legacy)', function () {
    journeys_utils.addIframeInnerCSS(iframe, '');

    assert.strictEqual(iframe.style.top, '-76px');
  });
});

describe('animateBannerExit branch-banner exit class and use_v2_renderer', function () {
  const assert = testUtils.unplanned();
  let banner;

  beforeEach(function () {
    vi.useFakeTimers();
    banner = document.createElement('iframe');
    document.body.appendChild(banner);

    journeys_utils.branch = { _ctx: createContext(), _publishEvent: vi.fn() };
    journeys_utils.journeyLinkData = {};
    journeys_utils.divToInjectParents = [];
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';
    journeys_utils.bodyMarginTop = '10px';
    journeys_utils.exitAnimationDisabled = false;
    journeys_utils.entryAnimationDisabled = false;
    journeys_utils.animationSpeed = 250;
    journeys_utils.animationDelay = 20;
    journeys_utils.isSafeAreaEnabled = false;
    journeys_utils.use_v2_renderer = false;
  });

  afterEach(function () {
    vi.useRealTimers();
    vi.restoreAllMocks();
    journeys_utils.use_v2_renderer = false;
    journeys_utils.exitAnimationIsRunning = false;
    if (banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
    document.body.removeAttribute('style');
    document.body.className = '';
  });

  it('adds branch-banner-exit to #branch-banner so any authored exit keyframes can play', function () {
    journeys_utils.use_v2_renderer = true;
    banner.contentWindow.document.body.innerHTML =
      '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    const bannerRoot =
      banner.contentWindow.document.getElementById('branch-banner');
    assert.strictEqual(
      bannerRoot.className.indexOf('branch-banner-exit') !== -1,
      true,
    );
  });

  it('still moves the iframe itself when use_v2_renderer is true but the creative has no #branch-banner', function () {
    journeys_utils.use_v2_renderer = true;

    assert.doesNotThrow(function () {
      journeys_utils.animateBannerExit(banner);
    });
    assert.strictEqual(banner.style.top, '-76px');
  });

  it('waits for a longer content exit animation instead of cutting it off at the default timeout', function () {
    journeys_utils.use_v2_renderer = true;
    const doc = banner.contentWindow.document;
    const style = doc.createElement('style');
    style.textContent =
      '#branch-banner.branch-banner-exit { animation: branch-slide-out-top 0.5s ease both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    // the default timeout (animationSpeed + animationDelay = 270ms) would remove it too early
    vi.advanceTimersByTime(
      journeys_utils.animationSpeed + journeys_utils.animationDelay,
    );
    assert.strictEqual(document.body.contains(banner), true);

    // the content's real 500ms exit animation gets to finish before removal happens
    vi.advanceTimersByTime(
      500 - (journeys_utils.animationSpeed + journeys_utils.animationDelay),
    );
    assert.strictEqual(document.body.contains(banner), false);
  });

  it('waits out a delayed exit animation instead of removing mid-animation', function () {
    journeys_utils.use_v2_renderer = true;
    const doc = banner.contentWindow.document;
    const style = doc.createElement('style');
    // doesn't start playing until 0.3s in, then plays for 0.4s -- finishes at 0.7s total
    style.textContent =
      '#branch-banner.branch-banner-exit { animation: branch-slide-out-top 0.4s ease 0.3s both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    // duration alone (400ms) would remove it before the delayed animation even finishes playing
    vi.advanceTimersByTime(400);
    assert.strictEqual(document.body.contains(banner), true);

    // delay + duration (700ms) gets to elapse before removal happens
    vi.advanceTimersByTime(300);
    assert.strictEqual(document.body.contains(banner), false);
  });

  it('does not move the iframe itself when use_v2_renderer is true', function () {
    journeys_utils.use_v2_renderer = true;
    const doc = banner.contentWindow.document;
    const style = doc.createElement('style');
    style.textContent =
      '#branch-banner.branch-banner-exit { animation: branch-slide-out-top 0.25s ease both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    // #branch-banner-iframe has no transition of its own once the content handles this, so
    // moving it here would snap it off-screen instantly instead of letting the content's
    // animation actually play out.
    assert.strictEqual(banner.style.top, '');
  });

  it('does not move the iframe and removes at the default timeout when use_v2_renderer is true but there is no exit animation', function () {
    journeys_utils.use_v2_renderer = true;
    banner.contentWindow.document.body.innerHTML =
      '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    assert.strictEqual(banner.style.top, '');
    vi.advanceTimersByTime(
      journeys_utils.animationSpeed + journeys_utils.animationDelay,
    );
    assert.strictEqual(document.body.contains(banner), false);
  });

  it('still moves the iframe itself when use_v2_renderer is false (legacy), even if #branch-banner has CSS animation', function () {
    const doc = banner.contentWindow.document;
    const style = doc.createElement('style');
    style.textContent =
      '#branch-banner { animation: branch-slide-in-top 0.25s ease both; }';
    doc.head.appendChild(style);
    doc.body.innerHTML = '<div id="branch-banner"></div>';

    journeys_utils.animateBannerExit(banner);

    assert.strictEqual(banner.style.top, '-76px');
  });
});

describe('animationConfig support', function () {
  const assert = testUtils.unplanned();
  let banner;

  const mockAnimationConfig = {
    classes: {
      enter: 'branch-banner-enter',
      exit: 'branch-banner-exit',
    },
    generatedCss:
      '.branch-banner-enter { animation: branch-slide-in-bottom 0.25s ease both; }\n.branch-banner-exit { animation: branch-slide-out-bottom 0.25s ease both; }',
    surface: 'CONTENT',
    type: 'SLIDE',
  };

  beforeEach(function () {
    vi.useFakeTimers();
    banner = document.createElement('iframe');
    document.body.appendChild(banner);

    journeys_utils.branch = { _ctx: createContext(), _publishEvent: vi.fn() };
    journeys_utils.journeyLinkData = {};
    journeys_utils.use_v2_renderer = true;
    journeys_utils.entryAnimationDisabled = false;
    journeys_utils.exitAnimationDisabled = false;
    journeys_utils.animationConfig = JSON.parse(
      JSON.stringify(mockAnimationConfig),
    );
  });

  afterEach(function () {
    vi.runAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();

    journeys_utils.animationConfig = null;
    journeys_utils.use_v2_renderer = false;
    if (banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
  });

  it('injects generatedCss into iframe inner head when surface is CONTENT', function () {
    const iframe = journeys_utils.createIframe();
    document.body.appendChild(iframe);

    journeys_utils.addIframeInnerCSS(iframe, '/* inner css */');

    const doc = iframe.contentWindow.document;
    const styleEl = doc.getElementById('branch-css');
    assert.ok(styleEl, 'branch-css element should exist');
    assert.ok(
      styleEl.innerHTML.indexOf('.branch-banner-enter') !== -1,
      'generatedCss should be injected into inner style',
    );

    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  });

  it('applies enter animation class from animationConfig during entrance animation', function () {
    banner.contentWindow.document.body.innerHTML =
      '<div id="branch-banner"></div>';

    journeys_utils.animateBannerEntrance(banner);

    const bannerRoot = journeys_utils.getAnimationRoot(banner);
    assert.ok(
      bannerRoot.className.indexOf('branch-banner-enter') !== -1,
      'enter animation class from config should be attached',
    );
  });

  it('detaches enter class and attaches exit class from animationConfig during exit animation', function () {
    banner.contentWindow.document.body.innerHTML =
      '<div id="branch-banner" class="branch-banner-enter"></div>';

    journeys_utils.animateBannerExit(banner);

    const bannerRoot = journeys_utils.getAnimationRoot(banner);
    assert.strictEqual(
      bannerRoot.className.indexOf('branch-banner-enter'),
      -1,
      'enter animation class should be detached',
    );
    assert.ok(
      bannerRoot.className.indexOf('branch-banner-exit') !== -1,
      'exit animation class from config should be attached',
    );
  });

  it('applies outer CSS to host page when surface is IFRAME', function () {
    journeys_utils.animationConfig.surface = 'IFRAME';
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';

    journeys_utils.addIframeOuterCSS(undefined, {});

    const outerStyleEl = document.getElementById('branch-iframe-css');
    assert.ok(outerStyleEl, 'branch-iframe-css element should exist');
    assert.ok(
      outerStyleEl.innerHTML.indexOf('.branch-banner-enter') !== -1,
      'generatedCss should be injected into outer style',
    );

    if (outerStyleEl?.parentNode) {
      outerStyleEl.parentNode.removeChild(outerStyleEl);
    }
  });
});

// ---------------------------------------------------------------------------
// Characterization tests: pin down what journeys_utils does today, quirks
// included. Every describe below snapshots journeys_utils' module-level state
// and the DOM, and restores both afterwards so nothing leaks between files.
// ---------------------------------------------------------------------------

function snapshotJourneysState() {
  const snapshot = {};
  Object.keys(journeys_utils).forEach(function (key) {
    if (typeof journeys_utils[key] !== 'function') {
      snapshot[key] = journeys_utils[key];
    }
  });
  return snapshot;
}

function restoreJourneysState(snapshot) {
  Object.keys(journeys_utils).forEach(function (key) {
    if (typeof journeys_utils[key] !== 'function' && !(key in snapshot)) {
      delete journeys_utils[key];
    }
  });
  Object.assign(journeys_utils, snapshot);
}

function createFakeBranch() {
  return {
    _ctx: createContext(),
    _publishEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    _api: vi.fn(),
  };
}

function createFakeStorage(initial) {
  const data = Object.assign({}, initial);
  return {
    data: data,
    get: vi.fn(function (key) {
      return data[key] === undefined ? null : data[key];
    }),
    set: vi.fn(function (key, value) {
      data[key] = value;
    }),
  };
}

function appendIframe(innerHtml) {
  const iframe = journeys_utils.createIframe();
  document.body.appendChild(iframe);
  if (innerHtml !== undefined) {
    iframe.contentWindow.document.body.innerHTML = innerHtml;
  }
  return iframe;
}

// Shared isolation for every characterization describe block.
function isolateJourneysState() {
  let stateSnapshot;
  let headChildren;
  let bodyChildren;

  beforeEach(function () {
    stateSnapshot = snapshotJourneysState();
    headChildren = Array.prototype.slice.call(document.head.childNodes);
    bodyChildren = Array.prototype.slice.call(document.body.childNodes);
    journeys_utils.branch = createFakeBranch();
  });

  afterEach(function () {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.removeEventListener('resize', journeys_utils._resizeListener);
    window.removeEventListener('scroll', journeys_utils._scrollListener);
    Array.prototype.slice
      .call(document.head.childNodes)
      .forEach(function (node) {
        if (headChildren.indexOf(node) === -1) {
          document.head.removeChild(node);
        }
      });
    Array.prototype.slice
      .call(document.body.childNodes)
      .forEach(function (node) {
        if (bodyChildren.indexOf(node) === -1) {
          document.body.removeChild(node);
        }
      });
    document.body.removeAttribute('style');
    document.body.className = '';
    restoreJourneysState(stateSnapshot);
  });
}

describe('journeys_utils characterization: setPositionAndHeight', function () {
  isolateJourneysState();

  beforeEach(function () {
    journeys_utils.windowHeight = 800;
  });

  it('uses template metadata when bannerHeight, position and sticky are all present', function () {
    journeys_utils.setPositionAndHeight(
      '<script type="application/json">{"bannerHeight":"120px","position":"bottom","sticky":"fixed"}</script><div></div>',
    );
    expect(journeys_utils.bannerHeight).toBe('120px');
    expect(journeys_utils.position).toBe('bottom');
    expect(journeys_utils.sticky).toBe('fixed');
    expect(journeys_utils.isHalfPage).toBe(false);
    expect(journeys_utils.isFullPage).toBe(false);
  });

  it('ignores partial metadata (missing sticky) and falls back to html sniffing', function () {
    journeys_utils.setPositionAndHeight(
      '<script type="application/json">{"bannerHeight":"120px","position":"top"}</script><div></div>',
    );
    // no spacer div in the html => treated as a legacy bottom banner
    expect(journeys_utils.bannerHeight).toBe('76px');
    expect(journeys_utils.position).toBe('bottom');
    expect(journeys_utils.sticky).toBe('fixed');
  });

  it('treats legacy html with a spacer rule as a top banner and reads margin-bottom as the height', function () {
    journeys_utils.setPositionAndHeight(
      '<style>#branch-banner-spacer { margin-bottom: 60px; }</style>',
    );
    expect(journeys_utils.position).toBe('top');
    expect(journeys_utils.bannerHeight).toBe('60px');
    expect(journeys_utils.sticky).toBe('absolute');
  });

  it('keeps the default 76px height when the spacer rule has no margin-bottom', function () {
    journeys_utils.setPositionAndHeight(
      '<style>#branch-banner-spacer { color: red; }</style>',
    );
    expect(journeys_utils.position).toBe('top');
    expect(journeys_utils.bannerHeight).toBe('76px');
    expect(journeys_utils.sticky).toBe('absolute');
  });

  it('treats legacy html without metadata or spacer as a fixed bottom banner', function () {
    journeys_utils.setPositionAndHeight('<div id="branch-banner"></div>');
    expect(journeys_utils.position).toBe('bottom');
    expect(journeys_utils.sticky).toBe('fixed');
    expect(journeys_utils.bannerHeight).toBe('76px');
  });

  it('resets isFullPage/isHalfPage and other defaults on every call', function () {
    journeys_utils.isFullPage = true;
    journeys_utils.isHalfPage = true;
    journeys_utils.bannerHeight = '999px';
    journeys_utils.setPositionAndHeight('<div></div>');
    expect(journeys_utils.isFullPage).toBe(false);
    expect(journeys_utils.isHalfPage).toBe(false);
    expect(journeys_utils.bannerHeight).toBe('76px');
  });

  it('converts a relative vh height below 100 to pixels of windowHeight and marks half page', function () {
    journeys_utils.setPositionAndHeight(
      '<script type="application/json">{"bannerHeight":"50vh","position":"top","sticky":"absolute"}</script>',
    );
    expect(journeys_utils.bannerHeight).toBe('400px');
    expect(journeys_utils.isHalfPage).toBe(true);
    expect(journeys_utils.isFullPage).toBe(false);
  });

  it('converts a 100% height to full windowHeight pixels and marks full page', function () {
    journeys_utils.setPositionAndHeight(
      '<script type="application/json">{"bannerHeight":"100%","position":"bottom","sticky":"fixed"}</script>',
    );
    expect(journeys_utils.bannerHeight).toBe('800px');
    expect(journeys_utils.isFullPage).toBe(true);
    expect(journeys_utils.isHalfPage).toBe(false);
  });

  it('keeps fractional pixels when the relative height does not divide evenly', function () {
    journeys_utils.windowHeight = 667;
    journeys_utils.setPositionAndHeight(
      '<script type="application/json">{"bannerHeight":"33vh","position":"top","sticky":"absolute"}</script>',
    );
    expect(journeys_utils.bannerHeight).toBe(`${(33 / 100) * 667}px`);
    expect(journeys_utils.isHalfPage).toBe(true);
  });

  it('treats heights above 100vh as full page', function () {
    journeys_utils.setPositionAndHeight(
      '<script type="application/json">{"bannerHeight":"150vh","position":"top","sticky":"absolute"}</script>',
    );
    expect(journeys_utils.bannerHeight).toBe('1200px');
    expect(journeys_utils.isFullPage).toBe(true);
  });

  it('treats 0vh as a half page with 0px height', function () {
    // NOTE: possible bug: '0' (a non-empty string) is truthy, so a 0vh banner is
    // flagged isHalfPage with a 0px height instead of being ignored.
    journeys_utils.setPositionAndHeight(
      '<script type="application/json">{"bannerHeight":"0vh","position":"top","sticky":"absolute"}</script>',
    );
    expect(journeys_utils.bannerHeight).toBe('0px');
    expect(journeys_utils.isHalfPage).toBe(true);
  });

  it('throws when the metadata script contains invalid JSON', function () {
    expect(function () {
      journeys_utils.setPositionAndHeight(
        '<script type="application/json">{not json}</script>',
      );
    }).toThrow('Invalid JSON string');
  });
});

describe('journeys_utils characterization: getRelativeHeightValueOrFalseFromBannerHeight edge cases', function () {
  isolateJourneysState();

  it('is case-insensitive for units', function () {
    expect(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight('40VH'),
    ).toBe('40');
  });

  it('strips every vh/% occurrence, even mixed together', function () {
    expect(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight('5vh%'),
    ).toBe('5');
  });

  it('keeps decimals', function () {
    expect(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight('12.5%'),
    ).toBe('12.5');
  });

  it('returns false for non-string or empty values', function () {
    expect(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(undefined),
    ).toBe(false);
    expect(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(''),
    ).toBe(false);
    expect(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight('76em'),
    ).toBe(false);
  });

  it('returns the original string minus units even when other text remains', function () {
    expect(
      journeys_utils.getRelativeHeightValueOrFalseFromBannerHeight(
        'calc(10vh)',
      ),
    ).toBe('calc(10)');
  });
});

describe('journeys_utils characterization: html blob parsing helpers', function () {
  isolateJourneysState();

  const blob =
    '<script type="application/json">{"a":1}</script>' +
    '<script type="text/javascript">/* cta */</script>' +
    '<style type="text/css" id="branch-css">.inner { color: red; }</style>' +
    '<style type="text/css" id="branch-iframe-css">.outer { color: blue; }</style>' +
    '<div id="branch-banner">body</div>';

  it('getMetadata parses the json script, or returns undefined', function () {
    expect(journeys_utils.getMetadata(blob)).toEqual({ a: 1 });
    expect(journeys_utils.getMetadata('<div></div>')).toBeUndefined();
  });

  it('getCss and getIframeCss extract the matching style blocks', function () {
    expect(journeys_utils.getCss(blob)).toBe('.inner { color: red; }');
    expect(journeys_utils.getIframeCss(blob)).toBe('.outer { color: blue; }');
    expect(journeys_utils.getCss('<div></div>')).toBeUndefined();
    expect(journeys_utils.getIframeCss('<div></div>')).toBeUndefined();
  });

  it('removeScriptAndCss strips json, js, css and iframe css and leaves the rest', function () {
    expect(journeys_utils.removeScriptAndCss(blob)).toBe(
      '<div id="branch-banner">body</div>',
    );
    expect(journeys_utils.removeScriptAndCss('<p>x</p>')).toBe('<p>x</p>');
  });

  it('getJsAndAddToParent appends the js as #branch-journey-cta with the nonce', function () {
    journeys_utils.branch._ctx.nonce = 'abc123';
    journeys_utils.getJsAndAddToParent(blob);
    const script = document.getElementById('branch-journey-cta');
    expect(script.tagName).toBe('SCRIPT');
    expect(script.parentNode).toBe(document.body);
    expect(script.innerHTML).toBe('/* cta */');
    expect(script.getAttribute('nonce')).toBe('abc123');
  });

  it('getJsAndAddToParent does nothing when there is no js block', function () {
    journeys_utils.getJsAndAddToParent('<div></div>');
    expect(document.getElementById('branch-journey-cta')).toBeNull();
  });

  it('getCtaText prefers has_app only when hasApp is true, else no_app', function () {
    const metadata = { ctaText: { has_app: 'Open', no_app: 'Get' } };
    expect(journeys_utils.getCtaText(metadata, true)).toBe('Open');
    expect(journeys_utils.getCtaText(metadata, false)).toBe('Get');
    expect(
      journeys_utils.getCtaText({ ctaText: { no_app: 'Get' } }, true),
    ).toBe('Get');
    expect(journeys_utils.getCtaText({}, true)).toBeUndefined();
    expect(journeys_utils.getCtaText(undefined, false)).toBeUndefined();
  });
});

describe('journeys_utils characterization: findInsertionDiv', function () {
  isolateJourneysState();

  it('collects the parent element of every element matching injectorSelector', function () {
    const parentA = document.createElement('section');
    const parentB = document.createElement('section');
    parentA.innerHTML = '<div class="inject-here"></div>';
    parentB.innerHTML = '<div class="inject-here"></div>';
    document.body.appendChild(parentA);
    document.body.appendChild(parentB);

    journeys_utils.findInsertionDiv(document.body, {
      injectorSelector: '.inject-here',
    });

    expect(journeys_utils.divToInjectParents).toEqual([parentA, parentB]);
  });

  it('resets divToInjectParents when metadata has no selector or nothing matches', function () {
    journeys_utils.divToInjectParents = [document.body];
    journeys_utils.findInsertionDiv(document.body, {});
    expect(journeys_utils.divToInjectParents).toEqual([]);

    journeys_utils.divToInjectParents = [document.body];
    journeys_utils.findInsertionDiv(document.body, {
      injectorSelector: '.does-not-exist',
    });
    expect(journeys_utils.divToInjectParents).toEqual([]);

    journeys_utils.findInsertionDiv(document.body, undefined);
    expect(journeys_utils.divToInjectParents).toEqual([]);
  });
});

describe('journeys_utils characterization: createIframe and addHtmlToIframe', function () {
  isolateJourneysState();

  it('createIframe builds the banner iframe with fixed attributes', function () {
    const iframe = journeys_utils.createIframe();
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe.id).toBe('branch-banner-iframe');
    expect(iframe.className).toBe('branch-animation');
    expect(iframe.title).toBe('Branch Banner Frame');
    expect(iframe.getAttribute('aria-label')).toBe('Branch Banner Frame');
    expect(iframe.getAttribute('src')).toBe('about:blank');
    expect(iframe.style.overflow).toBe('hidden');
    expect(iframe.scrolling).toBe('no');
    expect(iframe.hasAttribute('nonce')).toBe(false);
  });

  it('createIframe adds the nonce when ctx.nonce is set', function () {
    journeys_utils.branch._ctx.nonce = 'n0nce';
    expect(journeys_utils.createIframe().getAttribute('nonce')).toBe('n0nce');
  });

  it.each([
    ['ios', 'branch-banner-ios'],
    ['ipad', 'branch-banner-ios'],
    ['android', 'branch-banner-android'],
    ['desktop', 'branch-banner-other'],
    [undefined, 'branch-banner-other'],
  ])(
    'addHtmlToIframe maps user agent %s to body class %s',
    function (ua, expected) {
      const iframe = appendIframe();
      journeys_utils.addHtmlToIframe(iframe, '<p id="hello">hi</p>', ua);
      const doc = iframe.contentWindow.document;
      expect(doc.body.className).toBe(expected);
      expect(doc.getElementById('hello').textContent).toBe('hi');
    },
  );

  it('addHtmlToIframe creates head and body when the document lacks them', function () {
    const doc = document.implementation.createHTMLDocument('');
    doc.documentElement.removeChild(doc.body);
    doc.documentElement.removeChild(doc.head);
    const fakeIframe = { contentDocument: doc };

    journeys_utils.addHtmlToIframe(fakeIframe, '<span>x</span>', 'android');

    expect(doc.head).not.toBeNull();
    expect(doc.body.innerHTML).toBe('<span>x</span>');
    expect(doc.body.className).toBe('branch-banner-android');
  });

  it('addHtmlToIframe injects the keyboard navigation script for wcag meta', function () {
    const iframe = appendIframe();
    journeys_utils.addHtmlToIframe(
      iframe,
      '<meta name="accessibility" content="wcag"><div id="branch-banner"><button>go</button></div>',
      'ios',
    );
    const scripts =
      iframe.contentWindow.document.body.querySelectorAll('script');
    expect(scripts.length).toBe(1);
    expect(scripts[0].type).toBe('text/javascript');
    expect(scripts[0].text).toContain('handleKeyboardNavigation');
    expect(scripts[0].text).toContain('autoFocus(100)');
  });

  it('addHtmlToIframe does not inject the script for other accessibility meta values', function () {
    const iframe = appendIframe();
    journeys_utils.addHtmlToIframe(
      iframe,
      '<meta name="accessibility" content="none"><div id="branch-banner"></div>',
      'ios',
    );
    expect(
      iframe.contentWindow.document.body.querySelectorAll('script').length,
    ).toBe(0);
  });
});

describe('journeys_utils characterization: addIframeOuterCSS', function () {
  isolateJourneysState();

  beforeEach(function () {
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';
    journeys_utils.sticky = 'absolute';
    journeys_utils.isFullPage = false;
    journeys_utils.isHalfPage = false;
    journeys_utils.isDesktopJourney = false;
    journeys_utils.journeyVariant = null;
    journeys_utils.entryAnimationDisabled = false;
    journeys_utils.animationSpeed = 250;
    journeys_utils.animationConfig = null;
    journeys_utils.divToInjectParents = [];
    journeys_utils.previousPosition = '';
    journeys_utils.previousDivToInjectParents = [];
    journeys_utils.exitAnimationDisabledPreviously = false;
    journeys_utils.windowWidth = 375;
  });

  function outerCss() {
    return document.getElementById('branch-iframe-css').innerHTML;
  }

  it('adds the banner height to the existing body margin-top for top banners', function () {
    document.body.style.marginTop = '10px';
    journeys_utils.addIframeOuterCSS(undefined, {});
    expect(journeys_utils.bodyMarginTop).toBe('10px');
    expect(document.body.style.marginTop).toBe('86px');
    expect(document.body.style.marginBottom).toBe('');
  });

  it('adds the banner height to the existing body margin-bottom for bottom banners', function () {
    journeys_utils.position = 'bottom';
    document.body.style.marginBottom = '4px';
    journeys_utils.addIframeOuterCSS(undefined, {});
    expect(journeys_utils.bodyMarginBottom).toBe('4px');
    expect(document.body.style.marginBottom).toBe('80px');
    expect(document.body.style.marginTop).toBe('');
  });

  it('uses the BE-supplied cssIframeContainer verbatim and leaves body margins alone', function () {
    journeys_utils.addIframeOuterCSS('#custom { top: 0; }', {});
    expect(outerCss()).toBe('#custom { top: 0; }');
    expect(document.body.style.marginTop).toBe('');
    expect(document.body.style.transition).toBe('');
  });

  it('appends IFRAME-surface animation css after a cssIframeContainer', function () {
    journeys_utils.animationConfig = {
      surface: 'IFRAME',
      generatedCss: '.anim {}',
    };
    journeys_utils.addIframeOuterCSS('#custom {}', {});
    expect(outerCss()).toBe('#custom {}\n.anim {}\n');
  });

  it('does not append animation css for the CONTENT surface', function () {
    journeys_utils.animationConfig = {
      surface: 'CONTENT',
      generatedCss: '.anim {}',
    };
    journeys_utils.addIframeOuterCSS('#custom {}', {});
    expect(outerCss()).toBe('#custom {}');
  });

  it('generates mobile css with height, sticky and landscape margin', function () {
    journeys_utils.sticky = 'fixed';
    journeys_utils.addIframeOuterCSS(undefined, {});
    const css = outerCss();
    expect(css).toContain('height: 76px; z-index: 99999;');
    expect(css).toContain('#branch-banner-iframe { position: fixed; }');
    expect(css).toContain(
      '@media only screen and (orientation: landscape) { body { margin-top: 76px; }\n#branch-banner-iframe { height: 76px; }',
    );
  });

  it('uses windowWidth for the landscape height of full page bottom banners', function () {
    journeys_utils.position = 'bottom';
    journeys_utils.isFullPage = true;
    journeys_utils.addIframeOuterCSS(undefined, {});
    expect(outerCss()).toContain(
      'body { margin-bottom: 375px; }\n#branch-banner-iframe { height: 375px; }',
    );
  });

  it('omits transitions entirely when the entry animation is disabled', function () {
    journeys_utils.entryAnimationDisabled = true;
    journeys_utils.addIframeOuterCSS(undefined, {});
    expect(document.body.style.transition).toBe('');
    expect(outerCss()).not.toContain('transition');
  });

  it('resets the transition of an existing #branch-banner-iframe', function () {
    const iframe = appendIframe();
    iframe.style.transition = 'all 0s';
    journeys_utils.addIframeOuterCSS(undefined, {});
    expect(iframe.style.transition).toBe('');
  });

  it('generates desktop embed css using bannerWidth and sticky', function () {
    journeys_utils.isDesktopJourney = true;
    journeys_utils.bannerWidth = '300px';
    journeys_utils.sticky = 'absolute';
    journeys_utils.addIframeOuterCSS(undefined, {});
    const css = outerCss();
    expect(css).toContain(
      '#branch-banner-iframe-embed { z-index: 99999!important; height: 76px; width: 300px; padding: 0px!important; margin: 0px!important; ; position: absolute; }',
    );
    expect(css).toContain('height: 100%!important; width: 100%!important;');
    expect(css).not.toContain('@media');
  });

  it('forces 100% size and fixed position for the desktop overlay variant', function () {
    journeys_utils.isDesktopJourney = true;
    journeys_utils.journeyVariant = 'overlay';
    journeys_utils.bannerWidth = '300px';
    journeys_utils.addIframeOuterCSS(undefined, {});
    expect(outerCss()).toContain(
      '#branch-banner-iframe-embed { z-index: 99999!important; height: 100%!important; width: 100%!important; padding: 0px!important; margin: 0px!important; ; position: fixed; }',
    );
  });

  it('adds the nonce to the style element', function () {
    journeys_utils.branch._ctx.nonce = 'xyz';
    journeys_utils.addIframeOuterCSS(undefined, {});
    expect(
      document.getElementById('branch-iframe-css').getAttribute('nonce'),
    ).toBe('xyz');
  });

  it('pushes down every injection parent by the banner height', function () {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    journeys_utils.divToInjectParents = [parent];
    journeys_utils.addIframeOuterCSS(undefined, {});
    expect(parent.style.marginTop).toBe('76px');
  });

  it('skips fixed-position injection parents for full page banners only', function () {
    const fixedParent = document.createElement('div');
    fixedParent.style.position = 'fixed';
    document.body.appendChild(fixedParent);
    journeys_utils.divToInjectParents = [fixedParent];

    journeys_utils.isFullPage = true;
    journeys_utils.addIframeOuterCSS(undefined, {});
    expect(fixedParent.style.marginTop).toBe('');

    journeys_utils.isFullPage = false;
    journeys_utils.addIframeOuterCSS(undefined, {});
    expect(fixedParent.style.marginTop).toBe('76px');
  });

  it('clears leftover top margin from a previous top journey whose exit animation was disabled', function () {
    const previousParent = document.createElement('div');
    previousParent.style.marginTop = '76px';
    document.body.appendChild(previousParent);
    journeys_utils.previousPosition = 'top';
    journeys_utils.exitAnimationDisabledPreviously = true;
    journeys_utils.previousDivToInjectParents = [previousParent];
    journeys_utils.position = 'bottom';
    journeys_utils.journeyDismissed = true;

    journeys_utils.addIframeOuterCSS(undefined, {});

    expect(previousParent.style.marginTop).toBe('0px');
    expect(journeys_utils.previousPosition).toBe('');
    expect(journeys_utils.exitAnimationDisabledPreviously).toBe(false);
    expect(journeys_utils.previousDivToInjectParents).toEqual([]);
    expect(journeys_utils.journeyDismissed).toBe(false);
  });

  it('keeps leftover margin when the position did not change', function () {
    const previousParent = document.createElement('div');
    previousParent.style.marginTop = '76px';
    document.body.appendChild(previousParent);
    journeys_utils.previousPosition = 'top';
    journeys_utils.exitAnimationDisabledPreviously = true;
    journeys_utils.previousDivToInjectParents = [previousParent];
    journeys_utils.position = 'top';

    journeys_utils.addIframeOuterCSS(undefined, {});

    expect(previousParent.style.marginTop).toBe('76px');
  });
});

describe('journeys_utils characterization: addIframeInnerCSS', function () {
  isolateJourneysState();

  beforeEach(function () {
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '400px';
    journeys_utils.isHalfPage = false;
    journeys_utils.isFullPage = false;
    journeys_utils.isDesktopJourney = false;
    journeys_utils.journeyVariant = null;
    journeys_utils.use_v2_renderer = false;
    journeys_utils.animationConfig = null;
  });

  it('writes the inner css into #branch-css inside the iframe with the nonce', function () {
    journeys_utils.branch._ctx.nonce = 'inner';
    const iframe = appendIframe('<div class="branch-banner-content"></div>');
    journeys_utils.addIframeInnerCSS(iframe, '.a { color: red; }');
    const style = iframe.contentWindow.document.getElementById('branch-css');
    expect(style.parentNode).toBe(iframe.contentWindow.document.head);
    expect(style.innerHTML).toBe('.a { color: red; }');
    expect(style.getAttribute('nonce')).toBe('inner');
  });

  it('stretches .branch-banner-content to bannerHeight for half page banners', function () {
    journeys_utils.isHalfPage = true;
    const iframe = appendIframe('<div class="branch-banner-content"></div>');
    journeys_utils.addIframeInnerCSS(iframe, '');
    const content = iframe.contentWindow.document.querySelector(
      '.branch-banner-content',
    );
    expect(content.style.height).toBe('400px');
  });

  it('does not stretch content when a dismiss background exists', function () {
    journeys_utils.isFullPage = true;
    const iframe = appendIframe(
      '<div class="branch-banner-dismiss-background"></div><div class="branch-banner-content"></div>',
    );
    journeys_utils.addIframeInnerCSS(iframe, '');
    const content = iframe.contentWindow.document.querySelector(
      '.branch-banner-content',
    );
    expect(content.style.height).toBe('');
  });

  it('does not stretch content for the desktop overlay variant', function () {
    journeys_utils.isFullPage = true;
    journeys_utils.isDesktopJourney = true;
    journeys_utils.journeyVariant = 'overlay';
    const iframe = appendIframe('<div class="branch-banner-content"></div>');
    journeys_utils.addIframeInnerCSS(iframe, '');
    const content = iframe.contentWindow.document.querySelector(
      '.branch-banner-content',
    );
    expect(content.style.height).toBe('');
  });

  it('moves a bottom banner off-screen via style.bottom', function () {
    journeys_utils.position = 'bottom';
    const iframe = appendIframe('<div class="branch-banner-content"></div>');
    journeys_utils.addIframeInnerCSS(iframe, '');
    expect(iframe.style.bottom).toBe('-400px');
    expect(iframe.style.top).toBe('');
  });

  it('removes the iframe box shadow when the content background is fully transparent', function () {
    const iframe = appendIframe(
      '<div class="branch-banner-content" style="background-color: rgba(0, 0, 0, 0)"></div>',
    );
    journeys_utils.addIframeInnerCSS(iframe, '');
    expect(iframe.style.boxShadow).toBe('none');
  });

  it('keeps the box shadow for an opaque content background', function () {
    const iframe = appendIframe(
      '<div class="branch-banner-content" style="background-color: rgb(255, 0, 0)"></div>',
    );
    journeys_utils.addIframeInnerCSS(iframe, '');
    expect(iframe.style.boxShadow).toBe('');
  });

  it('swallows the error when there is no .branch-banner-content', function () {
    const iframe = appendIframe('<div></div>');
    expect(function () {
      journeys_utils.addIframeInnerCSS(iframe, '');
    }).not.toThrow();
    expect(iframe.style.boxShadow).toBe('');
  });
});

describe('journeys_utils characterization: addDynamicCtaText and centerOverlay', function () {
  isolateJourneysState();

  it('addDynamicCtaText sets innerHTML and aria-label of #branch-mobile-action', function () {
    const iframe = appendIframe(
      '<button id="branch-mobile-action">old</button>',
    );
    journeys_utils.addDynamicCtaText(iframe, 'Open <b>App</b>');
    const button = iframe.contentWindow.document.getElementById(
      'branch-mobile-action',
    );
    // ctaText is written as HTML, not text
    expect(button.innerHTML).toBe('Open <b>App</b>');
    expect(button.getAttribute('aria-label')).toBe('Open <b>App</b>');
  });

  it('addDynamicCtaText is a no-op without #branch-mobile-action', function () {
    const iframe = appendIframe('<div id="other">same</div>');
    journeys_utils.addDynamicCtaText(iframe, 'New');
    expect(iframe.contentWindow.document.body.innerHTML).toBe(
      '<div id="other">same</div>',
    );
  });

  it('centerOverlay styles the banner as a floating card', function () {
    const el = document.createElement('div');
    journeys_utils.centerOverlay(el);
    expect(el.style.bottom).toBe('140px');
    expect(el.style.width).toBe('94%');
    expect(el.style.borderRadius).toBe('20px');
    expect(el.style.margin).toBe('auto');
  });

  it('centerOverlay ignores null and style-less inputs', function () {
    expect(function () {
      journeys_utils.centerOverlay(null);
      journeys_utils.centerOverlay({});
    }).not.toThrow();
  });
});

describe('journeys_utils characterization: animation helpers', function () {
  isolateJourneysState();

  beforeEach(function () {
    journeys_utils.animationConfig = null;
    journeys_utils.entryAnimationDisabled = false;
    journeys_utils.exitAnimationDisabled = false;
  });

  it('getAnimationRoot returns null for a missing banner or a non-iframe element', function () {
    expect(journeys_utils.getAnimationRoot(null)).toBeNull();
    expect(
      journeys_utils.getAnimationRoot(document.createElement('div')),
    ).toBeNull();
  });

  it('getAnimationRoot returns the banner itself for the IFRAME surface', function () {
    journeys_utils.animationConfig = { surface: 'IFRAME' };
    const el = document.createElement('div');
    expect(journeys_utils.getAnimationRoot(el)).toBe(el);
  });

  it('getAnimationRoot falls back to .branch-banner-content, then null', function () {
    const iframe = appendIframe('<div class="branch-banner-content"></div>');
    expect(journeys_utils.getAnimationRoot(iframe).className).toBe(
      'branch-banner-content',
    );
    iframe.contentWindow.document.body.innerHTML = '<div></div>';
    expect(journeys_utils.getAnimationRoot(iframe)).toBeNull();
  });

  it('attachAnimation/detachAnimation use default class names without config', function () {
    const el = document.createElement('div');
    journeys_utils.attachAnimation(el, false);
    journeys_utils.attachAnimation(el, true);
    expect(el.className).toBe(' branch-banner-enter branch-banner-exit');
    journeys_utils.detachAnimation(el, false);
    expect(el.className).toBe(' branch-banner-exit');
    journeys_utils.detachAnimation(el, true);
    expect(el.className.trim()).toBe('');
  });

  it('attachAnimation/detachAnimation do nothing when that direction is disabled', function () {
    const el = document.createElement('div');
    el.className = 'branch-banner-enter';
    journeys_utils.entryAnimationDisabled = true;
    journeys_utils.exitAnimationDisabled = true;
    journeys_utils.attachAnimation(el, true);
    journeys_utils.detachAnimation(el, false);
    expect(el.className).toBe('branch-banner-enter');
    expect(function () {
      journeys_utils.attachAnimation(null, false);
      journeys_utils.detachAnimation(null, false);
    }).not.toThrow();
  });

  it('_timeValueMsAt parses s and ms tokens by index', function () {
    expect(journeys_utils._timeValueMsAt('0.25s', 0)).toBe(250);
    expect(journeys_utils._timeValueMsAt('250ms', 0)).toBe(250);
    expect(journeys_utils._timeValueMsAt('slide 0.4s ease 0.3s', 1)).toBe(300);
    expect(journeys_utils._timeValueMsAt('-1s', 0)).toBe(-1000);
    expect(journeys_utils._timeValueMsAt('0.4s', 1)).toBeNull();
    expect(journeys_utils._timeValueMsAt('', 0)).toBeNull();
    expect(journeys_utils._timeValueMsAt(undefined, 0)).toBeNull();
  });

  it('_getAnimationDurationMs is 0 when no animation is applied', function () {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(journeys_utils._getAnimationDurationMs(el)).toBe(0);
  });

  it('_getAnimationDurationMs adds duration and delay from inline animation', function () {
    const el = document.createElement('div');
    el.style.animation = 'foo 200ms ease 50ms';
    document.body.appendChild(el);
    expect(journeys_utils._getAnimationDurationMs(el)).toBe(250);
  });
});

describe('journeys_utils characterization: animateBannerEntrance', function () {
  isolateJourneysState();
  let banner;

  beforeEach(function () {
    vi.useFakeTimers();
    banner = appendIframe('<div id="branch-banner"></div>');
    journeys_utils.journeyLinkData = { banner_id: 'b1' };
    journeys_utils.use_v2_renderer = false;
    journeys_utils.animationConfig = null;
    journeys_utils.position = 'top';
    journeys_utils.sticky = 'absolute';
    journeys_utils.isFullPage = false;
    journeys_utils.animationDelay = 20;
    journeys_utils.isJourneyDisplayed = false;
    journeys_utils.isSafeAreaEnabled = false;
  });

  it('marks the body active immediately and slides a top banner in after animationDelay', function () {
    banner.style.top = '-76px';
    journeys_utils.animateBannerEntrance(banner);

    expect(document.body.className).toContain('branch-banner-is-active');
    expect(banner.style.top).toBe('-76px');
    expect(journeys_utils.branch._publishEvent).not.toHaveBeenCalled();

    vi.advanceTimersByTime(20);

    expect(banner.style.top).toBe('0px');
    expect(journeys_utils.branch._publishEvent).toHaveBeenCalledWith(
      'didShowJourney',
      journeys_utils.journeyLinkData,
    );
    expect(journeys_utils.isJourneyDisplayed).toBe(true);
  });

  it('does not attach the enter class when use_v2_renderer is false', function () {
    journeys_utils.animateBannerEntrance(banner);
    const root = banner.contentWindow.document.getElementById('branch-banner');
    expect(root.className).toBe('');
  });

  it('locks page scroll for fixed full page interstitials', function () {
    journeys_utils.isFullPage = true;
    journeys_utils.sticky = 'fixed';
    journeys_utils.animateBannerEntrance(banner);
    expect(document.body.className).toContain('branch-banner-no-scroll');
    const styles = Array.prototype.filter.call(
      document.head.querySelectorAll('style'),
      function (s) {
        return s.innerHTML === '.branch-banner-no-scroll {overflow: hidden;}';
      },
    );
    expect(styles.length).toBe(1);
  });

  it('does not lock scroll for full page banners that are not fixed', function () {
    journeys_utils.isFullPage = true;
    journeys_utils.sticky = 'absolute';
    journeys_utils.animateBannerEntrance(banner);
    expect(document.body.className).not.toContain('branch-banner-no-scroll');
  });

  it('clears top/bottom when a cssIframeContainer is in use', function () {
    banner.style.top = '-76px';
    banner.style.bottom = '-76px';
    journeys_utils.animateBannerEntrance(banner, '#custom {}');
    vi.advanceTimersByTime(20);
    expect(banner.style.top).toBe('');
    expect(banner.style.bottom).toBe('');
    expect(journeys_utils.isJourneyDisplayed).toBe(true);
  });

  it('slides a bottom banner to bottom 0 when safeAreaRequired is falsy', function () {
    journeys_utils.position = 'bottom';
    journeys_utils.journeyLinkData = {
      journey_link_data: { safeAreaRequired: false },
    };
    banner.style.bottom = '-76px';
    journeys_utils.animateBannerEntrance(banner);
    vi.advanceTimersByTime(20);
    expect(banner.style.bottom).toBe('0px');
    expect(journeys_utils.isSafeAreaEnabled).toBe(false);
  });

  it('repositions a bottom banner dynamically when safeAreaRequired is set', function () {
    journeys_utils.position = 'bottom';
    journeys_utils.journeyLinkData = {
      journey_link_data: { safeAreaRequired: true },
    };
    const addSpy = vi.spyOn(window, 'addEventListener');
    journeys_utils.animateBannerEntrance(banner);
    vi.advanceTimersByTime(20);

    expect(journeys_utils.isSafeAreaEnabled).toBe(true);
    expect(banner.style.transition).toBe('all 0s');
    // jsdom has no layout: offsetHeight/offsetTop are 0, so top = innerHeight
    expect(banner.style.top).toBe(`${window.innerHeight}px`);
    expect(addSpy).toHaveBeenCalledWith(
      'resize',
      journeys_utils._resizeListener,
    );
    expect(addSpy).toHaveBeenCalledWith(
      'scroll',
      journeys_utils._scrollListener,
    );
  });

  it('also repositions dynamically when there is no journey_link_data at all', function () {
    journeys_utils.position = 'bottom';
    journeys_utils.journeyLinkData = {};
    journeys_utils.animateBannerEntrance(banner);
    vi.advanceTimersByTime(20);
    expect(journeys_utils.isSafeAreaEnabled).toBe(true);
  });
});

describe('journeys_utils characterization: safe area repositioning', function () {
  isolateJourneysState();
  let iframe;
  let pageYOffsetDescriptor;

  beforeEach(function () {
    iframe = appendIframe();
    pageYOffsetDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'pageYOffset',
    );
  });

  afterEach(function () {
    if (pageYOffsetDescriptor) {
      Object.defineProperty(window, 'pageYOffset', pageYOffsetDescriptor);
    } else {
      delete window.pageYOffset;
    }
  });

  function setPageYOffset(value) {
    Object.defineProperty(window, 'pageYOffset', {
      configurable: true,
      writable: true,
      value: value,
    });
  }

  function setLayout(height, top) {
    Object.defineProperty(iframe, 'offsetHeight', {
      configurable: true,
      value: height,
    });
    Object.defineProperty(iframe, 'offsetTop', {
      configurable: true,
      value: top,
    });
  }

  it('pins the banner top to innerHeight - bannerHeight', function () {
    setLayout(100, 0);
    journeys_utils._resetJourneysBannerPosition(false, false);
    expect(iframe.style.top).toBe(`${window.innerHeight - 100}px`);
  });

  it('leaves top alone when the banner is already in place', function () {
    setLayout(100, window.innerHeight - 100);
    journeys_utils._resetJourneysBannerPosition(false, false);
    expect(iframe.style.top).toBe('');
  });

  it('pushes the banner half its height lower while overscrolling the bottom', function () {
    setLayout(100, 0);
    journeys_utils._resetJourneysBannerPosition(true, false);
    expect(iframe.style.top).toBe(`${window.innerHeight - 50}px`);
  });

  it('on first load with the page already scrolled, sets bottom 0 and returns false', function () {
    setLayout(100, 0);
    setPageYOffset(10);
    expect(journeys_utils._resetJourneysBannerPosition(false, true)).toBe(
      false,
    );
    expect(iframe.style.bottom).toBe('0px');
    expect(iframe.style.top).toBe('');
  });

  it('_resizeListener resets the position only while safe area is enabled', function () {
    const spy = vi
      .spyOn(journeys_utils, '_resetJourneysBannerPosition')
      .mockImplementation(function () {});
    journeys_utils.isSafeAreaEnabled = false;
    journeys_utils._resizeListener();
    expect(spy).not.toHaveBeenCalled();
    journeys_utils.isSafeAreaEnabled = true;
    journeys_utils._resizeListener();
    expect(spy).toHaveBeenCalledWith(false, false);
  });

  it('_scrollListener flags bottom overscroll once scrolled past one viewport', function () {
    const spy = vi
      .spyOn(journeys_utils, '_resetJourneysBannerPosition')
      .mockImplementation(function () {});
    journeys_utils.isSafeAreaEnabled = false;
    journeys_utils._scrollListener();
    expect(spy).not.toHaveBeenCalled();

    journeys_utils.isSafeAreaEnabled = true;
    setPageYOffset(0);
    journeys_utils._scrollListener();
    expect(spy).toHaveBeenLastCalledWith(false, false);

    setPageYOffset(window.innerHeight + 1);
    journeys_utils._scrollListener();
    expect(spy).toHaveBeenLastCalledWith(true, false);
  });
});

describe('journeys_utils characterization: animateBannerExit', function () {
  isolateJourneysState();
  let banner;

  beforeEach(function () {
    vi.useFakeTimers();
    banner = appendIframe('<div id="branch-banner"></div>');
    journeys_utils.journeyLinkData = { banner_id: 'b1' };
    journeys_utils.use_v2_renderer = false;
    journeys_utils.animationConfig = null;
    journeys_utils.divToInjectParents = [];
    journeys_utils.position = 'top';
    journeys_utils.bannerHeight = '76px';
    journeys_utils.bodyMarginTop = '5px';
    journeys_utils.bodyMarginBottom = '7px';
    journeys_utils.exitAnimationDisabled = false;
    journeys_utils.entryAnimationDisabled = false;
    journeys_utils.animationSpeed = 250;
    journeys_utils.animationDelay = 20;
    journeys_utils.isSafeAreaEnabled = false;
    journeys_utils.journeyDismissed = false;
    journeys_utils.isJourneyDisplayed = true;
    journeys_utils.exitAnimationIsRunning = false;
    journeys_utils.previousPosition = '';
    journeys_utils.previousDivToInjectParents = [];
    journeys_utils.exitAnimationDisabledPreviously = false;
  });

  function publishedEventNames() {
    return journeys_utils.branch._publishEvent.mock.calls.map(function (c) {
      return c[0];
    });
  }

  it('slides a bottom banner out and restores body margin-bottom from bodyMarginBottom', function () {
    journeys_utils.position = 'bottom';
    document.body.style.marginBottom = '83px';
    journeys_utils.animateBannerExit(banner);
    expect(banner.style.bottom).toBe('-76px');
    expect(document.body.style.marginBottom).toBe('7px');
    expect(journeys_utils.exitAnimationIsRunning).toBe(true);
  });

  it('publishes willCloseJourney now and the close events after teardown', function () {
    journeys_utils.animateBannerExit(banner);
    expect(publishedEventNames()).toEqual(['willCloseJourney']);

    vi.advanceTimersByTime(270);

    expect(publishedEventNames()).toEqual([
      'willCloseJourney',
      'didCloseJourney',
      'branch_internal_event_didCloseJourney',
    ]);
    journeys_utils.branch._publishEvent.mock.calls.forEach(function (c) {
      expect(c[1]).toBe(journeys_utils.journeyLinkData);
    });
    expect(journeys_utils.isJourneyDisplayed).toBe(false);
    expect(journeys_utils.exitAnimationIsRunning).toBe(true);

    vi.advanceTimersByTime(250);
    expect(journeys_utils.exitAnimationIsRunning).toBe(false);
  });

  it('skips branch_internal_event_didCloseJourney when dismissed programmatically', function () {
    journeys_utils.animateBannerExit(banner, true);
    vi.advanceTimersByTime(270);
    expect(publishedEventNames()).toEqual([
      'willCloseJourney',
      'didCloseJourney',
    ]);
  });

  it('removes the banner, outer css, cta script and body classes on teardown', function () {
    const outerCss = document.createElement('style');
    outerCss.id = 'branch-iframe-css';
    document.head.appendChild(outerCss);
    const cta = document.createElement('script');
    cta.id = 'branch-journey-cta';
    document.body.appendChild(cta);
    document.body.className =
      'x branch-banner-is-active branch-banner-no-scroll';

    journeys_utils.animateBannerExit(banner);
    vi.advanceTimersByTime(270);

    expect(document.body.contains(banner)).toBe(false);
    expect(document.getElementById('branch-iframe-css')).toBeNull();
    expect(document.getElementById('branch-journey-cta')).toBeNull();
    expect(document.body.className).not.toContain('branch-banner-is-active');
    expect(document.body.className).not.toContain('branch-banner-no-scroll');
    expect(document.body.className).toContain('x');
  });

  it('resets injection parent margins when the exit animation is enabled', function () {
    const parent = document.createElement('div');
    parent.style.marginTop = '76px';
    document.body.appendChild(parent);
    journeys_utils.divToInjectParents = [parent];

    journeys_utils.animateBannerExit(banner);
    vi.advanceTimersByTime(270);

    expect(parent.style.marginTop).toBe('0px');
  });

  it('with the exit animation disabled, tears down synchronously-next-tick and remembers injection parents', function () {
    const parent = document.createElement('div');
    parent.style.marginTop = '76px';
    document.body.appendChild(parent);
    journeys_utils.divToInjectParents = [parent];
    journeys_utils.exitAnimationDisabled = true;

    journeys_utils.animateBannerExit(banner);
    expect(journeys_utils.exitAnimationIsRunning).toBe(false);
    vi.advanceTimersByTime(0);

    expect(document.body.contains(banner)).toBe(false);
    expect(parent.style.marginTop).toBe('76px');
    expect(journeys_utils.exitAnimationDisabledPreviously).toBe(true);
    expect(journeys_utils.previousPosition).toBe('top');
    expect(journeys_utils.previousDivToInjectParents).toEqual([parent]);
  });

  it('with the exit animation disabled but journey dismissed by the user, still resets margins', function () {
    const parent = document.createElement('div');
    parent.style.marginTop = '76px';
    document.body.appendChild(parent);
    journeys_utils.divToInjectParents = [parent];
    journeys_utils.exitAnimationDisabled = true;
    journeys_utils.journeyDismissed = true;

    journeys_utils.animateBannerExit(banner);
    vi.advanceTimersByTime(0);

    expect(parent.style.marginTop).toBe('0px');
    expect(journeys_utils.previousPosition).toBe('');
  });

  it('adds exit transitions when only the entry animation was disabled', function () {
    journeys_utils.entryAnimationDisabled = true;
    const outerCss = document.createElement('style');
    outerCss.id = 'branch-iframe-css';
    outerCss.innerHTML = '#x {}';
    document.head.appendChild(outerCss);

    journeys_utils.animateBannerExit(banner);

    // NOTE: possible bug: 'all 0' + 0.25 yields 'all 00.25s ease' (leading zero
    // is glued onto the seconds value); browsers happen to parse it.
    expect(document.body.style.transition).toBe('all 00.25s ease');
    expect(banner.style.transition).toBe('all 00.25s ease');
    expect(outerCss.innerHTML).toBe(
      '#x {}\nbody { -webkit-transition: all 0.25s ease; }\n#branch-banner-iframe { -webkit-transition: all 0.25s ease; }\n',
    );
  });

  it('clears safe area listeners on teardown', function () {
    journeys_utils.isSafeAreaEnabled = true;
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    journeys_utils.animateBannerExit(banner);
    vi.advanceTimersByTime(270);
    expect(journeys_utils.isSafeAreaEnabled).toBe(false);
    expect(removeSpy).toHaveBeenCalledWith(
      'resize',
      journeys_utils._resizeListener,
    );
    expect(removeSpy).toHaveBeenCalledWith(
      'scroll',
      journeys_utils._scrollListener,
    );
  });
});

describe('journeys_utils characterization: dismiss period and storage', function () {
  isolateJourneysState();

  beforeEach(function () {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  it('_addSecondsToDate returns a ms timestamp seconds from now', function () {
    expect(journeys_utils._addSecondsToDate(60)).toBe(Date.now() + 60000);
  });

  it('_findGlobalDismissPeriod maps -1 to true, numbers to a timestamp, others to undefined', function () {
    expect(
      journeys_utils._findGlobalDismissPeriod({ globalDismissPeriod: -1 }),
    ).toBe(true);
    expect(
      journeys_utils._findGlobalDismissPeriod({ globalDismissPeriod: 30 }),
    ).toBe(Date.now() + 30000);
    expect(
      journeys_utils._findGlobalDismissPeriod({ globalDismissPeriod: 0 }),
    ).toBe(Date.now());
    expect(
      journeys_utils._findGlobalDismissPeriod({ globalDismissPeriod: '30' }),
    ).toBeUndefined();
    expect(journeys_utils._findGlobalDismissPeriod({})).toBeUndefined();
  });

  it('_findGlobalDismissPeriod throws on missing metadata', function () {
    // NOTE: possible bug: no guard for undefined metadata, so a non-test-mode
    // dismiss with no metadata throws before publishing the dismiss event.
    expect(function () {
      journeys_utils._findGlobalDismissPeriod(undefined);
    }).toThrow(TypeError);
  });

  it('_setJourneyDismiss records view_id and dismiss_time keyed by audience rule', function () {
    const storage = createFakeStorage();
    const result = journeys_utils._setJourneyDismiss(storage, 'view1', 'rule1');
    const expected = { rule1: { view_id: 'view1', dismiss_time: Date.now() } };
    expect(result).toEqual(expected);
    expect(storage.get).toHaveBeenCalledWith('journeyDismissals', true);
    expect(storage.set).toHaveBeenCalledWith(
      'journeyDismissals',
      JSON.stringify(expected),
      true,
    );
  });

  it('_setJourneyDismiss merges with existing dismissals and overwrites the same rule', function () {
    const storage = createFakeStorage({
      journeyDismissals: JSON.stringify({
        ruleA: { view_id: 'old', dismiss_time: 1 },
        rule1: { view_id: 'older', dismiss_time: 2 },
      }),
    });
    journeys_utils._setJourneyDismiss(storage, 'view1', 'rule1');
    expect(JSON.parse(storage.data.journeyDismissals)).toEqual({
      ruleA: { view_id: 'old', dismiss_time: 1 },
      rule1: { view_id: 'view1', dismiss_time: Date.now() },
    });
  });
});

describe('journeys_utils characterization: finalHookups', function () {
  isolateJourneysState();
  let banner;

  beforeEach(function () {
    banner = appendIframe(
      '<button id="branch-mobile-action">cta</button>' +
        '<span class="branch-banner-continue">continue</span>' +
        '<span class="branch-banner-close">x</span>' +
        '<div class="branch-banner-dismiss-background"></div>',
    );
    journeys_utils.journeyLinkData = { banner_id: 'b1' };
  });

  function fire(selector, type) {
    const win = banner.contentWindow;
    win.document.querySelector(selector).dispatchEvent(new win.Event(type));
  }

  it('returns early without cta or banner', function () {
    const dismissSpy = vi.spyOn(journeys_utils, '_setupDismissBehavior');
    journeys_utils.finalHookups('t', 'r', {}, null, banner);
    journeys_utils.finalHookups('t', 'r', {}, function () {}, null);
    expect(dismissSpy).not.toHaveBeenCalled();
  });

  it('CTA click publishes didClickJourneyCTA, marks dismissed, runs cta and animates exit', function () {
    const exitSpy = vi
      .spyOn(journeys_utils, 'animateBannerExit')
      .mockImplementation(function () {});
    const cta = vi.fn();
    journeys_utils.journeyDismissed = false;
    journeys_utils.finalHookups('t', 'r', {}, cta, banner, {}, false, {});

    fire('#branch-mobile-action', 'click');

    expect(journeys_utils.branch._publishEvent).toHaveBeenCalledWith(
      'didClickJourneyCTA',
      journeys_utils.journeyLinkData,
    );
    expect(journeys_utils.journeyDismissed).toBe(true);
    expect(cta).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(banner);
  });

  it.each([
    ['.branch-banner-continue', 'click', 'didClickJourneyContinue'],
    ['.branch-banner-close', 'click', 'didClickJourneyClose'],
    [
      '.branch-banner-dismiss-background',
      'click',
      'didClickJourneyBackgroundDismiss',
    ],
    [
      '.branch-banner-dismiss-background',
      'touchmove',
      'didScrollJourneyBackgroundDismiss',
    ],
  ])(
    '%s %s dispatches _handleJourneyDismiss(%s)',
    function (selector, type, eventName) {
      const dismissSpy = vi
        .spyOn(journeys_utils, '_handleJourneyDismiss')
        .mockImplementation(function () {});
      const storage = {};
      const metadata = { m: 1 };
      const branchView = { bv: 1 };
      journeys_utils.finalHookups(
        'tmpl',
        'rule',
        storage,
        function () {},
        banner,
        metadata,
        true,
        branchView,
      );

      fire(selector, type);

      expect(dismissSpy).toHaveBeenCalledTimes(1);
      expect(dismissSpy).toHaveBeenCalledWith(
        eventName,
        storage,
        banner,
        'tmpl',
        'rule',
        metadata,
        true,
        branchView,
      );
    },
  );
});

describe('journeys_utils characterization: _handleJourneyDismiss', function () {
  isolateJourneysState();
  afterEach(function () {
    setEnv(null);
  });
  let banner;
  let exitSpy;
  let branchView;

  beforeEach(function () {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    banner = appendIframe('<div></div>');
    exitSpy = vi
      .spyOn(journeys_utils, 'animateBannerExit')
      .mockImplementation(function () {});
    setEnv(makeFakeEnv({ hostedDeepLinkData: () => ({}) }));
    journeys_utils.journeyLinkData = { banner_id: 'b1' };
    journeys_utils.journeyDismissed = false;
    branchView = {
      _getPageviewRequestData: vi.fn(function (metadata) {
        return { metadata: metadata };
      }),
      shouldDisplayJourney: vi.fn().mockReturnValue(true),
      displayJourney: vi.fn(),
    };
  });

  function dismiss(metadata, testModeEnabled) {
    journeys_utils._handleJourneyDismiss(
      'didClickJourneyClose',
      storage,
      banner,
      'view1',
      'rule1',
      metadata,
      testModeEnabled,
      branchView,
    );
  }

  let storage;
  beforeEach(function () {
    storage = createFakeStorage();
  });

  function runDismissListener() {
    const listener = journeys_utils.branch.addListener.mock.calls[0][1];
    listener();
    return journeys_utils.branch._api.mock.calls[0];
  }

  it('in test mode only publishes, flags dismissed and animates exit', function () {
    dismiss({ globalDismissPeriod: -1 }, true);
    expect(journeys_utils.branch._publishEvent).toHaveBeenCalledWith(
      'didClickJourneyClose',
      journeys_utils.journeyLinkData,
    );
    expect(journeys_utils.journeyDismissed).toBe(true);
    expect(exitSpy).toHaveBeenCalledWith(banner);
    expect(storage.set).not.toHaveBeenCalled();
    expect(journeys_utils.branch.addListener).not.toHaveBeenCalled();
  });

  it('stores the global dismiss period and the per-rule dismissal', function () {
    dismiss({ globalDismissPeriod: -1 }, false);
    expect(storage.set).toHaveBeenCalledWith(
      'globalJourneysDismiss',
      true,
      true,
    );
    expect(JSON.parse(storage.data.journeyDismissals)).toEqual({
      rule1: { view_id: 'view1', dismiss_time: Date.now() },
    });
    expect(journeys_utils.branch.addListener).toHaveBeenCalledWith(
      'branch_internal_event_didCloseJourney',
      expect.any(Function),
    );
  });

  it('skips globalJourneysDismiss when metadata has no numeric period', function () {
    dismiss({}, false);
    expect(storage.data.globalJourneysDismiss).toBeUndefined();
    expect(storage.data.journeyDismissals).toBeDefined();
  });

  it('on didCloseJourney, removes the listener and posts to /v1/dismiss with the dismissal source', function () {
    dismiss({}, false);
    const listener = journeys_utils.branch.addListener.mock.calls[0][1];
    const call = runDismissListener();
    expect(journeys_utils.branch.removeListener).toHaveBeenCalledWith(listener);
    expect(call[0].endpoint).toBe('/v1/dismiss');
    expect(call[1].dismissal_source).toBe('Button(X)');
  });

  it('redirects to metadata.dismissRedirect on success', function () {
    const originalLocation = window.location;
    dismiss({ dismissRedirect: 'https://example.com/after-dismiss' }, false);
    const call = runDismissListener();
    try {
      call[2](null, {});
      // the redirect is a plain `window.location = url` assignment (in this
      // jsdom environment that overwrites the global, so restore it below)
      expect(String(window.location)).toBe('https://example.com/after-dismiss');
    } finally {
      window.location = originalLocation;
    }
    expect(window.location).toBe(originalLocation);
    expect(branchView.displayJourney).not.toHaveBeenCalled();
  });

  it('does nothing on error', function () {
    const originalLocation = window.location;
    dismiss(
      { dismissRedirect: 'https://example.com/should-not-happen' },
      false,
    );
    const call = runDismissListener();
    call[2](new Error('boom'), { template: '<div></div>' });
    expect(window.location).toBe(originalLocation);
    expect(branchView.displayJourney).not.toHaveBeenCalled();
  });

  it('displays the follow-up journey from the dismiss response when allowed', function () {
    dismiss({}, false);
    const call = runDismissListener();
    const data = {
      template: '<div>next</div>',
      event_data: { branch_view_data: { id: 'bv2' } },
      journey_link_data: { j: 1 },
      use_v2_renderer: true,
      animationConfig: { surface: 'CONTENT' },
    };
    call[2](null, data);
    expect(branchView.shouldDisplayJourney).toHaveBeenCalledWith(
      data,
      null,
      false,
    );
    expect(branchView.displayJourney).toHaveBeenCalledWith(
      '<div>next</div>',
      call[1],
      'bv2',
      data.event_data.branch_view_data,
      false,
      { j: 1 },
      { use_v2_renderer: true, animationConfig: { surface: 'CONTENT' } },
    );
  });

  it('prefers requestData.branch_view_id over the response id', function () {
    branchView._getPageviewRequestData = vi.fn(function () {
      return { branch_view_id: 'fromRequest' };
    });
    dismiss({}, false);
    const call = runDismissListener();
    call[2](null, {
      template: 'x',
      event_data: { branch_view_data: { id: 'bv2' } },
    });
    expect(branchView.displayJourney.mock.calls[0][2]).toBe('fromRequest');
  });

  it('does not display the follow-up journey when shouldDisplayJourney is false or no template', function () {
    branchView.shouldDisplayJourney.mockReturnValue(false);
    dismiss({}, false);
    const call = runDismissListener();
    call[2](null, {
      template: 'x',
      event_data: { branch_view_data: { id: 'bv2' } },
    });
    call[2](null, {});
    call[2](null, 'not an object');
    expect(branchView.displayJourney).not.toHaveBeenCalled();
  });
});

describe('journeys_utils characterization: dismiss request data', function () {
  isolateJourneysState();
  afterEach(function () {
    setEnv(null);
  });
  let branchView;

  beforeEach(function () {
    branchView = {
      _getPageviewRequestData: vi.fn(function (metadata) {
        return { metadata: metadata };
      }),
    };
  });

  it('_getPageviewMetadata builds url/ua/screen data and merges extra metadata', function () {
    const result = journeys_utils._getPageviewMetadata(
      { url: 'https://example.com/x' },
      { extra: 1 },
      createContext(),
    );
    expect(result).toEqual({
      url: 'https://example.com/x',
      user_agent: navigator.userAgent,
      language: navigator.language,
      screen_width: screen.width || -1,
      screen_height: screen.height || -1,
      window_device_pixel_ratio: window.devicePixelRatio || 1,
      extra: 1,
    });
  });

  it('_getPageviewMetadata defaults url to the window location and adds userAgentData', function () {
    const ctx = createContext();
    ctx.userAgentData = { model: 'Pixel 9', platformVersion: '15' };
    const result = journeys_utils._getPageviewMetadata(null, null, ctx);
    expect(result.url).toBe(utils.getWindowLocation());
    expect(result.model).toBe('Pixel 9');
    expect(result.os_version).toBe('15');
  });

  it('_getDismissRequestData without journey_link_data only adds the dismissal source', function () {
    setEnv(makeFakeEnv({ hostedDeepLinkData: () => ({}) }));
    journeys_utils.journeyLinkData = { banner_id: 'b1' };
    const result = journeys_utils._getDismissRequestData(
      branchView,
      'Button(X)',
    );
    expect(Object.keys(result).sort()).toEqual([
      'dismissal_source',
      'metadata',
    ]);
    expect(result.dismissal_source).toBe('Button(X)');
    expect(result.metadata.hosted_deeplink_data).toBeUndefined();
    expect(branchView._getPageviewRequestData).toHaveBeenCalledWith(
      expect.any(Object),
      null,
      journeys_utils.branch,
      true,
    );
  });

  it('_getDismissRequestData adds hosted deep link data and decoded journey fields', function () {
    setEnv(makeFakeEnv({ hostedDeepLinkData: () => ({ foo: 'bar' }) }));
    journeys_utils.journeyLinkData = {
      journey_link_data: {
        journey_id: 'j1',
        journey_name: 'Tom &amp; Jerry',
        view_id: 'v1',
        view_name: '&lt;view&gt;',
        channel: '&quot;ch&quot;',
        campaign: 'caf&eacute;',
        tags: ['a', 'b'],
      },
    };
    const result = journeys_utils._getDismissRequestData(branchView, undefined);
    expect(result.metadata.hosted_deeplink_data).toEqual({ foo: 'bar' });
    expect(result.journey_id).toBe('j1');
    expect(result.journey_name).toBe('Tom & Jerry');
    expect(result.view_id).toBe('v1');
    expect(result.view_name).toBe('<view>');
    expect(result.channel).toBe('"ch"');
    expect(result.campaign).toBe('café');
    expect(result.tags).toBe('["a","b"]');
    expect('dismissal_source' in result).toBe(false);
  });

  it('_getDismissRequestData omits missing fields and falls back to [] for unserializable tags', function () {
    setEnv(makeFakeEnv({ hostedDeepLinkData: () => ({}) }));
    const circular = {};
    circular.self = circular;
    journeys_utils.journeyLinkData = { journey_link_data: { tags: circular } };
    const result = journeys_utils._getDismissRequestData(branchView, 'src');
    expect(result.tags).toBe('[]');
    expect('journey_id' in result).toBe(false);
    expect('journey_name' in result).toBe(false);
  });

  it('decodeSymbols returns null for null/undefined and decodes known entities', function () {
    expect(journeys_utils.decodeSymbols(undefined)).toBeNull();
    expect(journeys_utils.decodeSymbols(null)).toBeNull();
    expect(
      journeys_utils.decodeSymbols(
        '&lt;&gt;&amp;&quot;&apos;&brvbar;&laquo;&acute;&middot;&raquo;&iquest;&times;&divide;',
      ),
    ).toBe('<>&"\'¦«´·»¿×÷');
    expect(
      journeys_utils.decodeSymbols(
        '&Agrave;&AElig;&Ntilde;&szlig;&eacute;&yuml;',
      ),
    ).toBe('ÀÆÑßéÿ');
    expect(journeys_utils.decodeSymbols('&unknown;')).toBe('&unknown;');
  });

  it('decodeSymbols double-decodes escaped entities', function () {
    // NOTE: possible bug: &amp; is decoded before most entities (and twice), so
    // literal text like "&amp;quot;" or "&amp;amp;" is decoded two levels deep.
    expect(journeys_utils.decodeSymbols('&amp;quot;')).toBe('"');
    expect(journeys_utils.decodeSymbols('&amp;amp;')).toBe('&');
    // but &lt; runs before &amp;, so this one is only decoded once
    expect(journeys_utils.decodeSymbols('&amp;lt;')).toBe('&lt;');
  });
});

describe('journeys_utils characterization: setJourneyLinkData', function () {
  isolateJourneysState();

  it('stores banner_id plus filtered journey_link_data and derives type/variant', function () {
    journeys_utils.branchViewId = 'view123';
    const linkData = {
      type: 'desktop',
      variant: 'overlay',
      journey_id: 'j1',
      browser_fingerprint_id: 'bfp',
      app_id: 'app',
      source: 'web',
      open_app: true,
      link_click_id: 'lc',
    };
    journeys_utils.setJourneyLinkData(linkData);

    expect(journeys_utils.journeyLinkData).toEqual({
      banner_id: 'view123',
      journey_link_data: {
        type: 'desktop',
        variant: 'overlay',
        journey_id: 'j1',
      },
    });
    expect(journeys_utils.journeyType).toBe('desktop');
    expect(journeys_utils.isDesktopJourney).toBe(true);
    expect(journeys_utils.journeyVariant).toBe('overlay');
    // NOTE: possible bug: the caller's object is mutated (filtered keys deleted).
    expect(linkData).toEqual({
      type: 'desktop',
      variant: 'overlay',
      journey_id: 'j1',
    });
    // journey_link_data is a copy, not the same object
    expect(journeys_utils.journeyLinkData.journey_link_data).not.toBe(linkData);
  });

  it('defaults journeyType and journeyVariant to null for mobile journeys', function () {
    journeys_utils.setJourneyLinkData({ journey_id: 'j1' });
    expect(journeys_utils.journeyType).toBeNull();
    expect(journeys_utils.isDesktopJourney).toBe(false);
    expect(journeys_utils.journeyVariant).toBeNull();
  });

  it('throws for empty or missing link data after setting journeyLinkData', function () {
    // NOTE: possible bug: data.journey_link_data is only created for non-empty
    // linkData, but is then dereferenced unconditionally (TypeError).
    journeys_utils.branchViewId = 'v9';
    expect(function () {
      journeys_utils.setJourneyLinkData({});
    }).toThrow(TypeError);
    expect(journeys_utils.journeyLinkData).toEqual({ banner_id: 'v9' });
    expect(function () {
      journeys_utils.setJourneyLinkData(undefined);
    }).toThrow(TypeError);
  });
});

describe('journeys_utils characterization: branch view data and CTA links', function () {
  isolateJourneysState();

  function setBranchViewData(data) {
    journeys_utils.branch = { _branchViewData: { data: data } };
  }

  it('getValueForKeyInBranchViewData returns false until branch view data exists', function () {
    journeys_utils.branch = null;
    expect(journeys_utils.getValueForKeyInBranchViewData('k')).toBe(false);
    journeys_utils.branch = {};
    expect(journeys_utils.getValueForKeyInBranchViewData('k')).toBe(false);
    journeys_utils.branch = { _branchViewData: {} };
    expect(journeys_utils.getValueForKeyInBranchViewData('k')).toBe(false);
    setBranchViewData({ k: 'v' });
    expect(journeys_utils.getValueForKeyInBranchViewData('k')).toBe('v');
    expect(journeys_utils.getValueForKeyInBranchViewData('missing')).toBe(
      undefined,
    );
  });

  it('getBranchViewDataItemOrUndefined returns undefined for falsy values', function () {
    setBranchViewData({ zero: 0, empty: '', yes: 'y' });
    expect(journeys_utils.getBranchViewDataItemOrUndefined('zero')).toBe(
      undefined,
    );
    expect(journeys_utils.getBranchViewDataItemOrUndefined('empty')).toBe(
      undefined,
    );
    expect(journeys_utils.getBranchViewDataItemOrUndefined('yes')).toBe('y');
  });

  it('hasJourneyCtaLink / getJourneyCtaLink read $journeys_cta', function () {
    setBranchViewData({});
    expect(journeys_utils.hasJourneyCtaLink()).toBe(false);
    expect(journeys_utils.getJourneyCtaLink()).toBeUndefined();

    setBranchViewData({ $journeys_cta: 'https://cta.example' });
    expect(journeys_utils.hasJourneyCtaLink()).toBe(true);
    expect(journeys_utils.getJourneyCtaLink()).toBe('https://cta.example');

    // non-string truthy value has no length
    setBranchViewData({ $journeys_cta: 5 });
    expect(journeys_utils.hasJourneyCtaLink()).toBe(false);
  });

  it('tryReplaceJourneyCtaLink returns html unchanged without a CTA link', function () {
    setBranchViewData({});
    const html = 'validate("old"); window.top.location.replace(x)';
    expect(journeys_utils.tryReplaceJourneyCtaLink(html)).toBe(html);
  });

  it('tryReplaceJourneyCtaLink swaps validate() target and location.replace', function () {
    setBranchViewData({ $journeys_cta: 'https://cta.example' });
    const html =
      'a validate("old"); b validate(\'x\'); window.top.location.replace(url); window.top.location.replace(url2);';
    // NOTE: possible bug: the greedy validate regex (`.+`) swallows everything
    // from the first `validate(` to the last `);` on the same line, dropping
    // the code in between. Also `.replace(` becomes `= ` but the closing `)` is
    // kept (`window.top.location = url);`), and only the first occurrence is
    // rewritten.
    expect(journeys_utils.tryReplaceJourneyCtaLink(html)).toBe(
      'a validate("https://cta.example")',
    );
    expect(
      journeys_utils.tryReplaceJourneyCtaLink(
        'validate("a");\nwindow.top.location.replace(url);',
      ),
    ).toBe('validate("https://cta.example")\nwindow.top.location = url);');
  });

  it('tryReplaceJourneyCtaLink returns the input when replacing throws', function () {
    setBranchViewData({ $journeys_cta: 'https://cta.example' });
    expect(journeys_utils.tryReplaceJourneyCtaLink(null)).toBeNull();
  });

  it('trySetJourneyUrls fills missing urls from branch view data, keeping existing ones', function () {
    setBranchViewData({
      $ios_url: 'https://ios.from.bvd',
      $android_url: 'https://android.from.bvd',
    });
    const linkElements = { data: JSON.stringify({ $ios_url: 'keep' }) };
    const result = journeys_utils.trySetJourneyUrls(linkElements);
    expect(result).toBe(linkElements);
    expect(JSON.parse(result.data)).toEqual({
      $ios_url: 'keep',
      $android_url: 'https://android.from.bvd',
    });
  });

  it('trySetJourneyUrls honours a custom url list', function () {
    setBranchViewData({ $custom: 'c', $ios_url: 'i' });
    const result = journeys_utils.trySetJourneyUrls({ data: '{}' }, [
      '$custom',
    ]);
    expect(JSON.parse(result.data)).toEqual({ $custom: 'c' });
  });

  it('trySetJourneyUrls returns falsy input and unparseable data untouched', function () {
    expect(journeys_utils.trySetJourneyUrls(null)).toBeNull();
    expect(journeys_utils.trySetJourneyUrls(undefined)).toBeUndefined();
    const bad = { data: 'not json' };
    expect(journeys_utils.trySetJourneyUrls(bad)).toBe(bad);
    expect(bad.data).toBe('not json');
  });
});
