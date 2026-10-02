import { branch_view } from '../../src/journeys/branch_view.js';
import { journeys_utils } from '../../src/journeys/journeys_utils.js';

describe('displayJourney new render options wiring', function () {
  const assert = testUtils.unplanned();

  beforeEach(function () {
    journeys_utils.branch = { _storage: {} };
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
