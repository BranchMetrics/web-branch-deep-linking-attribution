'use strict';

goog.require('branch_view');
goog.require('journeys_utils');

describe('displayJourney is_new_animation wiring', function() {
  const assert = testUtils.unplanned();

  beforeEach(function() {
    journeys_utils.branch = { _storage: {} };
    journeys_utils.isNewAnimation = false;
    journeys_utils.exitAnimationIsRunning = false;
  });

  afterEach(function() {
    journeys_utils.isNewAnimation = false;
    var placeholder = document.getElementById('branch-banner');
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
  });

  function display(branchViewData) {
    branch_view.displayJourney(null, {}, 'template-id', branchViewData, false, { type: 'mobile_web' });
  }

  it('sets isNewAnimation to true when branchViewData.is_new_animation is true', function() {
    display({ is_new_animation: true });
    assert.strictEqual(journeys_utils.isNewAnimation, true);
  });

  it('sets isNewAnimation to false when branchViewData.is_new_animation is false', function() {
    display({ is_new_animation: false });
    assert.strictEqual(journeys_utils.isNewAnimation, false);
  });

  it('falls back to legacy (false) when branchViewData.is_new_animation is missing', function() {
    display({});
    assert.strictEqual(journeys_utils.isNewAnimation, false);
  });
});
