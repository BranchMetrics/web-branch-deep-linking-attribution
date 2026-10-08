import { branch_view } from '../../../src/journeys/branch-view.js';
import {
  recordGlobalDismiss,
  recordViewDismiss,
} from '../../../src/journeys/dismissals.js';
import { journeys_utils } from '../../../src/journeys/journeys-utils.js';
import {
  closeV2Journey,
  prepareV2,
  resetV2ForTests,
  showV2,
  v2JourneyState,
} from '../../../src/journeys/v2/index.js';
import { UA, useFakeEnv } from '../../helpers/fake-env.js';
import {
  adapterInput,
  makeBranch as makeFixtureBranch,
  templateHtml,
} from './fixtures.js';

const makeBranch = (initOptions = {}) =>
  makeFixtureBranch({ init_options: initOptions });
const deps = (branch) => ({
  branch,
  branchView: branch_view,
  hasApp: false,
  testMode: false,
  entryAnimationDisabled: false,
  exitAnimationDisabled: false,
});
const renderV2 = (input, d) => {
  const payload = prepareV2(input, d.branch);
  return !!payload && showV2(payload, d);
};
const hosts = () => document.querySelectorAll('#branch-journey-host').length;
const iframe = () => document.getElementById('branch-banner-iframe');
// Long enough for any entrance or exit to settle (a 0.25s slide plus its grace).
const SETTLE = 300;

describe('journeys/v2 prepareV2, showV2 and the journey state', () => {
  useFakeEnv({ userAgent: () => UA.iphoneChrome });
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    resetV2ForTests();
    vi.useRealTimers();
    document.body.innerHTML = '';
    document.body.className = '';
  });

  it('prepares nothing without attachShadow or when the adapter rejects the template', () => {
    const original = Element.prototype.attachShadow;
    delete Element.prototype.attachShadow;
    try {
      expect(prepareV2(adapterInput(), makeBranch())).toBeNull();
    } finally {
      Element.prototype.attachShadow = original;
    }
    expect(
      prepareV2(
        adapterInput({ html: templateHtml({ script: null }) }),
        makeBranch(),
      ),
    ).toBeNull();
    expect(hosts()).toBe(0);
  });

  it('shows a prepared journey and reports it as shown, then closing', () => {
    const branch = makeBranch();
    expect(v2JourneyState()).toBe('none');
    expect(renderV2(adapterInput(), deps(branch))).toBe(true);
    expect(hosts()).toBe(1);
    expect(v2JourneyState()).toBe('shown');
    vi.advanceTimersByTime(SETTLE);
    closeV2Journey(branch, () => {});
    expect(v2JourneyState()).toBe('closing');
    vi.advanceTimersByTime(SETTLE);
    expect(v2JourneyState()).toBe('none');
  });

  it('recovers when an SPA wipes the body: closeJourney is a silent error, next render works', () => {
    const branch = makeBranch();
    renderV2(adapterInput(), deps(branch));
    vi.advanceTimersByTime(20);
    document.body.innerHTML = '';
    const published = branch._publishEvent.mock.calls.length;
    const cb = vi.fn();
    closeV2Journey(branch, cb);
    expect(cb).toHaveBeenCalledWith('Journey already dismissed.');
    expect(branch._publishEvent.mock.calls.length).toBe(published);
    expect(v2JourneyState()).toBe('none');
    expect(renderV2(adapterInput(), deps(branch))).toBe(true);
    expect(hosts()).toBe(1);
  });

  it('cleans up as soon as an SPA removes the host, without waiting for the next call', async () => {
    renderV2(adapterInput(), deps(makeBranch()));
    vi.advanceTimersByTime(20);
    document.body.innerHTML = '';
    await Promise.resolve();
    expect(document.getElementById('branch-journey-page')).toBeNull();
    expect(v2JourneyState()).toBe('none');
  });

  // The exit's timer still finishes the close, which sends the dismissal.
  it('a user dismiss survives the host being removed during the exit', () => {
    const branch = makeBranch();
    renderV2(adapterInput(), deps(branch));
    vi.advanceTimersByTime(SETTLE);
    document
      .getElementById('branch-journey-host')
      .shadowRoot.querySelector('.branch-banner-close')
      .click();
    document.body.innerHTML = '';
    expect(v2JourneyState()).toBe('closing');
    vi.advanceTimersByTime(SETTLE);
    expect(branch._publishEvent).toHaveBeenCalledWith(
      'didCloseJourney',
      expect.anything(),
    );
    expect(branch._api).toHaveBeenCalled();
    expect(v2JourneyState()).toBe('none');
  });

  it('logs and records the reason when it falls back to v1', () => {
    const branch = makeBranch();
    branch._ctx.debug = true;
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      expect(
        prepareV2(
          adapterInput({ html: templateHtml({ script: null }) }),
          branch,
        ),
      ).toBeNull();
      expect(branch._ctx.instrumentation['journey-v2-fallback']).toBe(
        'no-cta-script',
      );
      expect(log).toHaveBeenCalledWith(
        'Journeys v2 fell back to v1: no-cta-script',
      );
    } finally {
      log.mockRestore();
    }
  });

  it('records no-shadow-dom without calling the adapter', () => {
    const branch = makeBranch();
    const original = Element.prototype.attachShadow;
    delete Element.prototype.attachShadow;
    try {
      expect(prepareV2(adapterInput(), branch)).toBeNull();
    } finally {
      Element.prototype.attachShadow = original;
    }
    expect(branch._ctx.instrumentation['journey-v2-fallback']).toBe(
      'no-shadow-dom',
    );
  });

  it('records no-css-layers without calling the adapter', () => {
    const branch = makeBranch();
    const original = window.CSSLayerBlockRule;
    delete window.CSSLayerBlockRule;
    try {
      expect(prepareV2(adapterInput(), branch)).toBeNull();
    } finally {
      window.CSSLayerBlockRule = original;
    }
    expect(branch._ctx.instrumentation['journey-v2-fallback']).toBe(
      'no-css-layers',
    );
  });

  it('records render-error when mounting fails before the CTA script runs', () => {
    const branch = makeBranch();
    const spy = vi
      .spyOn(document.body.classList, 'add')
      .mockImplementation(() => {
        throw new Error('boom');
      });
    try {
      expect(renderV2(adapterInput(), deps(branch))).toBe(false);
    } finally {
      spy.mockRestore();
    }
    expect(branch._ctx.instrumentation['journey-v2-fallback']).toBe(
      'render-error',
    );
    expect(hosts()).toBe(0);
  });

  it("falls back to v1 with render-error when the CTA script can't be installed", () => {
    const branch = makeBranch();
    const append = document.body.appendChild.bind(document.body);
    const spy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => {
        if (node.tagName === 'SCRIPT') {
          throw new Error('script blocked');
        }
        return append(node);
      });
    try {
      expect(renderV2(adapterInput(), deps(branch))).toBe(false);
    } finally {
      spy.mockRestore();
    }
    expect(branch._ctx.instrumentation['journey-v2-fallback']).toBe(
      'render-error',
    );
    expect(hosts()).toBe(0);
    expect(v2JourneyState()).toBe('none');
  });
});

describe('branch_view.showJourneyFromResponse', () => {
  useFakeEnv({ userAgent: () => UA.iphoneChrome });
  beforeEach(() => {
    vi.useFakeTimers();
    journeys_utils.branch = makeBranch();
  });
  afterEach(() => {
    resetV2ForTests();
    vi.useRealTimers();
    document.body.innerHTML = '';
    document.body.className = '';
    journeys_utils.exitAnimationIsRunning = false;
  });

  const response = ({ v2 = true, html = templateHtml() } = {}) => ({
    template: html,
    event_data: { branch_view_data: { id: 'view-1', audience_rule_id: 'r1' } },
    journey_link_data: { type: 'mobile' },
    use_v2_renderer: v2,
  });
  // Returns the onNotShown spy. The request carries no journey_dismissals unless given,
  // i.e. it was built before any dismissal.
  function show(res = response(), options = {}, request = {}) {
    const notShown = vi.fn();
    branch_view.showJourneyFromResponse(
      res,
      {
        callback_string: 'branch_view_callback__1',
        has_app_websdk: false,
        ...request,
      },
      options,
      notShown,
    );
    return notShown;
  }
  const events = () =>
    journeys_utils.branch._publishEvent.mock.calls.map(([name]) => name);
  function startClosing() {
    show();
    vi.advanceTimersByTime(SETTLE);
    const closed = vi.fn();
    closeV2Journey(journeys_utils.branch, closed);
    return closed;
  }

  it('renders use_v2_renderer journeys in the shadow DOM, ignoring v1’s exit cooldown', () => {
    journeys_utils.exitAnimationIsRunning = true;
    expect(show()).not.toHaveBeenCalled();
    expect(hosts()).toBe(1);
    expect(iframe()).toBeNull();
  });

  it('renders with v1 when the adapter rejects the template', () => {
    const notShown = show(response({ html: templateHtml({ script: null }) }));
    expect(notShown).not.toHaveBeenCalled();
    expect(hosts()).toBe(0);
    expect(iframe()).not.toBeNull();
  });

  it('applies init-time disable_entry_animation when the call passes none', () => {
    journeys_utils.branch = makeBranch({ disable_entry_animation: true });
    show(response(), {});
    const banner = document
      .getElementById('branch-journey-host')
      .shadowRoot.getElementById('branch-banner');
    expect(banner.style.getPropertyValue('animation')).toBe('none');
  });

  it("doesn't show an ineligible journey", () => {
    expect(show(response(), { no_journeys: true })).toHaveBeenCalledTimes(1);
    expect(hosts()).toBe(0);
  });

  describe("a banner already on the page, judged for the journey's renderer", () => {
    it('a stray #branch-banner blocks a v1 journey but not a v2 one', () => {
      document.body.innerHTML = '<div id="branch-banner"></div>';
      expect(show(response({ v2: false }))).toHaveBeenCalledTimes(1);
      expect(iframe()).toBeNull();
      expect(show()).not.toHaveBeenCalled();
      expect(hosts()).toBe(1);
    });

    [
      'branch-banner',
      'branch-banner-iframe',
      'branch-banner-container',
    ].forEach((id) => {
      it(`#${id} blocks a v1 journey, in test mode too`, () => {
        document.body.innerHTML = `<div id="${id}"></div>`;
        const res = response({ v2: false });
        expect(show(res)).toHaveBeenCalledTimes(1);
        expect(
          show(res, {}, { branch_view_id: 'view-1' }),
        ).toHaveBeenCalledTimes(1);
        expect(document.querySelectorAll('iframe')).toHaveLength(0);
      });
    });

    it('blocks a v2-flagged journey that falls back to v1, as it would any v1 journey', () => {
      document.body.innerHTML = '<div id="branch-banner"></div>';
      const notShown = show(response({ html: templateHtml({ script: null }) }));
      expect(notShown).toHaveBeenCalledTimes(1);
      expect(iframe()).toBeNull();
      expect(document.querySelectorAll('#branch-banner')).toHaveLength(1);
    });

    it("branch.banner()'s div-mode banner blocks a v2 journey", () => {
      document.body.innerHTML =
        '<div id="branch-banner" class="branch-animation"></div>';
      expect(show()).toHaveBeenCalledTimes(1);
      expect(hosts()).toBe(0);
    });

    it("a v1 journey's iframe blocks a v2 journey", () => {
      document.body.innerHTML = '<iframe id="branch-banner-iframe"></iframe>';
      expect(show()).toHaveBeenCalledTimes(1);
      expect(hosts()).toBe(0);
    });

    it('a shown v2 journey blocks both', () => {
      show();
      vi.advanceTimersByTime(SETTLE);
      expect(show()).toHaveBeenCalledTimes(1);
      expect(show(response({ v2: false }))).toHaveBeenCalledTimes(1);
      expect(hosts()).toBe(1);
      expect(iframe()).toBeNull();
    });
  });

  describe('a journey that arrives while a v2 journey is closing', () => {
    it('waits, then shows right after didCloseJourney and the close callback', () => {
      const closed = startClosing();
      const notShown = show();
      expect(hosts()).toBe(1);
      expect(events().filter((e) => e === 'willShowJourney')).toHaveLength(1);
      closed.mockImplementation(() =>
        journeys_utils.branch._publishEvent('closeCallback'),
      );
      vi.advanceTimersByTime(SETTLE);
      expect(closed).toHaveBeenCalledTimes(1);
      expect(notShown).not.toHaveBeenCalled();
      expect(hosts()).toBe(1);
      expect(v2JourneyState()).toBe('shown');
      const order = events();
      expect(order.slice(order.indexOf('willCloseJourney'))).toEqual([
        'willCloseJourney',
        'didCloseJourney',
        'closeCallback',
        'willShowJourney',
      ]);
    });

    it('waits for v1 journeys too, so the two never overlap', () => {
      startClosing();
      show(response({ v2: false }));
      expect(iframe()).toBeNull();
      vi.advanceTimersByTime(SETTLE);
      expect(hosts()).toBe(0);
      expect(iframe()).not.toBeNull();
    });

    it('shows the newest one; the others are not shown', () => {
      startClosing();
      const older = show(response({ v2: false }));
      const newer = show();
      vi.advanceTimersByTime(SETTLE);
      expect(hosts()).toBe(1);
      expect(iframe()).toBeNull();
      expect(newer).not.toHaveBeenCalled();
      expect(older).toHaveBeenCalledTimes(1);
    });

    it('is decided again after the wait: a dismissal recorded meanwhile stops it', () => {
      startClosing();
      const notShown = show();
      recordGlobalDismiss(journeys_utils.branch._storage, true);
      vi.advanceTimersByTime(SETTLE);
      expect(notShown).toHaveBeenCalledTimes(1);
      expect(hosts()).toBe(0);
    });

    // Requested before the click, so the server couldn't apply the dismissal. v1 drops it
    // too: its iframe is still up during the exit.
    describe('after the user dismissed the closing journey', () => {
      function startDismissing() {
        show();
        vi.advanceTimersByTime(SETTLE);
        document
          .getElementById('branch-journey-host')
          .shadowRoot.querySelector('.branch-banner-close')
          .click();
      }
      const otherView = (data) => {
        const res = response();
        res.event_data.branch_view_data = data;
        return res;
      };

      it('drops the same journey at once', () => {
        startDismissing();
        const notShown = show();
        expect(notShown).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(SETTLE);
        expect(hosts()).toBe(0);
        expect(iframe()).toBeNull();
      });

      it('drops another view of the same audience rule, like the server would', () => {
        startDismissing();
        const notShown = show(
          otherView({ id: 'view-2', audience_rule_id: 'r1' }),
        );
        expect(notShown).toHaveBeenCalledTimes(1);
      });

      it('still shows a different journey after the close', () => {
        startDismissing();
        const notShown = show(
          otherView({ id: 'view-2', audience_rule_id: 'r2' }),
        );
        vi.advanceTimersByTime(SETTLE);
        expect(notShown).not.toHaveBeenCalled();
        expect(hosts()).toBe(1);
      });

      it('still shows it in test mode, which records no dismissal', () => {
        branch_view.showJourneyFromResponse(
          response(),
          {
            branch_view_id: 'view-1',
            callback_string: 'branch_view_callback__1',
          },
          {},
          vi.fn(),
        );
        vi.advanceTimersByTime(SETTLE);
        document
          .getElementById('branch-journey-host')
          .shadowRoot.querySelector('.branch-banner-close')
          .click();
        const notShown = show();
        vi.advanceTimersByTime(SETTLE);
        expect(notShown).not.toHaveBeenCalled();
        expect(hosts()).toBe(1);
      });
    });

    describe('after the close has finished', () => {
      function dismiss() {
        show();
        vi.advanceTimersByTime(SETTLE);
        document
          .getElementById('branch-journey-host')
          .shadowRoot.querySelector('.branch-banner-close')
          .click();
        vi.advanceTimersByTime(SETTLE);
        expect(v2JourneyState()).toBe('none');
      }

      it('still drops the same journey if it was requested before the dismissal', () => {
        dismiss();
        expect(show()).toHaveBeenCalledTimes(1);
        expect(hosts()).toBe(0);
      });

      it('drops it with no exit animation too, where there is no closing phase', () => {
        show(response(), { disable_exit_animation: true });
        vi.advanceTimersByTime(SETTLE);
        document
          .getElementById('branch-journey-host')
          .shadowRoot.querySelector('.branch-banner-close')
          .click();
        expect(v2JourneyState()).toBe('none');
        expect(show()).toHaveBeenCalledTimes(1);
        expect(hosts()).toBe(0);
      });

      it('drops a v1 journey dismissed after its request too', () => {
        recordViewDismiss(journeys_utils.branch._storage, 'view-1', 'r1');
        expect(show(response({ v2: false }))).toHaveBeenCalledTimes(1);
        expect(iframe()).toBeNull();
      });

      it('shows it if the request already carried the dismissal, which the server applied', () => {
        dismiss();
        const sent = journeys_utils.branch._storage.get(
          'journeyDismissals',
          true,
        );
        expect(
          show(response(), {}, { journey_dismissals: sent }),
        ).not.toHaveBeenCalled();
        expect(hosts()).toBe(1);
      });
    });

    it("isn't shown if another journey showed first (e.g. from the close callback)", () => {
      show();
      vi.advanceTimersByTime(SETTLE);
      closeV2Journey(journeys_utils.branch, () => show());
      const notShown = show(response({ v2: false }));
      vi.advanceTimersByTime(SETTLE);
      expect(notShown).toHaveBeenCalledTimes(1);
      expect(hosts()).toBe(1);
      expect(iframe()).toBeNull();
    });
  });
});
