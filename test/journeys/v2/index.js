'use strict';

var sinon = require('sinon');

goog.require('branch_view');
goog.require('journeys_utils');
goog.require('journeys_v2');
goog.require('journeys_v2.animation.Animator');
goog.require('resources');
goog.require('utils');

var METADATA = {
  bannerHeight: '76px',
  position: 'top',
  sticky: 'absolute',
  injectorSelector: '.branch-journeys-top',
  ctaText: { has_app: 'Open', no_app: 'Get' },
  globalDismissPeriod: -1,
};

function blob(metadata) {
  return (
    '<html><head>' +
    '<style type="text/css" id="branch-css">#branch-banner { color: red; }</style>' +
    '<style type="text/css" id="branch-iframe-css">body { margin-top: 76px; }</style>' +
    '</head><body>' +
    '<div id="branch-banner"><div class="branch-banner-content">' +
    '<button id="branch-mobile-action">x</button><a class="branch-banner-close"></a>' +
    '</div></div>' +
    '<script type="application/json">' +
    JSON.stringify(metadata || METADATA) +
    '</script>' +
    '<script type="text/javascript">window.__ctaScriptRan = true;</script>' +
    '</body></html>'
  );
}

function fakeStorage() {
  var store = {};
  return {
    get: function (key) {
      return store.hasOwnProperty(key) ? store[key] : null;
    },
    set: function (key, value) {
      store[key] = value;
    },
    remove: function (key) {
      delete store[key];
    },
    _store: store,
  };
}

function cleanupDom() {
  [
    'branch-banner',
    'branch-banner-iframe',
    'branch-iframe-css',
    'branch-journey-cta',
    'branch-banner-no-scroll-css',
  ].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
  document.body.className = '';
}

describe('displayJourney', function () {
  const assert = testUtils.unplanned();

  beforeEach(function () {
    journeys_utils.branch = { _storage: fakeStorage() };
    journeys_utils.exitAnimationIsRunning = false;
  });

  afterEach(function () {
    cleanupDom();
  });

  it('_getPageviewRequestData keeps the pageview animation flags across a dismiss-request build', function () {
    var branch = {
      _storage: {
        get: function () {
          return null;
        },
      },
      _branchViewData: {},
      _referringLink: function () {
        return null;
      },
    };
    branch_view._getPageviewRequestData(
      {},
      { disable_entry_animation: true, disable_exit_animation: true },
      branch,
      false,
    );
    assert.strictEqual(journeys_utils.entryAnimationDisabled, true);

    branch_view._getPageviewRequestData({}, null, branch, true);
    assert.strictEqual(
      journeys_utils.entryAnimationDisabled,
      true,
      'dismiss build did not reset',
    );
    assert.strictEqual(journeys_utils.exitAnimationDisabled, true);

    branch_view._getPageviewRequestData({}, {}, branch, false);
    assert.strictEqual(
      journeys_utils.entryAnimationDisabled,
      false,
      'next pageview does reset',
    );
  });

  it('bails on malformed metadata JSON in the legacy path instead of leaving the placeholder stuck forever', function () {
    var malformedHtml =
      '<html><body><script type="application/json">{not json</script></body></html>';

    assert.doesNotThrow(function () {
      branch_view.displayJourney(
        malformedHtml,
        { callback_string: 'cb' },
        'template-id',
        {},
        false,
        { type: 'mobile_web' },
        journeys_utils.branch,
        {}, // Ensure options is safely passed down
      );
    });

    assert.strictEqual(
      document.getElementById('branch-banner'),
      null,
      'placeholder removed',
    );
  });
});

describe('branch_view.displayJourney fork', function () {
  const assert = testUtils.unplanned();
  var spy;

  beforeEach(function () {
    journeys_utils.branch = { _storage: fakeStorage() };
    journeys_utils.exitAnimationIsRunning = false;
    spy = sinon.stub(journeys_v2, 'displayJourney');
  });

  afterEach(function () {
    spy.restore();
    cleanupDom();
  });

  function display(branchViewData, branch, options) {
    branch_view.displayJourney(
      null,
      { callback_string: 'cb' },
      'template-id',
      branchViewData,
      false,
      { type: 'mobile_web' },
      branch,
      options || {}, // Prevent options from being undefined
    );
  }

  it('routes to journeys_v2 with a params object when use_v2_renderer is true', function () {
    display({ audience_rule_id: 'r1' }, journeys_utils.branch, {
      use_v2_renderer: true,
      entryAnimationDisabled: true,
      exitAnimationDisabled: false,
    });
    assert.strictEqual(
      spy.calledOnce,
      true,
      'displayJourney should route to v2',
    );
    var params = spy.getCall(0).args[0];
    assert.strictEqual(params.branch, journeys_utils.branch);
    assert.strictEqual(params.branchView, branch_view);
    assert.strictEqual(params.templateId, 'template-id');
    assert.strictEqual(params.branchViewData.audience_rule_id, 'r1');
    assert.strictEqual(params.placeholder.id, 'branch-banner');
    assert.deepEqual(params.options, {
      animationConfig: undefined,
      entryAnimationDisabled: true,
      exitAnimationDisabled: false,
    });
  });

  it('falls back to the init-time disable_*_animation when the caller passed no flag', function () {
    var branch = {
      init_options: {
        disable_entry_animation: true,
        disable_exit_animation: true,
      },
    };
    display({}, branch, {
      use_v2_renderer: true,
      entryAnimationDisabled: undefined,
      exitAnimationDisabled: undefined,
    });
    assert.strictEqual(
      spy.calledOnce,
      true,
      'displayJourney should route to v2',
    );
    assert.deepEqual(spy.getCall(0).args[0].options, {
      animationConfig: undefined,
      entryAnimationDisabled: true,
      exitAnimationDisabled: true,
    });
  });

  it('lets an explicit per-call false override the init-time default', function () {
    var branch = {
      init_options: {
        disable_entry_animation: true,
        disable_exit_animation: true,
      },
    };
    display({}, branch, {
      use_v2_renderer: true,
      entryAnimationDisabled: false,
      exitAnimationDisabled: true,
    });
    assert.strictEqual(
      spy.calledOnce,
      true,
      'displayJourney should route to v2',
    );
    assert.deepEqual(spy.getCall(0).args[0].options, {
      animationConfig: undefined,
      entryAnimationDisabled: false,
      exitAnimationDisabled: true,
    });
  });

  it('never reads branch/animation state off journeys_utils - only what the caller passed in', function () {
    journeys_utils.branch = { _storage: fakeStorage(), tag: 'stale-global' };
    journeys_utils.entryAnimationDisabled = true;
    journeys_utils.exitAnimationDisabled = true;
    var callerBranch = { tag: 'passed-in' };
    display({}, callerBranch, {
      use_v2_renderer: true,
      entryAnimationDisabled: false,
      exitAnimationDisabled: false,
    });
    assert.strictEqual(
      spy.calledOnce,
      true,
      'displayJourney should route to v2',
    );
    var params = spy.getCall(0).args[0];
    assert.strictEqual(params.branch, callerBranch);
    assert.deepEqual(params.options, {
      animationConfig: undefined,
      entryAnimationDisabled: false,
      exitAnimationDisabled: false,
    });
  });

  it('keeps the legacy path when use_v2_renderer is false or missing', function () {
    display({}, journeys_utils.branch, { use_v2_renderer: false });
    assert.strictEqual(spy.called, false);

    display({}, journeys_utils.branch, {});
    assert.strictEqual(spy.called, false);
  });

  it('does not let a stale legacy exitAnimationIsRunning cooldown drop a v2 render', function () {
    journeys_utils.exitAnimationIsRunning = true;
    display({}, journeys_utils.branch, { use_v2_renderer: true });
    assert.strictEqual(
      spy.calledOnce,
      true,
      'displayJourney should route to v2',
    );
  });

  it('still blocks the legacy path while exitAnimationIsRunning is true', function () {
    journeys_utils.exitAnimationIsRunning = true;
    display({}, journeys_utils.branch, { use_v2_renderer: false });
    assert.strictEqual(
      document.getElementById('branch-banner'),
      null,
      'no placeholder was even created',
    );
  });
});

describe('journeys_v2 assembler', function () {
  const assert = testUtils.unplanned();
  var clock;
  var platformStub;
  var branch;
  var branchView;
  var hostNav;

  beforeEach(function () {
    clock = sinon.useFakeTimers(1000000);
    platformStub = sinon.stub(utils, 'getPlatformByUserAgent').returns('ios');
    branch = {
      _storage: fakeStorage(),
      _publishEvent: sinon.spy(),
      _api: sinon.spy(),
      _branchViewData: {},
    };
    branchView = {
      _getPageviewRequestData: sinon.stub().returns({ branch_view_id: 'bv-1' }),
      shouldDisplayJourney: sinon.stub().returns(true),
      displayJourney: sinon.spy(),
    };
    hostNav = document.createElement('div');
    hostNav.innerHTML = '<div class="branch-journeys-top"></div>';
    document.body.appendChild(hostNav);
    journeys_v2.active = null;
    delete window.__ctaScriptRan;
  });

  afterEach(function () {
    clock.restore();
    platformStub.restore();
    if (hostNav.parentNode) {
      hostNav.parentNode.removeChild(hostNav);
    }
    journeys_v2.active = null;
    cleanupDom();
  });

  function params(overrides) {
    var placeholder = document.createElement('div');
    placeholder.id = 'branch-banner';
    document.body.appendChild(placeholder);
    return Object.assign(
      {
        branch: branch,
        branchView: branchView,
        html: blob(),
        requestData: {
          callback_string: 'branch_view_callback__t',
          has_app_websdk: true,
        },
        templateId: 't1',
        branchViewData: { audience_rule_id: 'r1' },
        testMode: false,
        linkData: { journey_id: 'j1', type: 'mobile_web' },
        placeholder: placeholder,
        options: {
          entryAnimationDisabled: false,
          exitAnimationDisabled: false,
        },
      },
      overrides || {},
    );
  }

  function events() {
    return branch._publishEvent.args.map(function (a) {
      return a[0];
    });
  }

  function fire(iframe, selector, type) {
    var doc = iframe.contentWindow.document;
    var e = doc.createEvent('Event');
    e.initEvent(type || 'click', true, true);
    doc.querySelector(selector).dispatchEvent(e);
  }

  function render(overrides) {
    journeys_v2.displayJourney(params(overrides));
    var iframe = document.getElementById('branch-banner-iframe');
    if (iframe) {
      iframe.onload();
    }
    return iframe;
  }

  it('bails without html: placeholder removed, nothing active', function () {
    render({ html: null });
    assert.strictEqual(document.getElementById('branch-banner'), null);
    assert.strictEqual(journeys_v2.active, null);
    assert.strictEqual(branch._publishEvent.called, false);
  });

  it('bails on malformed metadata JSON instead of leaving the placeholder stuck forever', function () {
    var malformedBlob = blob().replace(
      '<script type="application/json">' +
        JSON.stringify(METADATA) +
        '</script>',
      '<script type="application/json">{not json</script>',
    );
    assert.doesNotThrow(function () {
      render({ html: malformedBlob });
    });
    assert.strictEqual(
      document.getElementById('branch-banner'),
      null,
      'placeholder removed',
    );
    assert.strictEqual(
      document.getElementById('branch-banner-iframe'),
      null,
      'no iframe mounted',
    );
    assert.strictEqual(journeys_v2.active, null);
    assert.strictEqual(branch._publishEvent.called, false);
  });

  it('renders the served template without recomputing anything', function () {
    var iframe = render();
    var doc = iframe.contentWindow.document;

    assert.strictEqual(
      doc.getElementById('branch-banner').className,
      'branch-banner-enter', // <-- Updated to expect the new animator class
      'creative mounted',
    );
    assert.strictEqual(doc.body.className, 'branch-banner-ios');
    assert.strictEqual(
      doc.head.querySelector('#branch-css').innerHTML,
      '#branch-banner { color: red; }',
    );
    assert.strictEqual(
      document.head.querySelector('#branch-iframe-css').innerHTML,
      'body { margin-top: 76px; }',
    );
    assert.strictEqual(
      doc.getElementById('branch-mobile-action').innerHTML,
      'Open',
      'has_app cta text',
    );
    var ctaScript = document.getElementById('branch-journey-cta');
    assert.strictEqual(
      ctaScript.parentNode,
      document.body,
      'cta script installed in the parent page',
    );
    assert.strictEqual(ctaScript.innerHTML, 'window.__ctaScriptRan = true;');
    assert.strictEqual(
      hostNav.style.marginTop,
      '76px',
      'injector parent pushed',
    );
    assert.strictEqual(
      document.getElementById('branch-banner'),
      null,
      'placeholder removed',
    );
    assert.ok(/branch-banner-is-active/.test(document.body.className));
    assert.strictEqual(
      iframe.style.top,
      '',
      'iframe is never moved off-screen',
    );

    assert.deepEqual(events(), ['willShowJourney']);
    var show = branch._publishEvent.getCall(0).args[1];
    assert.strictEqual(show.bannerPagePlacement, 'top');
    assert.strictEqual(show.isBannerInline, true);
    assert.deepEqual(show.journey_link_data, {
      journey_id: 'j1',
      type: 'mobile_web',
    });

    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.deepEqual(events(), ['willShowJourney', 'didShowJourney']);
    assert.strictEqual(journeys_v2.active.shown, true);
  });

  it('$journeys_cta override rewrites the CTA script before it is installed', function () {
    var ctaBlob = blob().replace(
      '<script type="text/javascript">window.__ctaScriptRan = true;</script>',
      '<script type="text/javascript">window.top.location.replace(validate("https://bnc.lt/original"));</script>',
    );
    branch._branchViewData = {
      data: { '$journeys_cta': 'https://example.com/override' },
    };
    render({ html: ctaBlob });

    var ctaScript = document.getElementById('branch-journey-cta');
    assert.strictEqual(
      ctaScript.innerHTML,
      'window.top.location = validate("https://example.com/override")',
    );
  });

  it('refuses a second render while one is active', function () {
    render();
    var second = params();
    journeys_v2.displayJourney(second);
    assert.strictEqual(
      document.querySelectorAll('#branch-banner-iframe').length,
      1,
    );
    assert.strictEqual(second.placeholder.parentNode, null);
  });

  it('CTA: waits for the callback handshake, then click publishes, runs the cta, and closes without a dismiss request', function () {
    var iframe = render();
    var cta = sinon.spy();
    fire(iframe, '#branch-mobile-action');
    assert.strictEqual(
      events().indexOf('didClickJourneyCTA'),
      -1,
      'not bound before the handshake',
    );

    window['branch_view_callback__t'](cta);
    fire(iframe, '#branch-mobile-action');
    assert.strictEqual(cta.calledOnce, true);
    assert.deepEqual(events(), [
      'willShowJourney',
      'didClickJourneyCTA',
      'willCloseJourney',
    ]);

    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.strictEqual(document.getElementById('branch-banner-iframe'), null);
    assert.strictEqual(document.getElementById('branch-iframe-css'), null);
    assert.strictEqual(document.getElementById('branch-journey-cta'), null);
    assert.strictEqual(hostNav.style.marginTop, '');
    assert.strictEqual(journeys_v2.active, null);
    assert.strictEqual(events().pop(), 'didCloseJourney');
    assert.strictEqual(branch._api.called, false);
  });

  it('CTA: a double click only fires didClickJourneyCTA / cta() once', function () {
    var iframe = render();
    var cta = sinon.spy();
    window['branch_view_callback__t'](cta);
    fire(iframe, '#branch-mobile-action');
    fire(iframe, '#branch-mobile-action');
    assert.strictEqual(cta.calledOnce, true);
    assert.strictEqual(
      events().filter(function (e) {
        return e === 'didClickJourneyCTA';
      }).length,
      1,
    );
  });

  it('a dismiss tap during a CTA-triggered exit is ignored: no dismissal storage, no v1/dismiss', function () {
    var iframe = render();
    window['branch_view_callback__t'](function () {});
    fire(iframe, '#branch-mobile-action');
    fire(iframe, '.branch-banner-close');
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.strictEqual(events().indexOf('didClickJourneyClose'), -1);
    assert.strictEqual(
      Object.keys(branch._storage._store).length,
      0,
      'no dismissal recorded',
    );
    assert.strictEqual(branch._api.called, false);
    assert.strictEqual(journeys_v2.active, null);
  });

  it('a CTA tap during a dismiss-triggered exit is ignored: no didClickJourneyCTA, cta() not run', function () {
    var iframe = render();
    var cta = sinon.spy();
    window['branch_view_callback__t'](cta);
    fire(iframe, '.branch-banner-close');
    fire(iframe, '#branch-mobile-action');
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.strictEqual(cta.called, false);
    assert.strictEqual(events().indexOf('didClickJourneyCTA'), -1);
    assert.strictEqual(
      branch._api.calledOnce,
      true,
      'the dismiss still goes out',
    );
  });

  it('recovers when the iframe was removed out-of-band: the next render proceeds instead of being refused forever', function () {
    var iframe = render();
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.strictEqual(hostNav.style.marginTop, '76px');

    // An SPA route change / body swap yanks the banner without going through close().
    iframe.parentNode.removeChild(iframe);
    var stale = journeys_v2.active;
    assert.ok(stale, 'active is still latched on the dead journey');

    branch._publishEvent.resetHistory();
    var second = render();
    assert.ok(second, 'second journey rendered');
    assert.notStrictEqual(journeys_v2.active, stale);
    assert.strictEqual(
      document.querySelectorAll('#branch-banner-iframe').length,
      1,
    );
    assert.strictEqual(
      hostNav.style.marginTop,
      '76px',
      'pushed again by the new render',
    );
    assert.deepEqual(
      events(),
      ['willShowJourney'],
      'no close events for the journey that was never on screen to close',
    );
    assert.strictEqual(
      document.getElementById('branch-banner'),
      null,
      'placeholder consumed',
    );
  });

  it('closeActiveJourney on a journey whose DOM was already ripped out is a no-op: no close events, no teardown of live state', function () {
    render();
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    var iframe = document.getElementById('branch-banner-iframe');

    // An SPA route change / body swap yanks the banner without going through close().
    iframe.parentNode.removeChild(iframe);

    branch._publishEvent.resetHistory();
    assert.strictEqual(
      journeys_v2.closeActiveJourney(branch),
      false,
      'nothing live to close',
    );
    assert.strictEqual(
      branch._publishEvent.called,
      false,
      'no didCallJourneyClose/willCloseJourney/didCloseJourney for a banner already gone',
    );
    assert.strictEqual(journeys_v2.active, null);

    // The next render proceeds normally, matching displayJourney's own stale-DOM recovery.
    var second = render();
    assert.ok(second, 'second journey rendered');
  });

  it('a relative-height creative without a scrim gets its content pinned to the resolved height', function () {
    var iframe = render({
      html: blob(Object.assign({}, METADATA, { bannerHeight: '50vh' })),
    });
    var content = iframe.contentWindow.document.getElementsByClassName(
      'branch-banner-content',
    )[0];
    assert.strictEqual(content.style.height, window.innerHeight / 2 + 'px');
    assert.strictEqual(
      hostNav.style.marginTop,
      window.innerHeight / 2 + 'px',
      'injector push is px, not vh',
    );
    assert.strictEqual(
      branch._publishEvent.getCall(0).args[1].bannerHeight,
      window.innerHeight / 2 + 'px',
    );
  });

  it('dismiss/close still works when the CTA handshake never completes', function () {
    var iframe = render();
    clock.tick(utils.timeout);
    fire(iframe, '.branch-banner-close');
    assert.notStrictEqual(events().indexOf('didClickJourneyClose'), -1);
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.strictEqual(events().pop(), 'didCloseJourney');
  });

  it('a fast dismiss during entrance does not let didShowJourney fire after didCloseJourney', function () {
    var iframe = render();
    window['branch_view_callback__t'](function () {});
    // Dismiss immediately, before the entrance wait (still pending - SETTLE_MS hasn't elapsed) resolves.
    fire(iframe, '.branch-banner-close');
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS + 10);
    assert.deepEqual(events(), [
      'willShowJourney',
      'didClickJourneyClose',
      'willCloseJourney',
      'didCloseJourney',
    ]);
    assert.strictEqual(journeys_v2.active, null);
  });

  it('dismiss: records storage, closes, sends v1/dismiss with the mapped source, chains the next journey', function () {
    var iframe = render();
    window['branch_view_callback__t'](function () {});
    fire(iframe, '.branch-banner-close');

    assert.notStrictEqual(events().indexOf('didClickJourneyClose'), -1);
    assert.strictEqual(
      branch._storage._store['globalJourneysDismiss'],
      true,
      'globalDismissPeriod -1',
    );
    assert.ok(branch._storage._store['journeyDismissals'].indexOf('"r1"') > -1);
    assert.strictEqual(
      branch._api.called,
      false,
      'request waits for the close',
    );

    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.strictEqual(branch._api.calledOnce, true);
    assert.strictEqual(branch._api.getCall(0).args[0], resources.dismiss);
    assert.strictEqual(
      branch._api.getCall(0).args[1].dismissal_source,
      'Button(X)',
    );
    assert.strictEqual(
      branchView._getPageviewRequestData.getCall(0).args[2],
      branch,
    );

    var next = {
      template: '<html>next</html>',
      event_data: { branch_view_data: { id: 'bv-2' } },
      journey_link_data: {},
    };
    branch._api.getCall(0).args[2](null, next);
    assert.strictEqual(branchView.displayJourney.calledOnce, true);
    assert.strictEqual(branchView.displayJourney.getCall(0).args[2], 'bv-1');
    assert.strictEqual(
      branchView.displayJourney.getCall(0).args[6],
      branch,
      'passes ctx.branch explicitly, not via journeys_utils',
    );

    assert.deepEqual(branchView.displayJourney.getCall(0).args[7], {
      animationConfig: undefined,
      entryAnimationDisabled: false,
      exitAnimationDisabled: false,
    });
  });

  it('dismiss in test mode: publishes and closes but touches neither storage nor the API', function () {
    var iframe = render({ testMode: true });
    window['branch_view_callback__t'](function () {});
    fire(iframe, '.branch-banner-close');
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.strictEqual(Object.keys(branch._storage._store).length, 0);
    assert.strictEqual(branch._api.called, false);
    assert.strictEqual(journeys_v2.active, null);
  });

  it('closeActiveJourney: false until shown (matches legacy), true once shown, closes correctly', function () {
    assert.strictEqual(journeys_v2.closeActiveJourney(branch), false);
    render();
    assert.strictEqual(
      journeys_v2.closeActiveJourney(branch),
      false,
      'not shown yet - same invariant as legacy: shown always precedes close',
    );
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.deepEqual(events(), ['willShowJourney', 'didShowJourney']);
    assert.strictEqual(journeys_v2.closeActiveJourney(branch), true);
    assert.strictEqual(
      journeys_v2.closeActiveJourney(branch),
      false,
      'already closing',
    );
    assert.deepEqual(events().slice(-2), [
      'didCallJourneyClose',
      'willCloseJourney',
    ]);
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.strictEqual(journeys_v2.active, null);
    assert.strictEqual(events().pop(), 'didCloseJourney');
  });

  it("closeActiveJourney publishes didCallJourneyClose on the calling instance, not the journey's own branch", function () {
    render();
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    var otherInstance = { _publishEvent: sinon.spy() };
    journeys_v2.closeActiveJourney(otherInstance);
    assert.strictEqual(
      otherInstance._publishEvent.calledOnceWith('didCallJourneyClose'),
      true,
    );
    assert.strictEqual(
      branch._publishEvent.args.some(function (a) {
        return a[0] === 'didCallJourneyClose';
      }),
      false,
      "not published on the journey's own branch",
    );
  });

  it('shown (and didShowJourney) wait for a slow custom entrance animation to actually finish', function () {
    var animatedBlob = blob().replace(
      '#branch-banner { color: red; }',
      '#branch-banner { animation: x 10s; }',
    );
    render({ html: animatedBlob });
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.strictEqual(
      events().indexOf('didShowJourney'),
      -1,
      'must not fire before the 10s animation ends',
    );
    assert.strictEqual(
      journeys_v2.closeActiveJourney(branch),
      false,
      'not shown yet',
    );
    clock.tick(10000 + journeys_v2.animation.Animator.FALLBACK_GRACE_MS);
    assert.notStrictEqual(
      events().indexOf('didShowJourney'),
      -1,
      'fires once the fallback duration elapses',
    );
    assert.strictEqual(journeys_v2.closeActiveJourney(branch), true);
  });

  it('branch_view.closeActiveJourney prefers v2 and falls back to legacy', function () {
    journeys_utils.banner = null;
    journeys_utils.isJourneyDisplayed = false;
    assert.strictEqual(branch_view.closeActiveJourney(branch), false);
    render();
    clock.tick(journeys_v2.animation.Animator.SETTLE_MS);
    assert.strictEqual(branch_view.closeActiveJourney(branch), true);
  });
});
