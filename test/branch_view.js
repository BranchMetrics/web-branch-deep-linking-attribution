'use strict';

goog.require('branch_view');
goog.require('journeys_utils');

describe('displayJourney new render options wiring', function() {
  const assert = testUtils.unplanned();

  beforeEach(function() {
    journeys_utils.branch = { _storage: {} };
    journeys_utils.use_v2_renderer = false;
    journeys_utils.exitAnimationIsRunning = false;
  });

  afterEach(function() {
    journeys_utils.use_v2_renderer = false;
    var placeholder = document.getElementById('branch-banner');
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
  });

  function display(newOptionsData) {
    branch_view.displayJourney(null, {}, 'template-id', {}, false, { type: 'mobile_web' }, newOptionsData);
  }

  it('sets use_v2_renderer to true when branchViewData.use_v2_renderer is true', function() {
    display({ use_v2_renderer: true });
    assert.strictEqual(journeys_utils.use_v2_renderer, true);
  });

  it('sets use_v2_renderer to false when branchViewData.use_v2_renderer is false', function() {
    display({ use_v2_renderer: false });
    assert.strictEqual(journeys_utils.use_v2_renderer, false);
  });

  it('falls back to legacy (false) when branchViewData.use_v2_renderer is missing', function() {
    display({});
    assert.strictEqual(journeys_utils.use_v2_renderer, false);
  });
});
