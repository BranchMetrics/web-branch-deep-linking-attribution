'use strict';

var sinon = require('sinon');

goog.require('journeys_v2.interactions');
goog.require('utils');

describe('journeys_v2.interactions.awaitCta', function () {
  const assert = testUtils.unplanned();
  var clock;
  var CB = 'branch_view_callback__test';

  beforeEach(function () {
    clock = sinon.useFakeTimers();
  });
  afterEach(function () {
    clock.restore();
    delete window[CB];
  });

  it('hands the CTA function to onCta when the injected script calls back', function () {
    var onCta = sinon.spy();
    journeys_v2.interactions.awaitCta(CB, onCta);
    var cta = function () {};
    window[CB](cta);
    assert.strictEqual(onCta.calledOnceWith(cta), true);
    window[CB](cta);
    assert.strictEqual(onCta.calledOnce, true, 'later calls are swallowed');
  });

  it('gives up after utils.timeout and ignores a late callback', function () {
    var onCta = sinon.spy();
    journeys_v2.interactions.awaitCta(CB, onCta);
    clock.tick(utils.timeout);
    window[CB](function () {});
    assert.strictEqual(onCta.called, false);
  });

  it('can be cancelled by the caller', function () {
    var onCta = sinon.spy();
    journeys_v2.interactions.awaitCta(CB, onCta).cancel();
    window[CB](function () {});
    assert.strictEqual(onCta.called, false);
  });

  it('leaves the shared NOOP on the global once settled, so the render graph is not pinned', function () {
    journeys_v2.interactions.awaitCta(CB, function () {});
    window[CB](function () {});
    assert.strictEqual(
      window[CB],
      journeys_v2.interactions.NOOP,
      'after callback',
    );

    journeys_v2.interactions.awaitCta(CB, function () {}).cancel();
    assert.strictEqual(
      window[CB],
      journeys_v2.interactions.NOOP,
      'after cancel',
    );

    journeys_v2.interactions.awaitCta(CB, function () {});
    clock.tick(utils.timeout);
    assert.strictEqual(
      window[CB],
      journeys_v2.interactions.NOOP,
      'after timeout',
    );
  });
});

describe('journeys_v2.interactions.bind', function () {
  const assert = testUtils.unplanned();
  var iframe;

  beforeEach(function () {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframe.contentWindow.document.body.innerHTML =
      '<div id="branch-banner">' +
      '  <div class="branch-banner-dismiss-background"></div>' +
      '  <button id="branch-mobile-action">Get</button>' +
      '  <a class="branch-banner-close"></a>' +
      '  <a class="branch-banner-continue"></a>' +
      '</div>';
  });

  afterEach(function () {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  });

  function fire(selector, type) {
    var doc = iframe.contentWindow.document;
    var e = doc.createEvent('Event');
    e.initEvent(type, true, true);
    doc.querySelector(selector).dispatchEvent(e);
  }

  it('routes the CTA click and each dismiss element to the right handler', function () {
    var handlers = { onCta: sinon.spy(), onDismiss: sinon.spy() };
    journeys_v2.interactions.bind(iframe, handlers);

    fire('#branch-mobile-action', 'click');
    assert.strictEqual(handlers.onCta.calledOnce, true);

    fire('.branch-banner-close', 'click');
    fire('.branch-banner-continue', 'click');
    fire('.branch-banner-dismiss-background', 'click');
    fire('.branch-banner-dismiss-background', 'touchmove');
    assert.deepEqual(
      handlers.onDismiss.args.map(function (a) {
        return a[0];
      }),
      [
        'didClickJourneyClose',
        'didClickJourneyContinue',
        'didClickJourneyBackgroundDismiss',
        'didScrollJourneyBackgroundDismiss',
      ],
    );
  });

  it('is fine with creatives that lack some elements', function () {
    iframe.contentWindow.document.body.innerHTML =
      '<div id="branch-banner"></div>';
    var handlers = { onCta: sinon.spy(), onDismiss: sinon.spy() };
    journeys_v2.interactions.bind(iframe, handlers);
    assert.strictEqual(handlers.onCta.called, false);
  });
});
