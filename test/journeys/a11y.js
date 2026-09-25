'use strict';

goog.require('journeys_a11y');

describe('journeys_a11y', function () {
  const assert = testUtils.unplanned();
  var iframe;

  beforeEach(function () {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
  });

  afterEach(function () {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  });

  function doc(markup) {
    var d = iframe.contentWindow.document;
    d.body.innerHTML = markup;
    return d;
  }

  it('installs the keyboard script only when the wcag meta is present', function () {
    var d = doc(
      '<div id="branch-banner"></div><meta name="accessibility" content="wcag" />',
    );
    assert.strictEqual(journeys_a11y.isRequested(d), true);
    assert.strictEqual(journeys_a11y.install(d), true);
    var scripts = d.body.getElementsByTagName('script');
    assert.strictEqual(scripts.length, 1);
    assert.strictEqual(scripts[0].text, journeys_a11y.SCRIPT);
  });

  it('does nothing without the meta, or with another value', function () {
    assert.strictEqual(
      journeys_a11y.install(doc('<div id="branch-banner"></div>')),
      false,
    );
    assert.strictEqual(
      journeys_a11y.install(
        doc('<meta name="accessibility" content="basic" />'),
      ),
      false,
    );
    assert.strictEqual(doc('').body.getElementsByTagName('script').length, 0);
  });

  // journeys_a11y.SCRIPT runs inside the iframe's own realm, not this one, and jsdom doesn't
  // execute injected <script> tags - so its logic is exercised directly here with fake
  // document/setTimeout, standing in for a creative with no button/[href]/.branch-banner-content
  // match (the empty-NodeList case the guard exists for).
  it('SCRIPT does not throw on the deferred initial focus or a Tab press when there is nothing focusable', function () {
    var focusableContent = [];
    var fakeModal = {
      querySelectorAll: function () {
        return focusableContent;
      },
    };
    var keydownHandler;
    var fakeDoc = {
      getElementById: function () {
        return fakeModal;
      },
      addEventListener: function (type, handler) {
        keydownHandler = handler;
      },
      activeElement: null,
    };
    var deferred = [];
    var fakeSetTimeout = function (fn) {
      deferred.push(fn);
    };

    assert.doesNotThrow(function () {
      new Function('document', 'setTimeout', journeys_a11y.SCRIPT)(
        fakeDoc,
        fakeSetTimeout,
      );
    });
    assert.strictEqual(
      deferred.length,
      0,
      'initial focus is skipped rather than deferred to throw later',
    );

    var tabEvent = {
      key: 'Tab',
      keyCode: 9,
      shiftKey: false,
      preventDefault: function () {},
    };
    assert.doesNotThrow(function () {
      keydownHandler(tabEvent);
    });
  });
});
