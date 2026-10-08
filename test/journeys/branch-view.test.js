import { createContext } from '../../src/core/context.js';
import { session } from '../../src/core/session.js';
import { storage as storageModule } from '../../src/core/storage.js';
import { setEnv } from '../../src/env/env.js';
import { branch_view } from '../../src/journeys/branch-view.js';
import { journeys_utils } from '../../src/journeys/journeys-utils.js';
import { makeFakeEnv, UA_FOR_PLATFORM } from '../helpers/fake-env.js';

describe('displayJourney new render options wiring', function () {
  const assert = testUtils.unplanned();

  beforeEach(function () {
    journeys_utils.branch = { _storage: {}, _ctx: createContext() };
    journeys_utils.use_v2_renderer = false;
    journeys_utils.exitAnimationIsRunning = false;
  });

  afterEach(function () {
    journeys_utils.use_v2_renderer = false;
    const placeholder = document.getElementById('branch-banner');
    if (placeholder?.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
  });

  function display(newOptionsData) {
    branch_view.displayJourney(
      null,
      {},
      'template-id',
      {},
      false,
      { type: 'mobile_web' },
      newOptionsData,
    );
  }

  it('sets use_v2_renderer to true when branchViewData.use_v2_renderer is true', function () {
    display({ use_v2_renderer: true });
    assert.strictEqual(journeys_utils.use_v2_renderer, true);
  });

  it('sets use_v2_renderer to false when branchViewData.use_v2_renderer is false', function () {
    display({ use_v2_renderer: false });
    assert.strictEqual(journeys_utils.use_v2_renderer, false);
  });

  it('falls back to legacy (false) when branchViewData.use_v2_renderer is missing', function () {
    display({});
    assert.strictEqual(journeys_utils.use_v2_renderer, false);
  });
});

// Characterization tests for the rest of src/journeys/branch-view.js. They pin
// the current behavior, quirks included.

// Pristine copies of the module state the code under test mutates.
const journeysUtilsSnapshot = Object.assign({}, journeys_utils);
const branchViewKeysSnapshot = Object.keys(branch_view);

const JOURNEY_ELEMENT_IDS = [
  'branch-banner',
  'branch-banner-iframe',
  'branch-banner-container',
  'branch-banner-iframe-embed',
  'branch-iframe-css',
  'branch-journey-cta',
];

function removeJourneyElements() {
  JOURNEY_ELEMENT_IDS.forEach(function (id) {
    let el = document.getElementById(id);
    while (el) {
      el.parentNode.removeChild(el);
      el = document.getElementById(id);
    }
  });
}

function restoreModuleState() {
  Object.keys(journeys_utils).forEach(function (key) {
    if (!(key in journeysUtilsSnapshot)) {
      delete journeys_utils[key];
    }
  });
  Object.assign(journeys_utils, journeysUtilsSnapshot);
  journeys_utils.divToInjectParents = [];

  Object.keys(branch_view).forEach(function (key) {
    if (!branchViewKeysSnapshot.includes(key)) {
      delete branch_view[key];
    }
  });
}

function makeJourneyBranch(store, overrides) {
  return Object.assign(
    {
      _ctx: createContext(),
      _storage: store,
      _publishEvent: vi.fn(),
      _branchViewData: {},
      _referringLink: vi.fn().mockReturnValue(null),
    },
    overrides || {},
  );
}

function journeyResponse(overrides) {
  return Object.assign(
    {
      event_data: { branch_view_data: { id: 'view-1' } },
      template: '<div>template</div>',
    },
    overrides || {},
  );
}

describe('branch_view.shouldDisplayJourney', function () {
  let store;

  beforeEach(function () {
    localStorage.clear();
    sessionStorage.clear();
    store = new storageModule.BranchStorage(['local']);
    journeys_utils.branch = makeJourneyBranch(store);
    setEnv(makeFakeEnv({ userAgent: () => UA_FOR_PLATFORM.ios }));
  });

  afterEach(function () {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setEnv(null);
    removeJourneyElements();
    localStorage.clear();
    sessionStorage.clear();
    restoreModuleState();
  });

  it('returns true for a journey with an id when nothing blocks it', function () {
    expect(branch_view.shouldDisplayJourney(journeyResponse(), {}, false)).toBe(
      true,
    );
  });

  it('returns false on platform "other", even in test mode', function () {
    setEnv(makeFakeEnv({ userAgent: () => UA_FOR_PLATFORM.other }));
    expect(branch_view.shouldDisplayJourney(journeyResponse(), {}, true)).toBe(
      false,
    );
  });

  it('returns true on desktop', function () {
    setEnv(makeFakeEnv({ userAgent: () => UA_FOR_PLATFORM.desktop }));
    expect(branch_view.shouldDisplayJourney(journeyResponse(), {}, false)).toBe(
      true,
    );
  });

  it('returns false without event_data or template, even in test mode', function () {
    expect(
      branch_view.shouldDisplayJourney(
        journeyResponse({ event_data: null }),
        {},
        true,
      ),
    ).toBe(false);
    expect(
      branch_view.shouldDisplayJourney(
        journeyResponse({ template: '' }),
        {},
        true,
      ),
    ).toBe(false);
  });

  it('returns true in test mode regardless of id, no_journeys and dismissals', function () {
    store.set('globalJourneysDismiss', true, true);
    expect(
      branch_view.shouldDisplayJourney(
        journeyResponse({ event_data: { branch_view_data: {} } }),
        { no_journeys: true },
        true,
      ),
    ).toBe(true);
    // The dismissal is not consulted (or cleared) in test mode.
    expect(store.get('globalJourneysDismiss', true)).toBe(true);
  });

  it('returns false without a branch_view_data id and leaves the callback index alone', function () {
    journeys_utils._callback_index = 7;
    expect(
      branch_view.shouldDisplayJourney(
        journeyResponse({ event_data: { branch_view_data: {} } }),
        {},
        false,
      ),
    ).toBe(false);
    expect(journeys_utils._callback_index).toBe(7);
  });

  it('returns false with the no_journeys option', function () {
    expect(
      branch_view.shouldDisplayJourney(
        journeyResponse(),
        { no_journeys: true },
        false,
      ),
    ).toBe(false);
  });

  it('accepts null options', function () {
    expect(
      branch_view.shouldDisplayJourney(journeyResponse(), null, false),
    ).toBe(true);
  });

  it('throws when event_data has no branch_view_data outside test mode', function () {
    // NOTE: possible bug: src/journeys/branch-view.js:115 reads
    // event_data.branch_view_data.id without a guard, so a response whose
    // event_data lacks branch_view_data throws instead of returning false.
    expect(function () {
      branch_view.shouldDisplayJourney(
        journeyResponse({ event_data: {} }),
        {},
        false,
      );
    }).toThrow(TypeError);
  });

  describe('global dismissal (globalJourneysDismiss)', function () {
    it('returns false while dismissed indefinitely (true)', function () {
      store.set('globalJourneysDismiss', true, true);
      expect(
        branch_view.shouldDisplayJourney(journeyResponse(), {}, false),
      ).toBe(false);
      expect(store.get('globalJourneysDismiss', true)).toBe(true);
    });

    it('returns false while the dismiss period has not ended', function () {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 1));
      const end = Date.now() + 1000;
      store.set('globalJourneysDismiss', end, true);
      expect(
        branch_view.shouldDisplayJourney(journeyResponse(), {}, false),
      ).toBe(false);
      // Stored as a string in localStorage; compared numerically.
      expect(store.get('globalJourneysDismiss', true)).toBe(String(end));
    });

    it('clears an expired dismiss period and returns true', function () {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 1));
      store.set('globalJourneysDismiss', Date.now(), true);
      expect(
        branch_view.shouldDisplayJourney(journeyResponse(), {}, false),
      ).toBe(true);
      expect(store.get('globalJourneysDismiss', true)).toBeNull();
      expect(
        localStorage.getItem('BRANCH_WEBSDK_KEYglobalJourneysDismiss'),
      ).toBeNull();
    });

    it('treats a stored false as not dismissed and removes it', function () {
      store.set('globalJourneysDismiss', false, true);
      expect(
        branch_view.shouldDisplayJourney(journeyResponse(), {}, false),
      ).toBe(true);
      expect(store.get('globalJourneysDismiss', true)).toBeNull();
    });
  });
});

describe('branch_view.displayJourney', function () {
  let store;
  let branch;
  let spies;

  const METADATA = {
    bannerHeight: '76px',
    position: 'top',
    sticky: 'absolute',
    ctaText: { has_app: 'OPEN IT', no_app: 'GET IT' },
  };
  const BODY_HTML =
    '<div id="branch-banner"><a id="branch-mobile-action">CTA</a></div>';

  function journeyHtml(metadata) {
    return (
      (metadata
        ? '<script type="application/json">' +
          JSON.stringify(metadata) +
          '</script>'
        : '') +
      '<style type="text/css" id="branch-css">.inner { color: red; }</style>' +
      '<style type="text/css" id="branch-iframe-css">#branch-banner-iframe { left: 0; }</style>' +
      '<script type="text/javascript">/* journey js */</script>' +
      BODY_HTML
    );
  }

  function display(html, requestData, journeyLinkData, testMode, view) {
    (view || branch_view).displayJourney(
      html,
      Object.assign(
        {
          callback_string: 'branch_view_callback__test',
          has_app_websdk: false,
        },
        requestData || {},
      ),
      'template-1',
      { audience_rule_id: 'rule-1' },
      !!testMode,
      journeyLinkData || { type: 'mobile_web', channel: 'web' },
      { use_v2_renderer: false, animationConfig: { speed: 1 } },
    );
  }

  // The navigation timing flag is read once, when src/env/env.ts loads. Load
  // fresh copies of env, branch_view and journeys_utils with
  // window.performance.timing stubbed, wire them up like beforeEach does, and
  // return the fresh branch_view. The registry is reset again afterwards, and
  // the file's own (static) imports are untouched, so nothing leaks into later
  // tests.
  async function loadBranchViewWithTiming(timing) {
    Object.defineProperty(window.performance, 'timing', {
      value: timing,
      configurable: true,
    });
    vi.resetModules();
    let fresh;
    try {
      fresh = {
        env: await import('../../src/env/env.js'),
        branch_view: (await import('../../src/journeys/branch-view.js'))
          .branch_view,
        journeys_utils: (await import('../../src/journeys/journeys-utils.js'))
          .journeys_utils,
      };
    } finally {
      delete window.performance.timing;
      vi.resetModules();
    }
    fresh.env.setEnv(
      makeFakeEnv({
        userAgent: () => UA_FOR_PLATFORM.ios,
        timeSinceNavigationStart: () => '1234',
      }),
    );
    fresh.journeys_utils.branch = branch;
    Object.keys(spies).forEach(function (name) {
      spies[name] = vi
        .spyOn(fresh.journeys_utils, name)
        .mockImplementation(function () {});
    });
    return fresh;
  }

  function waitForIframeLoad() {
    return vi.waitFor(function () {
      expect(spies.animateBannerEntrance).toHaveBeenCalled();
    });
  }

  beforeEach(function () {
    localStorage.clear();
    sessionStorage.clear();
    store = new storageModule.BranchStorage(['local']);
    branch = makeJourneyBranch(store);
    journeys_utils.branch = branch;
    // The fake env reports the navigation timing API as unavailable.
    setEnv(makeFakeEnv({ userAgent: () => UA_FOR_PLATFORM.ios }));
    // The iframe rendering helpers are covered in journeys_utils tests; stub
    // them so these tests see only what branch_view passes along.
    spies = {};
    [
      'addHtmlToIframe',
      'addIframeOuterCSS',
      'addIframeInnerCSS',
      'addDynamicCtaText',
      'animateBannerEntrance',
      'finalHookups',
    ].forEach(function (name) {
      spies[name] = vi
        .spyOn(journeys_utils, name)
        .mockImplementation(function () {});
    });
  });

  afterEach(function () {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setEnv(null);
    removeJourneyElements();
    delete window.branch_view_callback__test;
    localStorage.clear();
    sessionStorage.clear();
    restoreModuleState();
  });

  it('does nothing while an exit animation is running', function () {
    journeys_utils.exitAnimationIsRunning = true;
    journeys_utils.branchViewId = 'previous';
    display(journeyHtml(METADATA));
    expect(journeys_utils.branchViewId).toBe('previous');
    expect(document.getElementById('branch-banner')).toBeNull();
    expect(document.getElementById('branch-banner-iframe')).toBeNull();
    expect(window.branch_view_callback__test).toBeUndefined();
  });

  it('without html, records the journey and adds then removes the placeholder', function () {
    const leftover = document.createElement('style');
    leftover.id = 'branch-iframe-css';
    document.head.appendChild(leftover);

    const appendSpy = vi.spyOn(document.body, 'insertBefore');
    display(
      null,
      {},
      {
        type: 'mobile_web',
        channel: 'web',
        browser_fingerprint_id: 'bfp',
        link_click_id: 'lcid',
      },
    );

    expect(journeys_utils.branchViewId).toBe('template-1');
    expect(journeys_utils.journeyLinkData).toEqual({
      banner_id: 'template-1',
      journey_link_data: { type: 'mobile_web', channel: 'web' },
    });
    expect(journeys_utils.animationConfig).toEqual({ speed: 1 });
    expect(document.getElementById('branch-iframe-css')).toBeNull();
    // The placeholder was inserted with the active class, then removed.
    const placeholder = appendSpy.mock.calls[0][0];
    expect(placeholder.id).toBe('branch-banner');
    expect(placeholder.className).toBe(' branch-banner-is-active');
    expect(placeholder.parentNode).toBeNull();
    expect(window.branch_view_callback__test).toBeUndefined();
  });

  it.each([null, {}])(
    'renders a journey whose link data is %s',
    function (linkData) {
      expect(function () {
        branch_view.displayJourney(
          journeyHtml(METADATA),
          { callback_string: 'branch_view_callback__test' },
          't',
          { audience_rule_id: 'rule-1' },
          true,
          linkData,
          { use_v2_renderer: false, animationConfig: { speed: 1 } },
        );
      }).not.toThrow();
      expect(document.getElementById('branch-banner-iframe')).not.toBeNull();
      expect(journeys_utils.journeyLinkData).toEqual({ banner_id: 't' });
    },
  );

  it('renders a mobile journey iframe at the top of body and hooks it up on load', async function () {
    const html = journeyHtml(METADATA);
    display(html, {}, { type: 'mobile_web', channel: 'web' }, true);

    const iframe = document.getElementById('branch-banner-iframe');
    expect(document.body.firstChild).toBe(iframe);
    expect(iframe.title).toBe('Branch Banner Frame');
    // The placeholder stays until the iframe loads.
    const placeholder = document.querySelector('div#branch-banner');
    expect(placeholder.parentNode).toBe(document.body);
    // The journey JS is moved into the page.
    expect(document.getElementById('branch-journey-cta').innerHTML).toBe(
      '/* journey js */',
    );
    expect(typeof window.branch_view_callback__test).toBe('function');

    await waitForIframeLoad();

    expect(spies.addHtmlToIframe).toHaveBeenCalledWith(
      iframe,
      BODY_HTML,
      'ios',
    );
    expect(spies.addIframeOuterCSS).toHaveBeenCalledWith(
      '#branch-banner-iframe { left: 0; }',
      METADATA,
    );
    expect(spies.addIframeInnerCSS).toHaveBeenCalledWith(
      iframe,
      '.inner { color: red; }',
    );
    expect(spies.addDynamicCtaText).toHaveBeenCalledWith(iframe, 'GET IT');
    expect(spies.animateBannerEntrance).toHaveBeenCalledWith(
      iframe,
      '#branch-banner-iframe { left: 0; }',
    );
    expect(spies.finalHookups).toHaveBeenCalledTimes(1);
    expect(spies.finalHookups).toHaveBeenCalledWith(
      'template-1',
      'rule-1',
      store,
      null,
      iframe,
      METADATA,
      true,
      branch_view,
    );
    expect(journeys_utils.banner).toBe(iframe);
    expect(placeholder.parentNode).toBeNull();
  });

  it('publishes willShowJourney with a copy of the link data plus layout fields', async function () {
    display(journeyHtml(METADATA), {}, { type: 'mobile_web', channel: 'web' });
    await waitForIframeLoad();

    expect(branch._publishEvent).toHaveBeenCalledTimes(1);
    const [event, eventData] = branch._publishEvent.mock.calls[0];
    expect(event).toBe('willShowJourney');
    expect(eventData).toEqual({
      banner_id: 'template-1',
      journey_link_data: { type: 'mobile_web', channel: 'web' },
      bannerHeight: '76px',
      isFullPageBanner: false,
      bannerPagePlacement: 'top',
      isBannerInline: true,
      isBannerSticky: false,
    });
    // Object.assign makes a shallow copy: journeyLinkData is not mutated...
    expect(eventData).not.toBe(journeys_utils.journeyLinkData);
    expect(journeys_utils.journeyLinkData.bannerHeight).toBeUndefined();
    // ...but nested objects are shared.
    expect(eventData.journey_link_data).toBe(
      journeys_utils.journeyLinkData.journey_link_data,
    );
  });

  it('reports full-page, sticky bottom layouts in the event data', async function () {
    journeys_utils.windowHeight = 800;
    display(
      journeyHtml({
        bannerHeight: '100%',
        position: 'bottom',
        sticky: 'fixed',
      }),
    );
    await waitForIframeLoad();
    const eventData = branch._publishEvent.mock.calls[0][1];
    expect(eventData.bannerHeight).toBe('800px');
    expect(eventData.isFullPageBanner).toBe(true);
    expect(eventData.bannerPagePlacement).toBe('bottom');
    expect(eventData.isBannerInline).toBe(false);
    expect(eventData.isBannerSticky).toBe(true);
  });

  it('uses the has_app CTA text when the user has the app', async function () {
    display(journeyHtml(METADATA), { has_app_websdk: true });
    await waitForIframeLoad();
    expect(spies.addDynamicCtaText).toHaveBeenCalledWith(
      document.getElementById('branch-banner-iframe'),
      'OPEN IT',
    );
  });

  it('falls back to OPEN/GET CTA text and {} metadata without a metadata block', async function () {
    display(journeyHtml(null), { has_app_websdk: true });
    await waitForIframeLoad();
    const iframe = document.getElementById('branch-banner-iframe');
    expect(spies.addDynamicCtaText).toHaveBeenCalledWith(iframe, 'OPEN');
    expect(spies.addIframeOuterCSS).toHaveBeenCalledWith(
      '#branch-banner-iframe { left: 0; }',
      undefined,
    );
    expect(spies.finalHookups.mock.calls[0][5]).toEqual({});
    // Old templates without metadata default to a sticky bottom banner.
    expect(branch._publishEvent.mock.calls[0][1].bannerPagePlacement).toBe(
      'bottom',
    );
  });

  it('uses GET when there is no app and no metadata', async function () {
    display(journeyHtml(null), { has_app_websdk: false });
    await waitForIframeLoad();
    expect(spies.addDynamicCtaText.mock.calls[0][1]).toBe('GET');
  });

  it('wraps a desktop journey iframe in #branch-banner-iframe-embed at the end of body', async function () {
    display(journeyHtml(METADATA), {}, { type: 'desktop' });
    const container = document.getElementById('branch-banner-iframe-embed');
    expect(container.parentNode).toBe(document.body);
    expect(document.body.lastChild).toBe(container);
    expect(container.firstChild.id).toBe('branch-banner-iframe');
    expect(journeys_utils.isDesktopJourney).toBe(true);
    await waitForIframeLoad();
  });

  it('replaces the $journeys_cta link in the html when one is set', async function () {
    branch._branchViewData = {
      data: { $journeys_cta: 'https://example.com/cta' },
    };
    const html =
      journeyHtml(METADATA) +
      '<script>validate("https://old.example.com");window.top.location.replace(x)</script>';
    display(html);
    await waitForIframeLoad();
    const rendered = spies.addHtmlToIframe.mock.calls[0][1];
    expect(rendered).toContain('validate("https://example.com/cta")');
    expect(rendered).toContain('window.top.location = x)');
  });

  it('records journey-load-time when the navigation timing API is enabled', async function () {
    const fresh = await loadBranchViewWithTiming({ navigationStart: 1 });
    try {
      display(journeyHtml(METADATA), {}, undefined, false, fresh.branch_view);
      await waitForIframeLoad();
      expect(branch._ctx.instrumentation['journey-load-time']).toBe('1234');
    } finally {
      fresh.env.setEnv(null);
    }
  });

  it('does not record journey-load-time when the navigation timing API is disabled', async function () {
    const fresh = await loadBranchViewWithTiming(undefined);
    try {
      display(journeyHtml(METADATA), {}, undefined, false, fresh.branch_view);
      await waitForIframeLoad();
      expect(branch._ctx.instrumentation['journey-load-time']).toBeUndefined();
    } finally {
      fresh.env.setEnv(null);
    }
  });

  describe('JSONP callback (window[callback_string])', function () {
    it('runs finalHookups with the CTA data and a null banner', async function () {
      display(journeyHtml(METADATA), {}, undefined, true);
      await waitForIframeLoad();
      spies.finalHookups.mockClear();

      const cta = { url: 'https://example.app.link/abc' };
      window.branch_view_callback__test(cta);

      expect(spies.finalHookups).toHaveBeenCalledTimes(1);
      expect(spies.finalHookups).toHaveBeenCalledWith(
        'template-1',
        'rule-1',
        store,
        cta,
        null,
        METADATA,
        true,
        branch_view,
      );
    });

    it('clears the timeout so the callback stays installed', async function () {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      display(journeyHtml(METADATA));
      await waitForIframeLoad();
      const callback = window.branch_view_callback__test;
      callback({});
      vi.advanceTimersByTime(branch._ctx.timeout);
      expect(window.branch_view_callback__test).toBe(callback);
    });

    it('is replaced by a no-op after ctx.timeout', async function () {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      display(journeyHtml(METADATA));
      await waitForIframeLoad();
      const callback = window.branch_view_callback__test;
      vi.advanceTimersByTime(branch._ctx.timeout);
      expect(window.branch_view_callback__test).not.toBe(callback);
      spies.finalHookups.mockClear();
      window.branch_view_callback__test({});
      expect(spies.finalHookups).not.toHaveBeenCalled();
    });

    it('still runs finalHookups if invoked before the iframe loads', function () {
      display(journeyHtml(METADATA));
      window.branch_view_callback__test({ cta: true });
      expect(spies.finalHookups).toHaveBeenCalledTimes(1);
      expect(spies.finalHookups.mock.calls[0][3]).toEqual({ cta: true });
      expect(spies.finalHookups.mock.calls[0][4]).toBeNull();
      return waitForIframeLoad();
    });
  });
});

describe('branch_view._getPageviewRequestData', function () {
  let store;

  beforeEach(function () {
    testUtils.go('');
    localStorage.clear();
    sessionStorage.clear();
    store = new storageModule.BranchStorage(['local']);
  });

  afterEach(function () {
    vi.restoreAllMocks();
    setEnv(null);
    testUtils.go('');
    localStorage.clear();
    sessionStorage.clear();
    restoreModuleState();
  });

  it('builds a pageview request with defaults', function () {
    const branch = makeJourneyBranch(store);
    journeys_utils._callback_index = 5;
    journeys_utils.entryAnimationDisabled = true;
    journeys_utils.exitAnimationDisabled = true;

    const obj = branch_view._getPageviewRequestData(
      undefined,
      undefined,
      branch,
    );

    expect(journeys_utils.branch).toBe(branch);
    expect(journeys_utils.entryAnimationDisabled).toBe(false);
    expect(journeys_utils.exitAnimationDisabled).toBe(false);
    expect(journeys_utils._callback_index).toBe(6);

    const data = JSON.parse(obj.data);
    delete obj.data;
    expect(obj).toEqual({
      event: 'pageview',
      metadata: {},
      initial_referrer: '',
      is_iframe: false,
      user_language: navigator.language.substring(0, 2).toLowerCase(),
      open_app: false,
      has_app_websdk: false,
      feature: 'journeys',
      callback_string: 'branch_view_callback__5',
      session_referring_link_data: null,
      source: 'web-sdk',
    });
    expect(data.$canonical_url).toBe(window.location.href);
    expect(data.link_click_id).toBeUndefined();
  });

  it('uses "dismiss" as the event for dismiss requests', function () {
    const obj = branch_view._getPageviewRequestData(
      { a: 1 },
      {},
      makeJourneyBranch(store),
      true,
    );
    expect(obj.event).toBe('dismiss');
    expect(obj.metadata).toEqual({ a: 1 });
  });

  it('applies the options', function () {
    const obj = branch_view._getPageviewRequestData(
      {},
      {
        disable_entry_animation: true,
        disable_exit_animation: true,
        user_language: 'FR',
        branch_view_id: 'bv-1',
        no_journeys: true,
        open_app: true,
      },
      makeJourneyBranch(store),
    );
    expect(journeys_utils.entryAnimationDisabled).toBe(true);
    expect(journeys_utils.exitAnimationDisabled).toBe(true);
    expect(obj.user_language).toBe('fr');
    expect(obj.branch_view_id).toBe('bv-1');
    expect(obj.no_journeys).toBe(true);
    expect(obj.open_app).toBe(true);
  });

  it('keeps an explicit no_journeys=false and omits it when unset', function () {
    const withFalse = branch_view._getPageviewRequestData(
      {},
      { no_journeys: false },
      makeJourneyBranch(store),
    );
    expect(withFalse.no_journeys).toBe(false);
    const without = branch_view._getPageviewRequestData(
      {},
      {},
      makeJourneyBranch(store),
    );
    expect('no_journeys' in without).toBe(false);
  });

  it('reads branch_view_id from the _branch_view_id URL parameter', function () {
    testUtils.go('?_branch_view_id=from-url');
    const obj = branch_view._getPageviewRequestData(
      {},
      {},
      makeJourneyBranch(store),
    );
    expect(obj.branch_view_id).toBe('from-url');
  });

  it('falls back to "en" when the browser language is unknown', function () {
    setEnv(makeFakeEnv({ browserLanguageCode: () => null }));
    const obj = branch_view._getPageviewRequestData(
      {},
      {},
      makeJourneyBranch(store),
    );
    expect(obj.user_language).toBe('en');
  });

  it('adds the referring link as initial_referrer and link_click_id', function () {
    const branch = makeJourneyBranch(store);
    branch._referringLink.mockImplementation(function (withExpiry) {
      return withExpiry
        ? 'https://example.app.link/clickid123?x=1'
        : 'https://example.app.link/referrer';
    });
    const obj = branch_view._getPageviewRequestData({}, {}, branch);
    expect(obj.initial_referrer).toBe('https://example.app.link/referrer');
    expect(JSON.parse(obj.data).link_click_id).toBe('clickid123?x=1');
  });

  it('omits link_click_id with make_new_link', function () {
    const branch = makeJourneyBranch(store);
    branch._referringLink.mockReturnValue('https://example.app.link/abc');
    const obj = branch_view._getPageviewRequestData(
      {},
      { make_new_link: true },
      branch,
    );
    expect(JSON.parse(obj.data).link_click_id).toBeUndefined();
  });

  it('copies session fields, journey dismissals and whitelisted session data', function () {
    session.set(store, {
      has_app: true,
      identity: 'user-1',
      session_link_click_id: 'slcid',
      data: JSON.stringify({
        '+referrer': 'https://ref.example.com',
        '$journeys_title': 'Hello',
        'other': 'dropped',
      }),
    });
    store.set(
      'journeyDismissals',
      JSON.stringify({ t1: { view_id: 't1' } }),
      true,
    );

    const obj = branch_view._getPageviewRequestData(
      {},
      {},
      makeJourneyBranch(store),
    );

    expect(obj.has_app_websdk).toBe(true);
    expect(obj.identity).toBe('user-1');
    expect(obj.session_link_click_id).toBe('slcid');
    // Passed through as the stored string.
    expect(obj.journey_dismissals).toBe('{"t1":{"view_id":"t1"}}');
    expect(obj.session_referring_link_data).toBe(
      JSON.stringify({
        '+referrer': 'https://ref.example.com',
        '$journeys_title': 'Hello',
        'other': 'dropped',
      }),
    );
    const data = JSON.parse(obj.data);
    expect(data['+referrer']).toBe('https://ref.example.com');
    expect(data.$journeys_title).toBe('Hello');
    expect(data.other).toBeUndefined();
  });

  it('starts from _branchViewData without mutating it', function () {
    const branch = makeJourneyBranch(store, {
      _branchViewData: {
        tags: ['t'],
        data: { custom: 'value', $og_title: 'Mine' },
      },
    });
    branch._referringLink.mockReturnValue('https://example.app.link/abc');

    const obj = branch_view._getPageviewRequestData({}, {}, branch);

    expect(obj.tags).toEqual(['t']);
    const data = JSON.parse(obj.data);
    expect(data.custom).toBe('value');
    expect(data.$og_title).toBe('Mine');
    expect(data.link_click_id).toBe('abc');
    expect(branch._branchViewData).toEqual({
      tags: ['t'],
      data: { custom: 'value', $og_title: 'Mine' },
    });
  });

  it('includes hosted deep link data from meta tags', function () {
    const meta = document.createElement('meta');
    meta.name = 'branch:deeplink:hosted_key';
    meta.content = 'hosted_value';
    document.head.appendChild(meta);
    try {
      const obj = branch_view._getPageviewRequestData(
        {},
        {},
        makeJourneyBranch(store),
      );
      expect(JSON.parse(obj.data).hosted_key).toBe('hosted_value');
    } finally {
      document.head.removeChild(meta);
    }
  });
});
