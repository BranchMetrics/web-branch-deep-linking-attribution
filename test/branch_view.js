'use strict';

goog.require('branch_view');
goog.require('journeys_utils');

// Coverage for which pipeline is_new_animation routes to lives in
// test/journeys/v2/index.js ("branch_view.displayJourney fork"), via a sinon stub on
// journeys_v2.displayJourney rather than an internal journeys_utils flag.
describe('displayJourney', function () {
  const assert = testUtils.unplanned();

  beforeEach(function () {
    journeys_utils.branch = { _storage: {} };
    journeys_utils.exitAnimationIsRunning = false;
  });

  afterEach(function () {
    var placeholder = document.getElementById('branch-banner');
    if (placeholder && placeholder.placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
  });

  it('_getPageviewRequestData keeps the pageview animation flags across a dismiss-request build', function () {
    // A chained journey rendered off a dismiss should keep what the customer asked for on the
    // pageview; the dismiss build itself carries no customer options.
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
        journeys_utils.branch, // branch param
        {}, // options param - required so options['use_v2_renderer'] doesn't throw a TypeError
      );
    });

    assert.strictEqual(
      document.getElementById('branch-banner'),
      null,
      'placeholder removed',
    );
  });
});
