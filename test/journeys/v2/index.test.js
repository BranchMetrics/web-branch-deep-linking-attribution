import { branch_view } from '../../../src/journeys/branch-view.js';
import {
  recordGlobalDismiss,
  recordViewDismiss,
} from '../../../src/journeys/dismissals.js';
import { journeys_utils } from '../../../src/journeys/journeys-utils.js';
import {
  closeV2Journey,
  resetV2ForTests,
  showV2,
  v2JourneyState,
} from '../../../src/journeys/v2/index.js';
import { UA, useFakeEnv } from '../../helpers/fake-env.js';
import {
  makeBranch as makeFixtureBranch,
  SAMPLE_ANIMATION,
  sampleJourneyPayload,
  sampleServerPayload,
  templateHtml,
} from './fixtures.js';

const makeBranch = (initOptions = {}) =>
  makeFixtureBranch({ init_options: initOptions });
const deps = (branch) => ({
  branch,
  branchView: branch_view,
  testMode: false,
  entryAnimationDisabled: false,
  exitAnimationDisabled: false,
});
const renderV2 = (d) => showV2(sampleJourneyPayload(), d);
const hosts = () => document.querySelectorAll('#branch-journey-host').length;
const iframe = () => document.getElementById('branch-banner-iframe');
// Long enough for any entrance or exit to settle (a 0.25s slide plus its grace).
const SETTLE = 300;

describe('journeys/v2 showV2 and the journey state', () => {
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

  it('shows a prepared journey and reports it as shown, then closing', () => {
    const branch = makeBranch();
    expect(v2JourneyState()).toBe('none');
    expect(renderV2(deps(branch))).toBe(true);
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
    renderV2(deps(branch));
    vi.advanceTimersByTime(20);
    document.body.innerHTML = '';
    const published = branch._publishEvent.mock.calls.length;
    const cb = vi.fn();
    closeV2Journey(branch, cb);
    expect(cb).toHaveBeenCalledWith('Journey already dismissed.');
    expect(branch._publishEvent.mock.calls.length).toBe(published);
    expect(v2JourneyState()).toBe('none');
    expect(renderV2(deps(branch))).toBe(true);
    expect(hosts()).toBe(1);
  });

  it('cleans up as soon as an SPA removes the host, without waiting for the next call', async () => {
    renderV2(deps(makeBranch()));
    vi.advanceTimersByTime(20);
    document.body.innerHTML = '';
    await Promise.resolve();
    expect(document.getElementById('branch-journey-page')).toBeNull();
    expect(v2JourneyState()).toBe('none');
  });

  // The exit's timer still finishes the close, which sends the dismissal.
  it('a user dismiss survives the host being removed during the exit', () => {
    const branch = makeBranch();
    renderV2(deps(branch));
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

  it('records and logs render-error when mounting fails before the CTA script runs', () => {
    const branch = makeBranch();
    branch._ctx.debug = true;
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const spy = vi
      .spyOn(document.body.classList, 'add')
      .mockImplementation(() => {
        throw new Error('boom');
      });
    try {
      expect(renderV2(deps(branch))).toBe(false);
      expect(log).toHaveBeenCalledWith(
        'Journeys v2 fell back to v1: render-error',
      );
    } finally {
      spy.mockRestore();
      log.mockRestore();
    }
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
      expect(renderV2(deps(branch))).toBe(false);
    } finally {
      spy.mockRestore();
    }
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

  const response = ({
    v2 = true,
    payload = v2,
    html = templateHtml(),
    journey = sampleServerPayload(),
  } = {}) => ({
    template: html,
    event_data: { branch_view_data: { id: 'view-1', audience_rule_id: 'r1' } },
    journey_link_data: { type: 'mobile' },
    use_v2_renderer: v2,
    animationConfig: v2 ? SAMPLE_ANIMATION : undefined,
    ...(payload ? { banner_payload: journey } : {}),
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
        banner_payload: 1,
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

  it('renders v1 from the template when use_v2_renderer comes without a payload', () => {
    const notShown = show(response({ payload: false }));
    expect(notShown).not.toHaveBeenCalled();
    expect(hosts()).toBe(0);
    expect(iframe()).not.toBeNull();
  });

  it("renders v1 from the template when the request didn't ask for a payload", () => {
    show(response(), {}, { banner_payload: undefined });
    expect(hosts()).toBe(0);
    expect(iframe()).not.toBeNull();
  });

  it('renders v1 from the template when the payload has no CTA script', () => {
    const journey = sampleServerPayload();
    delete journey.cta;
    const notShown = show(response({ journey }));
    expect(notShown).not.toHaveBeenCalled();
    expect(hosts()).toBe(0);
    expect(iframe()).not.toBeNull();
  });

  // v2 mounts before it runs the CTA script, so the fallback runs it only once and an
  // open_app journey can't open the app twice. The fallback animates as v1 does today.
  it('falls back to v1 from the template on render-error, running the CTA script once', () => {
    const journey = sampleServerPayload();
    journey.render.creative.html =
      '<div class="branch-banner-content">no banner</div>';
    const notShown = show(response({ journey }));
    expect(notShown).not.toHaveBeenCalled();
    expect(hosts()).toBe(0);
    expect(iframe()).not.toBeNull();
    expect(document.querySelectorAll('#branch-journey-cta')).toHaveLength(1);
    expect(journeys_utils.use_v2_renderer).toBe(true);
    expect(journeys_utils.animationConfig).toEqual(SAMPLE_ANIMATION);
  });

  it('gives the v1 fallback the animation it gets today', async () => {
    vi.useRealTimers();
    const journey = sampleServerPayload();
    journey.render.creative.html =
      '<div class="branch-banner-content">no banner</div>';
    show(response({ journey }));
    // jsdom loads the iframe asynchronously; its onload adds the CSS and the enter class.
    await vi.waitFor(() => {
      const doc = iframe().contentWindow.document;
      expect(doc.getElementById('branch-css')?.innerHTML).toContain(
        SAMPLE_ANIMATION.generatedCss,
      );
      expect(
        doc
          .getElementById('branch-banner')
          ?.classList.contains(SAMPLE_ANIMATION.classes.enter),
      ).toBe(true);
    });
  });

  it("runs the payload's CTA script with $journeys_cta applied", () => {
    journeys_utils.branch._branchViewData = {
      data: { $journeys_cta: 'https://shop.example.com/cta' },
    };
    show();
    expect(hosts()).toBe(1);
    expect(document.getElementById('branch-journey-cta').innerHTML).toContain(
      'validate("https://shop.example.com/cta")',
    );
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
      const notShown = show(response({ payload: false }));
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
        'didShowJourney',
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
            banner_payload: 1,
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

      it('still shows a different v1 journey after a v1 dismissal, as v1 always has', () => {
        recordViewDismiss(journeys_utils.branch._storage, 'view-9', 'r9');
        expect(show(response({ v2: false }))).not.toHaveBeenCalled();
        expect(iframe()).not.toBeNull();
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
