import { mount } from '../../../../src/journeys/v2/renderer/mount.js';
import {
  applyPlacement,
  collapsePush,
  releasePlacement,
} from '../../../../src/journeys/v2/renderer/placement.js';
import { makeRenderPayload } from '../fixtures.js';

const view = { document, nonce: 'n0nce', platform: 'android' };
const STANDARD = {
  page: { push: { side: 'top' }, lockScroll: false, shiftTopElements: true },
  presentation: { fullPage: false },
  showEvent: { position: 'top', sticky: 'absolute' },
  box: { style: { position: 'absolute', top: '0' } },
};

// jsdom has no layout, so the banner's measured height is stubbed.
function setHeight(banner, px) {
  Object.defineProperty(banner, 'offsetHeight', {
    configurable: true,
    value: px,
  });
}

function place(overrides, height = 76) {
  const payload = makeRenderPayload(overrides);
  const mounted = mount(payload, view);
  setHeight(mounted.banner, height);
  return {
    mounted,
    state: applyPlacement(payload, mounted.banner, view),
  };
}

const pageCss = () =>
  document.getElementById('branch-journey-page').textContent;

describe('journeys/v2 placement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.body.className = '';
    document.head.innerHTML = '';
  });

  it('pushes the page with a nonce-tagged body margin, eases it back on close and removes it on release', () => {
    const { state } = place(STANDARD);
    const style = document.getElementById('branch-journey-page');
    expect(style.parentElement).toBe(document.head);
    expect(style.getAttribute('nonce')).toBe('n0nce');
    expect(style.textContent).toBe(
      'body { transition: margin-top 0.25s ease; margin-top: 76px !important; }',
    );
    collapsePush(state);
    expect(style.textContent).toBe(
      'body { transition: margin-top 0.25s ease; }',
    );
    releasePlacement(state);
    expect(document.getElementById('branch-journey-page')).toBeNull();
  });

  it("adds the banner's offset from the edge to its measured height", () => {
    place({
      ...STANDARD,
      page: {
        ...STANDARD.page,
        push: { side: 'top', offset: { value: 2, unit: 'vh' } },
      },
    });
    expect(pageCss()).toBe(
      'body { transition: margin-top 0.25s ease; margin-top: calc(76px + 2vh) !important; }',
    );
  });

  it('follows the banner when its height changes, until the push collapses', () => {
    const observers = [];
    const original = window.ResizeObserver;
    window.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.disconnect = vi.fn();
        observers.push(this);
      }
      observe(el) {
        this.target = el;
      }
    };
    try {
      const { mounted, state } = place(STANDARD);
      const [observer] = observers;
      expect(observer.target).toBe(mounted.banner);
      setHeight(mounted.banner, 90);
      observer.callback();
      expect(pageCss()).toBe(
        'body { transition: margin-top 0.25s ease; margin-top: 90px !important; }',
      );
      collapsePush(state);
      expect(observer.disconnect).toHaveBeenCalled();
      expect(pageCss()).toBe('body { transition: margin-top 0.25s ease; }');
    } finally {
      window.ResizeObserver = original;
    }
  });

  it('pushes from the bottom for bottom pushes', () => {
    place(
      {
        ...STANDARD,
        box: { style: {} },
        page: { ...STANDARD.page, push: { side: 'bottom' } },
      },
      60,
    );
    expect(document.getElementById('branch-journey-page').textContent).toBe(
      'body { transition: margin-bottom 0.25s ease; margin-bottom: 60px !important; }',
    );
  });

  it('adds no elements to the body and leaves its inline style alone', () => {
    document.body.innerHTML = '<p>page</p>';
    const { state } = place(STANDARD);
    expect(
      Array.from(document.body.children).map((el) => el.id || el.tagName),
    ).toEqual(['branch-journey-host', 'P']);
    expect(document.body.getAttribute('style')).toBeNull();
    releasePlacement(state);
  });

  it('pushes each injector parent once by the measured height and restores its original inline margin', () => {
    document.body.innerHTML =
      '<nav id="nav" style="margin-top: 12px"><div class="branch-journeys-top"></div><div class="branch-journeys-top"></div></nav>';
    const nav = document.getElementById('nav');
    // Measured, like the body push: the content decides the height, not bannerHeight (76px).
    const { state } = place(STANDARD, 64);
    expect(nav.style.marginTop).toBe('64px');
    expect(state.parents).toHaveLength(1);
    releasePlacement(state);
    expect(nav.style.marginTop).toBe('12px');
  });

  it('keeps injector parents in step with the banner height, even with no body push', () => {
    const observers = [];
    const original = window.ResizeObserver;
    window.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.disconnect = vi.fn();
        observers.push(this);
      }
      observe() {}
    };
    try {
      document.body.innerHTML =
        '<nav id="nav"><div class="branch-journeys-top"></div></nav>';
      const { mounted, state } = place({
        ...STANDARD,
        page: { lockScroll: false, shiftTopElements: true },
      });
      expect(document.getElementById('branch-journey-page')).toBeNull();
      setHeight(mounted.banner, 90);
      observers[0].callback();
      expect(document.getElementById('nav').style.marginTop).toBe('90px');
      releasePlacement(state);
      expect(observers[0].disconnect).toHaveBeenCalled();
      expect(document.getElementById('nav').style.marginTop).toBe('');
    } finally {
      window.ResizeObserver = original;
    }
  });

  it('shifts no top elements unless the payload asks', () => {
    document.body.innerHTML =
      '<nav id="nav"><div class="branch-journeys-top"></div></nav>';
    const { state } = place({
      ...STANDARD,
      page: { ...STANDARD.page, shiftTopElements: false },
    });
    expect(state.parents).toHaveLength(0);
    expect(document.getElementById('nav').style.marginTop).toBe('');
  });

  it('skips fixed injector parents under a full-page creative', () => {
    document.body.innerHTML =
      '<nav id="nav" style="position: fixed"><div class="branch-journeys-top"></div></nav>';
    place({ page: { shiftTopElements: true } });
    expect(document.getElementById('nav').style.marginTop).toBe('');
  });

  it('locks scroll for full-page fixed creatives in the same style, until release', () => {
    const { state } = place({});
    const style = document.getElementById('branch-journey-page');
    expect(style.getAttribute('nonce')).toBe('n0nce');
    expect(style.textContent).toBe(
      'html { overflow: hidden !important; } body { overflow: hidden !important; }',
    );
    expect(document.body.classList.contains('branch-banner-is-active')).toBe(
      true,
    );
    expect(document.body.classList.contains('branch-banner-no-scroll')).toBe(
      true,
    );
    collapsePush(state);
    expect(style.textContent).toBe(
      'html { overflow: hidden !important; } body { overflow: hidden !important; }',
    );
    releasePlacement(state);
    expect(document.getElementById('branch-journey-page')).toBeNull();
    expect(document.body.classList.contains('branch-banner-is-active')).toBe(
      false,
    );
    expect(document.body.classList.contains('branch-banner-no-scroll')).toBe(
      false,
    );
  });

  it('keeps a scroll lock without a push free of margins as the banner resizes', () => {
    const observers = [];
    const original = window.ResizeObserver;
    window.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.disconnect = vi.fn();
        observers.push(this);
      }
      observe() {}
    };
    try {
      document.body.innerHTML =
        '<nav id="nav"><div class="branch-journeys-top"></div></nav>';
      const { mounted } = place({
        page: { shiftTopElements: true },
      });
      setHeight(mounted.banner, 90);
      observers[0].callback();
      expect(document.getElementById('nav').style.marginTop).toBe('90px');
      expect(pageCss()).toBe(
        'html { overflow: hidden !important; } body { overflow: hidden !important; }',
      );
    } finally {
      window.ResizeObserver = original;
    }
  });

  it('pushes and locks scroll together when a full-page creative pushes', () => {
    place({ box: { style: {} }, page: { push: { side: 'top' } } });
    expect(pageCss()).toBe(
      'html { overflow: hidden !important; } body { transition: margin-top 0.25s ease; margin-top: 76px !important; overflow: hidden !important; }',
    );
  });

  it('adds no page style for partial-height creatives that push nothing', () => {
    place({
      page: { lockScroll: false },
      presentation: { fullPage: false },
    });
    expect(document.getElementById('branch-journey-page')).toBeNull();
    expect(document.body.classList.contains('branch-banner-no-scroll')).toBe(
      false,
    );
  });

  it('leaves the content height to the creative, even for relative heights', () => {
    const html = makeRenderPayload().creative.html.replace(
      '<div id="branch-banner-dismiss-background" class="branch-banner-dismiss-background"></div>',
      '',
    );
    const { mounted } = place({
      creative: { html },
      page: { lockScroll: false },
      presentation: { fullPage: false },
    });
    expect(
      mounted.root.querySelector('.branch-banner-content').style.height,
    ).toBe('');
  });
});
