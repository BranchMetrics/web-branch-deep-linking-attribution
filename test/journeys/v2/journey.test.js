import { createContext } from '../../../src/core/context.js';
import { Journey, NOT_SHOWN_ERROR } from '../../../src/journeys/v2/journey.js';
import { useFakeEnv } from '../../helpers/fake-env.js';
import { makeBranch as makeFixtureBranch, makePayload } from './fixtures.js';

const CB = 'branch_view_callback__1';

function makeBranch() {
  const events = [];
  return makeFixtureBranch({
    events,
    names: () => events.map((e) => e.name),
    _ctx: Object.assign(createContext(), { nonce: 'n0nce' }),
    _publishEvent: vi.fn((name, data) => events.push({ name, data })),
  });
}

function start(payloadOverrides = {}, depsOverrides = {}) {
  const branch = makeBranch();
  const onFinished = vi.fn();
  const branchView = {
    _getPageviewRequestData: vi.fn(() => ({ event: 'dismiss' })),
  };
  const payload = makePayload(payloadOverrides);
  const journey = new Journey(payload, {
    branch,
    branchView,
    hasApp: false,
    testMode: false,
    entryAnimationDisabled: false,
    exitAnimationDisabled: false,
    onFinished,
    ...depsOverrides,
  });
  const shown = journey.show(payload);
  const root = document.getElementById('branch-journey-host')?.shadowRoot;
  return { journey, branch, onFinished, shown, root };
}

describe('journeys/v2 Journey', () => {
  useFakeEnv();
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    delete window[CB];
    document.body.innerHTML = '';
    document.body.className = '';
    document.head.innerHTML = '';
  });

  it('shows: willShowJourney with layout fields, then didShowJourney after the entrance', () => {
    const { branch, shown } = start();
    expect(shown).toBe(true);
    expect(branch.names()).toEqual(['willShowJourney']);
    expect(branch.events[0].data).toMatchObject({
      banner_id: 'view-1',
      isFullPageBanner: true,
      bannerPagePlacement: 'bottom',
      isBannerInline: false,
      isBannerSticky: true,
    });
    vi.advanceTimersByTime(20);
    expect(branch.names()).toEqual(['willShowJourney', 'didShowJourney']);
  });

  // v1 reported px too, converting a relative bannerHeight such as 100vh.
  it('reports willShowJourney bannerHeight as the measured px height', () => {
    // jsdom has no layout.
    const height = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockImplementation(function () {
        return this.id === 'branch-banner' ? 812 : 0;
      });
    try {
      const { branch } = start();
      expect(branch.events[0].data.bannerHeight).toBe('812px');
    } finally {
      height.mockRestore();
    }
  });

  it('close works even if the CTA script never calls back; the CTA does nothing until it does', () => {
    const { branch, root } = start();
    vi.advanceTimersByTime(20);
    root.getElementById('branch-mobile-action').click();
    expect(branch.names()).not.toContain('didClickJourneyCTA');
    root.querySelector('.branch-banner-close').click();
    vi.advanceTimersByTime(20);
    expect(branch.names()).toContain('didCloseJourney');
    expect(document.getElementById('branch-journey-host')).toBeNull();
  });

  it('CTA: runs once, closes, records no dismissal and sends no /v1/dismiss', () => {
    const { branch, root, onFinished, journey } = start();
    const cta = vi.fn();
    window[CB](cta);
    vi.advanceTimersByTime(20);
    const button = root.getElementById('branch-mobile-action');
    button.click();
    button.click();
    vi.advanceTimersByTime(20);
    expect(cta).toHaveBeenCalledTimes(1);
    expect(branch.names()).toEqual([
      'willShowJourney',
      'didShowJourney',
      'didClickJourneyCTA',
      'willCloseJourney',
      'didCloseJourney',
    ]);
    expect(branch._api).not.toHaveBeenCalled();
    expect(branch._storage.get('journeyDismissals', true)).toBeFalsy();
    expect(onFinished).toHaveBeenCalledWith(journey);
  });

  it('a swipe of 20 touchmoves plus a CTA tap dismisses exactly once', () => {
    const { branch, root } = start({ dismissal: { globalPeriodSeconds: 60 } });
    window[CB](vi.fn());
    vi.advanceTimersByTime(20);
    const bg = root.querySelector('.branch-banner-dismiss-background');
    for (let i = 0; i < 20; i++) bg.dispatchEvent(new Event('touchmove'));
    root.getElementById('branch-mobile-action').click();
    vi.advanceTimersByTime(20);
    const names = branch.names();
    expect(
      names.filter((n) => n === 'didScrollJourneyBackgroundDismiss'),
    ).toHaveLength(1);
    expect(names.filter((n) => n === 'willCloseJourney')).toHaveLength(1);
    expect(names).not.toContain('didClickJourneyCTA');
    expect(branch._api).toHaveBeenCalledTimes(1);
    expect(branch._api.mock.calls[0][1]).toMatchObject({
      dismissal_source: 'Background Dismiss',
    });
    expect(
      JSON.parse(branch._storage.get('journeyDismissals', true)),
    ).toMatchObject({
      'rule-1': { view_id: 'view-1' },
    });
    expect(branch._storage.get('globalJourneysDismiss', true)).toBeTruthy();
  });

  it('dismiss in test mode publishes and closes but touches neither storage nor the API', () => {
    const { branch, root } = start({}, { testMode: true });
    vi.advanceTimersByTime(20);
    root.querySelector('.branch-banner-close').click();
    vi.advanceTimersByTime(20);
    expect(branch.names()).toContain('didClickJourneyClose');
    expect(branch._api).not.toHaveBeenCalled();
    expect(branch._storage.get('journeyDismissals', true)).toBeFalsy();
  });

  it('a dismiss during the entrance never lets didShowJourney follow didCloseJourney', () => {
    const { branch, root } = start({}, { exitAnimationDisabled: true });
    root.querySelector('.branch-banner-close').click();
    vi.advanceTimersByTime(1000);
    expect(branch.names()).not.toContain('didShowJourney');
    expect(branch.names().at(-1)).toBe('didCloseJourney');
  });

  it('closeFromApi during the entrance closes at once and calls back without an error', () => {
    const { journey, branch } = start();
    const caller = makeBranch();
    const cb = vi.fn();
    journey.closeFromApi(caller, cb);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0]).toEqual([]);
    expect(caller.names()).toEqual(['didCallJourneyClose']);
    expect(branch.names()).toEqual([
      'willShowJourney',
      'willCloseJourney',
      'didCloseJourney',
    ]);
    expect(journey.isLive()).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(branch.names()).not.toContain('didShowJourney');
    expect(branch._api).not.toHaveBeenCalled();
  });

  it('a user dismiss during the entrance closes at once, still recording the dismissal', () => {
    const { branch, root, journey } = start();
    root.querySelector('.branch-banner-close').click();
    expect(journey.isLive()).toBe(false);
    expect(branch.names()).toEqual([
      'willShowJourney',
      'didClickJourneyClose',
      'willCloseJourney',
      'didCloseJourney',
    ]);
    expect(branch._api).toHaveBeenCalledTimes(1);
  });

  it('closeFromApi publishes on the calling instance and calls back once after didCloseJourney', () => {
    const { journey, branch } = start();
    vi.advanceTimersByTime(20);
    const caller = makeBranch();
    const order = [];
    branch._publishEvent.mockImplementation((name) => order.push(name));
    const cb = vi.fn(() => order.push('cb'));
    journey.closeFromApi(caller, cb);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);
    expect(caller.names()).toEqual(['didCallJourneyClose']);
    expect(order).toEqual(['willCloseJourney', 'didCloseJourney', 'cb']);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(branch._api).not.toHaveBeenCalled();
  });

  it('a throwing listener cannot leave the journey stuck on screen', () => {
    const { branch, root, journey } = start();
    vi.advanceTimersByTime(20);
    branch._publishEvent.mockImplementation((name) => {
      branch.events.push({ name });
      if (name === 'didClickJourneyClose') {
        throw new Error('listener bug');
      }
    });
    root.querySelector('.branch-banner-close').click();
    vi.advanceTimersByTime(20);
    expect(branch.names()).toContain('didCloseJourney');
    expect(journey.isLive()).toBe(false);
    expect(branch._api).toHaveBeenCalledTimes(1);
  });

  it('a throwing CTA still closes the journey', () => {
    const { branch, root, journey } = start();
    window[CB](() => {
      throw new Error('blocked navigation');
    });
    vi.advanceTimersByTime(20);
    root.getElementById('branch-mobile-action').click();
    vi.advanceTimersByTime(20);
    expect(branch.names()).toContain('didCloseJourney');
    expect(journey.isLive()).toBe(false);
  });

  it('a throwing didCallJourneyClose listener still closes and calls back', () => {
    const { journey } = start();
    vi.advanceTimersByTime(20);
    const caller = makeBranch();
    caller._publishEvent.mockImplementation(() => {
      throw new Error('listener bug');
    });
    const cb = vi.fn();
    journey.closeFromApi(caller, cb);
    vi.advanceTimersByTime(20);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(journey.isLive()).toBe(false);
  });

  it('a discard during the exit settles closeJourney once with an error and publishes no close', () => {
    const { branch, journey } = start();
    vi.advanceTimersByTime(20);
    const cb = vi.fn();
    journey.closeFromApi(makeBranch(), cb);
    journey.discard();
    vi.runAllTimers();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(NOT_SHOWN_ERROR);
    expect(branch.names()).not.toContain('didCloseJourney');
  });

  it('gives each event its own copy of the link data', () => {
    const { branch } = start();
    branch.events[0].data.banner_id = 'mutated';
    vi.advanceTimersByTime(20);
    expect(branch.events[1].data.banner_id).toBe('view-1');
  });

  it('show() fails cleanly before the CTA script runs, leaving nothing behind', () => {
    const { shown, journey, onFinished } = start(
      {
        fonts: ['https://fonts.googleapis.com/css2?family=Roboto'],
      },
      {
        branch: Object.assign(makeBranch(), { _ctx: undefined }),
      },
    );
    expect(shown).toBe(false);
    expect(document.getElementById('branch-journey-host')).toBeNull();
    expect(onFinished).toHaveBeenCalledWith(journey);
  });

  it('isLive turns false when the host is removed out of band', () => {
    const { journey } = start();
    expect(journey.isLive()).toBe(true);
    document.body.innerHTML = '';
    expect(journey.isLive()).toBe(false);
  });

  it('finishes silently once the renderer reports the host removed', async () => {
    const { branch, journey, onFinished } = start();
    vi.advanceTimersByTime(20);
    document.body.innerHTML = '';
    await Promise.resolve();
    expect(onFinished).toHaveBeenCalledWith(journey);
    expect(branch.names()).not.toContain('didCloseJourney');
  });

  // v1 then runs the script once, as it would for any fallback.
  it('show() fails before the CTA script runs when the event data cannot be built', () => {
    const linkData = { banner_id: 'view-1' };
    linkData.self = linkData;
    const { shown, onFinished, journey } = start({ linkData });
    expect(shown).toBe(false);
    expect(window[CB]).toBeUndefined();
    expect(document.querySelector('script')).toBeNull();
    expect(onFinished).toHaveBeenCalledWith(journey);
  });
});
