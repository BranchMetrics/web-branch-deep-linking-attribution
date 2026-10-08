import { renderFinalize, renderQueue } from '../../../src/branch/init.js';
import { closeJourney as closeJourneyBody } from '../../../src/branch/journeys.js';
import {
  callback_params,
  init_states,
  wrap,
} from '../../../src/branch/wrap.js';
import { task_queue } from '../../../src/core/queue.js';
import { branch_view } from '../../../src/journeys/branch-view.js';
import { journeys_utils } from '../../../src/journeys/journeys-utils.js';
import {
  prepareV2,
  resetV2ForTests,
  showV2,
} from '../../../src/journeys/v2/index.js';
import { useFakeEnv } from '../../helpers/fake-env.js';
import { adapterInput, makeBranch } from './fixtures.js';

// What branch.closeJourney is: the body behind the SDK's command queue.
const closeJourney = wrap(callback_params.CALLBACK_ERR, closeJourneyBody);

describe('closeJourney with a v2 journey', () => {
  useFakeEnv();
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    resetV2ForTests();
    vi.useRealTimers();
    document.body.innerHTML = '';
    journeys_utils.branch = null;
  });

  function show(branch) {
    showV2(prepareV2(adapterInput(), branch), {
      branch,
      branchView: branch_view,
      hasApp: false,
      testMode: false,
      entryAnimationDisabled: false,
      exitAnimationDisabled: false,
    });
  }

  it('calls back once, after didCloseJourney', () => {
    const branch = makeBranch();
    show(branch);
    // The fixture's 0.25s slide; jsdom fires no animationend, so the 50ms grace ends it.
    vi.advanceTimersByTime(300);
    const cb = vi.fn();
    closeJourney.call(branch, cb);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).toBeUndefined();
    const names = branch._publishEvent.mock.calls.map((c) => c[0]);
    expect(names).toContain('didCallJourneyClose');
    expect(names.at(-1)).toBe('didCloseJourney');
  });

  it('closes a v2 journey that is still entering, calling back once without an error', () => {
    const branch = makeBranch();
    show(branch);
    const cb = vi.fn();
    closeJourney.call(branch, cb);
    vi.runAllTimers();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).toBeUndefined();
    expect(document.getElementById('branch-journey-host')).toBeNull();
    const names = branch._publishEvent.mock.calls.map((c) => c[0]);
    expect(names).not.toContain('didShowJourney');
    expect(names.at(-1)).toBe('didCloseJourney');
  });

  it('keeps v1 behavior when no v2 journey is live', () => {
    journeys_utils.branch = makeBranch();
    const cb = vi.fn();
    closeJourney.call(journeys_utils.branch, cb);
    // v1 quirk kept on purpose: with a synchronous renderQueue the error comes first, then done().
    expect(cb.mock.calls.map((c) => c[0])).toEqual([
      'Journey already dismissed.',
      undefined,
    ]);
  });

  it('forwards the not-initialized error', () => {
    const branch = Object.assign(makeBranch(), {
      init_state: init_states.NO_INIT,
    });
    const cb = vi.fn();
    closeJourney.call(branch, cb);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  describe('with a callback that throws', () => {
    const probe = wrap(callback_params.CALLBACK_ERR, function (done) {
      done(null);
    });
    function throwing() {
      throw new Error('caller');
    }
    // The SDK's real command and render queues, which a throw can stall.
    function queuedBranch() {
      const branch = makeBranch();
      branch._queue = task_queue();
      branch.renderQueue = wrap(callback_params.NO_CALLBACK, renderQueue);
      branch.renderFinalize = wrap(callback_params.NO_CALLBACK, renderFinalize);
      return branch;
    }

    it("doesn't stall later calls, and still surfaces the error", () => {
      const branch = queuedBranch();
      show(branch);
      vi.advanceTimersByTime(300);
      closeJourney.call(branch, throwing);
      // The user closes it before the render queue runs the API close.
      document
        .getElementById('branch-journey-host')
        .shadowRoot.querySelector('.branch-banner-close')
        .click();
      vi.advanceTimersByTime(300);
      branch.renderFinalize();
      const later = vi.fn();
      probe.call(branch, later);
      expect(later).toHaveBeenCalled();
      expect(() => vi.runAllTimers()).toThrow('caller');
    });

    it('still calls back the other closeJourney callers', () => {
      const branch = makeBranch();
      show(branch);
      vi.advanceTimersByTime(300);
      const other = vi.fn();
      closeJourney.call(branch, throwing);
      closeJourney.call(branch, other);
      expect(() => vi.advanceTimersByTime(300)).toThrow('caller');
      expect(other).toHaveBeenCalledTimes(1);
    });
  });
});
