import { render } from '../../../../src/journeys/v2/renderer/index.js';
import { makeRenderPayload } from '../fixtures.js';

function frameDocument() {
  const frame = document.createElement('iframe');
  document.body.appendChild(frame);
  return frame.contentDocument;
}

function start(overrides = {}, opts = {}) {
  const actions = [];
  const onShown = vi.fn();
  const doc = opts.document || document;
  const journey = render(makeRenderPayload(overrides), {
    platform: 'android',
    hasApp: false,
    onAction: (a) => actions.push(a),
    onShown,
    ...opts,
  });
  const root = doc.getElementById('branch-journey-host').shadowRoot;
  return { journey, actions, onShown, root, doc };
}

describe('journeys/v2/renderer render()', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    document.body.className = '';
    document.head.innerHTML = '';
  });

  it('renders with no SDK, reports each control as an action', () => {
    const { actions, root } = start();
    root.querySelector('#branch-mobile-action').click();
    root.querySelector('.branch-banner-close').click();
    root.querySelector('.branch-banner-dismiss-background').click();
    root
      .querySelector('.branch-banner-dismiss-background')
      .dispatchEvent(new Event('touchmove'));
    expect(actions).toEqual([
      'cta',
      'close',
      'background-click',
      'background-swipe',
    ]);
  });

  it("reports the banner's rendered height in px", () => {
    const { journey, root } = start();
    // jsdom has no layout.
    const banner = root.getElementById('branch-banner');
    Object.defineProperty(banner, 'offsetHeight', { value: 812 });
    expect(journey.bannerHeight()).toBe(812);
  });

  it('calls onShown once, after the entrance settles', () => {
    const { onShown } = start();
    expect(onShown).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it('closes once, stops reporting actions, tears down, then calls onClosed', () => {
    const { journey, actions, root } = start();
    vi.runAllTimers();
    const onClosed = vi.fn();
    expect(journey.close(onClosed)).toBe(true);
    expect(journey.close(onClosed)).toBe(false);
    root.querySelector('.branch-banner-close').click();
    expect(actions).toEqual([]);
    vi.runAllTimers();
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(document.getElementById('branch-journey-host')).toBeNull();
    expect(document.body.classList.contains('branch-banner-is-active')).toBe(
      false,
    );
    expect(journey.isLive()).toBe(false);
  });

  it('closing before the entrance finishes never reports shown', () => {
    const { journey, onShown } = start();
    journey.close();
    vi.runAllTimers();
    expect(onShown).not.toHaveBeenCalled();
  });

  it('closing after the entrance plays the exit animation before tearing down', () => {
    const { journey, root, onShown } = start({
      animation: { css: '#branch-banner { animation: x 1s; }' },
    });
    const banner = root.getElementById('branch-banner');
    vi.advanceTimersByTime(2000);
    expect(onShown).toHaveBeenCalledTimes(1);
    const onClosed = vi.fn();
    expect(journey.close(onClosed)).toBe(true);
    expect(banner.classList.contains('branch-banner-exit')).toBe(true);
    expect(onClosed).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(document.getElementById('branch-journey-host')).toBeNull();
  });

  // The exit keyframes assume a fully shown banner; started mid-entrance they jump.
  it('closing during the entrance skips the exit animation and tears down at once', () => {
    const { journey, root } = start({
      animation: { css: '#branch-banner { animation: x 1s; }' },
    });
    const banner = root.getElementById('branch-banner');
    vi.advanceTimersByTime(500);
    const onClosed = vi.fn();
    expect(journey.close(onClosed)).toBe(true);
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(banner.classList.contains('branch-banner-exit')).toBe(false);
    expect(document.getElementById('branch-journey-host')).toBeNull();
    expect(journey.isLive()).toBe(false);
  });

  it('discard tears down at once with no callbacks', () => {
    const { journey, onShown } = start();
    const onClosed = vi.fn();
    journey.discard();
    expect(document.getElementById('branch-journey-host')).toBeNull();
    expect(journey.close(onClosed)).toBe(false);
    vi.runAllTimers();
    expect(onShown).not.toHaveBeenCalled();
    expect(onClosed).not.toHaveBeenCalled();
  });

  it('is not live once the host is removed out of band', () => {
    const { journey } = start();
    document.getElementById('branch-journey-host').remove();
    expect(journey.isLive()).toBe(false);
  });

  describe('when the host is removed out of band', () => {
    // The default payload is fixed and full-page, so it adds the scroll-lock page style.
    const pageStyle = () => document.getElementById('branch-journey-page');
    const flush = () => Promise.resolve();

    it('tears down the page state and reports onRemoved once', async () => {
      const onRemoved = vi.fn();
      const { onShown } = start({}, { onRemoved });
      expect(pageStyle()).not.toBeNull();
      document.getElementById('branch-journey-host').remove();
      await flush();
      expect(pageStyle()).toBeNull();
      expect(document.body.className).toBe('');
      expect(onRemoved).toHaveBeenCalledTimes(1);
      vi.runAllTimers();
      expect(onShown).not.toHaveBeenCalled();
    });

    it('notices the whole body being replaced', async () => {
      const onRemoved = vi.fn();
      start({}, { onRemoved });
      document.documentElement.replaceChild(
        document.createElement('body'),
        document.body,
      );
      await flush();
      expect(pageStyle()).toBeNull();
      expect(onRemoved).toHaveBeenCalledTimes(1);
    });

    it('ignores other changes to the body', async () => {
      const onRemoved = vi.fn();
      const { journey } = start({}, { onRemoved });
      document.body.appendChild(document.createElement('div'));
      await flush();
      expect(onRemoved).not.toHaveBeenCalled();
      expect(journey.isLive()).toBe(true);
    });

    // The exit's own timer finishes the close, so its onClosed still runs.
    it('lets a closing journey finish its exit', async () => {
      const onRemoved = vi.fn();
      const { journey } = start({}, { onRemoved });
      vi.runAllTimers();
      const onClosed = vi.fn();
      journey.close(onClosed);
      document.getElementById('branch-journey-host').remove();
      await flush();
      expect(onRemoved).not.toHaveBeenCalled();
      vi.runAllTimers();
      expect(onClosed).toHaveBeenCalledTimes(1);
      expect(pageStyle()).toBeNull();
    });

    it('stops watching once closed', async () => {
      const onRemoved = vi.fn();
      const { journey } = start({}, { onRemoved });
      journey.discard();
      await flush();
      expect(onRemoved).not.toHaveBeenCalled();
    });
  });

  it('renders into the document it is given, not the global one', () => {
    const doc = frameDocument();
    const { journey } = start({}, { document: doc });
    expect(doc.getElementById('branch-journey-host')).not.toBeNull();
    expect(document.getElementById('branch-journey-host')).toBeNull();
    expect(doc.body.classList.contains('branch-banner-is-active')).toBe(true);
    expect(journey.isLive()).toBe(true);
  });

  it('removes what it mounted and rethrows when mounting fails partway', () => {
    const spy = vi
      .spyOn(document.body.classList, 'add')
      .mockImplementation(() => {
        throw new Error('placement failed');
      });
    try {
      expect(() =>
        render(makeRenderPayload(), {
          platform: 'android',
          hasApp: false,
          onAction() {},
        }),
      ).toThrow('placement failed');
    } finally {
      spy.mockRestore();
    }
    expect(document.getElementById('branch-journey-host')).toBeNull();
  });

  const PLEX =
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;700&display=swap';
  const fontLinks = () =>
    document.head.querySelectorAll('link[data-branch-journey-font]');

  it('keeps its font links while shown and removes them after the exit animation', () => {
    const { journey } = start({
      fonts: [PLEX],
      animation: { css: '#branch-banner { animation: x 1s; }' },
    });
    vi.runAllTimers();
    expect(fontLinks()).toHaveLength(1);
    journey.close();
    expect(fontLinks()).toHaveLength(1);
    vi.runAllTimers();
    expect(fontLinks()).toHaveLength(0);
  });

  it('removes its font links on discard', () => {
    const { journey } = start({ fonts: [PLEX] });
    journey.discard();
    expect(fontLinks()).toHaveLength(0);
  });

  it('undoes a partial placement when placement fails partway', () => {
    document.body.innerHTML =
      '<nav style="margin-top: 3px"><div class="branch-journeys-top"></div></nav>';
    const nav = document.querySelector('nav');
    const spy = vi
      .spyOn(document.body.classList, 'add')
      .mockImplementation(() => {
        throw new Error('placement failed');
      });
    try {
      expect(() =>
        render(
          makeRenderPayload({
            placement: {
              bannerHeight: { value: 76, unit: 'px' },
              sticky: 'absolute',
              anchorY: 'top',
              injectorSelector: '.branch-journeys-top',
            },
            geometry: { push: { side: 'top' } },
          }),
          { platform: 'android', hasApp: false, onAction() {} },
        ),
      ).toThrow('placement failed');
    } finally {
      spy.mockRestore();
    }
    expect(document.getElementById('branch-journey-host')).toBeNull();
    expect(document.getElementById('branch-journey-page')).toBeNull();
    expect(nav.style.marginTop).toBe('3px');
  });

  it('discard during the exit animation cancels the close callback', () => {
    const { journey } = start({
      animation: { css: '#branch-banner { animation: x 1s; }' },
    });
    vi.runAllTimers();
    const onClosed = vi.fn();
    journey.close(onClosed);
    journey.discard();
    vi.runAllTimers();
    expect(onClosed).not.toHaveBeenCalled();
    expect(document.getElementById('branch-journey-host')).toBeNull();
  });
});
