import { server, userEvent } from 'vitest/browser';
import { toPayload } from '../../src/journeys/v2/adapter.js';
import { render } from '../../src/journeys/v2/renderer/index.js';
import {
  adapterInput,
  makeRenderPayload,
  templateHtml,
} from '../journeys/v2/fixtures.js';

// What jsdom can't check: the cascade between page and shadow CSS, page layout and
// positioning. Each test sets up the host page, shows a journey and measures it.

const STANDARD_TOP = {
  creative: {
    html: '<div id="branch-banner"><div class="branch-banner-content"><div id="branch-mobile-action">Get</div></div></div>',
    // The content decides the banner's height.
    css: '#branch-banner { background: #eee; } .branch-banner-content { height: 76px; }',
    wcag: false,
  },
  placement: {
    sticky: 'absolute',
    anchorY: 'top',
    bannerHeight: { value: 76, unit: 'px' },
    isIntrinsic: false,
  },
  geometry: {
    // What the adapter emits: the iframe's box minus its fixed height.
    css: 'position: absolute; left: 0; right: 0; top: 0; min-width: 100%;',
    zIndex: 99999,
    push: { side: 'top' },
  },
};

let pageStyle = null;
let journey = null;

function setPage(css, html) {
  pageStyle = document.createElement('style');
  pageStyle.textContent = css;
  document.head.appendChild(pageStyle);
  document.body.innerHTML = html;
}

function show(payload) {
  return new Promise((resolve) => {
    journey = render(payload, {
      platform: 'android',
      hasApp: false,
      onAction() {},
      onShown: resolve,
    });
  });
}

function showWith(payload, opts) {
  return new Promise((resolve) => {
    journey = render(payload, {
      platform: 'android',
      hasApp: false,
      onAction() {},
      ...opts,
      onShown: resolve,
    });
  });
}

function close() {
  return new Promise((resolve) => journey.close(resolve));
}

function shadow() {
  return document.getElementById('branch-journey-host').shadowRoot;
}

// Page coordinates, so a scrolled page doesn't move the numbers.
function rect(el) {
  const { top, width, height } = el.getBoundingClientRect();
  return { top: top + window.scrollY, width, height };
}

// The push margin eases over 0.25s, as v1's did. Polled, not slept on: a loaded CI
// machine can take well past 0.25s to finish the transition.
function expectTop(el, top) {
  return expect.poll(() => rect(el).top, { timeout: 2000 }).toBe(top);
}

describe('journeys/v2 renderer in a real browser', () => {
  afterEach(() => {
    journey?.discard();
    journey = null;
    pageStyle?.remove();
    pageStyle = null;
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('dir');
    document.documentElement.style.fontSize = '';
    window.scrollTo(0, 0);
  });

  it('fills the window between top and bottom, whatever height the creative sets', async () => {
    setPage('body { margin: 0; }', '');
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: {
          ...STANDARD_TOP.creative,
          css: '#branch-banner { height: 200px; background: #eee; }',
        },
        placement: { ...STANDARD_TOP.placement, sticky: 'fixed' },
        geometry: {
          css: 'position: fixed; left: 0; right: 0; top: 0; bottom: 0; height: auto;',
          zIndex: 99999,
        },
      }),
    );
    expect(
      shadow().getElementById('branch-banner').getBoundingClientRect(),
    ).toMatchObject({ top: 0, height: window.innerHeight });
  });

  it("doesn't change a grid body's layout", async () => {
    setPage(
      'body { margin: 0; display: grid; grid-template-rows: auto 1fr auto; min-height: 100vh; } header { height: 50px; } footer { height: 40px; }',
      '<header>h</header><main>m</main><footer>f</footer>',
    );
    const main = document.querySelector('main');
    const before = main.getBoundingClientRect().height;
    await show(makeRenderPayload(STANDARD_TOP));
    expect(main.getBoundingClientRect().height).toBe(before);
    expect(rect(shadow().getElementById('branch-banner'))).toEqual({
      top: 0,
      width: 400,
      height: 76,
    });
  });

  it("pushes the page by the banner height, replacing the body's own margin like v1", async () => {
    // The browser default; Vitest's own page resets it.
    setPage(
      'body { margin: 8px; } header { height: 50px; }',
      '<header>h</header>',
    );
    const header = document.querySelector('header');
    expect(rect(header).top).toBe(8);
    await show(makeRenderPayload(STANDARD_TOP));
    await expectTop(header, 76);
    expect(document.body.getAttribute('style')).toBeNull();
    expect(
      Array.from(document.body.children, (el) => el.id || el.tagName),
    ).toEqual(['branch-journey-host', 'HEADER']);
    await close();
    await expectTop(header, 8);
    expect(document.getElementById('branch-journey-page')).toBeNull();
    expect(document.getElementById('branch-journey-host')).toBeNull();
  });

  it('keeps page styles out of the creative, even !important ones on div', async () => {
    document.documentElement.setAttribute('dir', 'rtl');
    setPage(
      'body { color: red; font: italic 30px serif; letter-spacing: 5px; } div { display: flex !important; position: relative !important; transform: scale(.5) !important; color: lime !important; margin: 40px !important; }',
      '<p>page</p>',
    );
    await show(makeRenderPayload(STANDARD_TOP));
    const host = document.getElementById('branch-journey-host');
    expect(host.getAttribute('style')).toBe('display: contents !important;');
    const button = getComputedStyle(
      shadow().getElementById('branch-mobile-action'),
    );
    expect(button.color).toBe('rgb(0, 0, 0)');
    expect(button.fontStyle).toBe('normal');
    expect(button.letterSpacing).toBe('normal');
    expect(button.direction).toBe('ltr');
    expect(rect(shadow().getElementById('branch-banner'))).toEqual({
      top: 0,
      width: 400,
      height: 76,
    });
  });

  it("applies the creative's body rules, as v1's iframe body did", async () => {
    const result = toPayload(
      adapterInput({
        html: templateHtml({
          css: 'body { font-family: monospace; color: rgb(1, 2, 3); } #branch-banner { position: fixed; left: 0; right: 0; bottom: 0; }',
        }),
      }),
      { _branchViewData: {} },
    );
    await show({
      ...result.payload.render,
      animation: { ...result.payload.render.animation, css: '' },
    });
    const button = getComputedStyle(
      shadow().getElementById('branch-mobile-action'),
    );
    expect(button.fontFamily).toBe('monospace');
    expect(button.color).toBe('rgb(1, 2, 3)');
  });

  it("resolves the creative's rem against the user's default size, not the page root", async () => {
    document.documentElement.style.fontSize = '62.5%';
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: {
          ...STANDARD_TOP.creative,
          // A monospace root has a smaller `medium`; rem must not be read after it applies.
          css: 'body { font-family: monospace; } #branch-banner { padding: 1rem; }',
        },
      }),
    );
    expect(
      getComputedStyle(shadow().getElementById('branch-banner')).paddingTop,
    ).toBe('16px');
  });

  it('sizes the banner from its content, not the height the backend sent, and reports that height', async () => {
    const result = toPayload(
      adapterInput({
        html: templateHtml({
          metadata: {
            bannerHeight: '76px',
            position: 'top',
            sticky: 'absolute',
            isIntrinsic: false,
            ctaText: { no_app: 'Get' },
          },
          css: '.branch-banner-content { height: 60px; }',
          iframeCss:
            '#branch-banner-iframe { border: 0; z-index: 99999; position: absolute; left: 0; right: 0; top: 0; min-width: 100%; height:76px; }',
        }),
      }),
      { _branchViewData: {} },
    );
    await show({
      ...result.payload.render,
      animation: { ...result.payload.render.animation, css: '' },
    });
    expect(rect(shadow().getElementById('branch-banner')).height).toBe(60);
    expect(journey.bannerHeight()).toBe(60);
  });

  it('keeps its own rules over any creative rule, whatever the specificity or !important', async () => {
    setPage(
      'body { margin: 0; display: grid; grid-template-rows: auto 1fr auto; min-height: 100vh; } header { height: 50px; } footer { height: 40px; }',
      '<header>h</header><main>m</main><footer>f</footer>',
    );
    const main = document.querySelector('main');
    const before = main.getBoundingClientRect().height;
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: {
          ...STANDARD_TOP.creative,
          css: `${STANDARD_TOP.creative.css} body.branch-journey-root, html { display: flex !important; } div#branch-banner#branch-banner { position: static !important; top: 300px !important; z-index: 1 !important; }`,
        },
      }),
    );
    const banner = shadow().getElementById('branch-banner');
    expect(getComputedStyle(banner.parentElement).display).toBe('contents');
    expect(getComputedStyle(banner.parentElement.parentElement).display).toBe(
      'contents',
    );
    expect(getComputedStyle(banner).zIndex).toBe('99999');
    expect(rect(banner)).toEqual({ top: 0, width: 400, height: 76 });
    expect(main.getBoundingClientRect().height).toBe(before);
  });

  it("applies the creative's html and body rules wherever they are, as v1's iframe did", async () => {
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: {
          ...STANDARD_TOP.creative,
          // Minified, as GrapesJS writes media rules; html's color inherits through body.
          css: `${STANDARD_TOP.creative.css}html{color:rgb(1, 2, 3)}@media (max-width:480px){body{font-family:monospace}}`,
        },
      }),
    );
    const button = getComputedStyle(
      shadow().getElementById('branch-mobile-action'),
    );
    expect(button.color).toBe('rgb(1, 2, 3)');
    expect(button.fontFamily).toBe('monospace');
  });

  it("drops the geometry's box-shadow only when the content has no background", async () => {
    const shadowed = (contentCss) =>
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: {
          ...STANDARD_TOP.creative,
          css: `.branch-banner-content { height: 76px; ${contentCss} }`,
        },
        geometry: {
          ...STANDARD_TOP.geometry,
          css: `box-shadow: 0 0 5px rgba(0, 0, 0, 0.35); ${STANDARD_TOP.geometry.css}`,
        },
      });
    await show(shadowed('background: transparent;'));
    expect(
      getComputedStyle(shadow().getElementById('branch-banner')).boxShadow,
    ).toBe('none');
    journey.discard();
    await show(shadowed('background: white;'));
    expect(
      getComputedStyle(shadow().getElementById('branch-banner')).boxShadow,
    ).not.toBe('none');
  });

  it("doesn't take focus from the page when an inline banner shows", async () => {
    setPage('', '<input id="search">');
    const search = document.getElementById('search');
    search.focus();
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: { ...STANDARD_TOP.creative, wcag: true },
      }),
    );
    expect(document.activeElement).toBe(search);
    await close();
    expect(document.activeElement).toBe(search);
  });

  it('focuses a modal on show and hands focus back on close', async () => {
    setPage('', '<input id="search">');
    const search = document.getElementById('search');
    search.focus();
    // The default fixture is a full-page WCAG creative: modal.
    await show(makeRenderPayload());
    expect(document.activeElement.id).toBe('branch-journey-host');
    expect(shadow().activeElement).not.toBeNull();
    await close();
    expect(document.activeElement).toBe(search);
  });

  it("doesn't pull focus back on close once the visitor has moved on", async () => {
    setPage('', '<input id="search"><input id="other">');
    document.getElementById('search').focus();
    await show(makeRenderPayload());
    const other = document.getElementById('other');
    other.focus();
    await close();
    expect(document.activeElement).toBe(other);
  });

  it("pushes the page by the banner's own height, not the height the backend sent", async () => {
    setPage(
      'body { margin: 0; } header { height: 50px; }',
      '<header>h</header>',
    );
    const result = toPayload(
      adapterInput({
        html: templateHtml({
          metadata: {
            bannerHeight: '76px',
            position: 'top',
            sticky: 'absolute',
            isIntrinsic: false,
            ctaText: { no_app: 'Get' },
          },
          css: '.branch-banner-content { height: 60px; }',
          iframeCss:
            'body { transition: 0.25s; margin-top: 76px; }\n#branch-banner-iframe { border: 0; z-index: 99999; position: absolute; left: 0; right: 0; top: 0; min-width: 100%; height:76px; }',
        }),
      }),
      { _branchViewData: {} },
    );
    await show({
      ...result.payload.render,
      animation: { ...result.payload.render.animation, css: '' },
    });
    await expectTop(document.querySelector('header'), 60);
  });

  it("adds the banner's offset from the edge", async () => {
    setPage(
      'body { margin: 0; } header { height: 50px; }',
      '<header>h</header>',
    );
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        placement: {
          ...STANDARD_TOP.placement,
          offsetY: { value: 10, unit: 'px' },
        },
        geometry: {
          ...STANDARD_TOP.geometry,
          css: 'position: absolute; left: 0; right: 0; top: 10px;',
        },
      }),
    );
    await expectTop(document.querySelector('header'), 86);
    expect(rect(shadow().getElementById('branch-banner')).top).toBe(10);
  });

  it('follows the banner when its content changes height', async () => {
    setPage(
      'body { margin: 0; } header { height: 50px; }',
      '<header>h</header>',
    );
    await show(makeRenderPayload(STANDARD_TOP));
    shadow()
      .querySelector('.branch-banner-content')
      .style.setProperty('height', '120px');
    await expectTop(document.querySelector('header'), 120);
  });
});

// What differs between engines: animation events and timing, CSS property support,
// FontFaceSet, focus and keyboard handling, event retargeting.
describe('journeys/v2 renderer behavior across engines', () => {
  afterEach(() => {
    journey?.discard();
    journey = null;
    pageStyle?.remove();
    pageStyle = null;
    document.body.innerHTML = '';
    window.scrollTo(0, 0);
  });

  const SLIDE = {
    css:
      '@keyframes t-in { from { opacity: 0; } to { opacity: 1; } }' +
      '@keyframes t-out { from { opacity: 1; } to { opacity: 0; } }' +
      '.branch-banner-enter { animation: t-in 0.2s linear both; }' +
      '.branch-banner-exit { animation: t-out 0.2s linear both; }',
  };
  const host = () => document.getElementById('branch-journey-host');

  it('reports shown when the entrance animation ends, not before', async () => {
    const start = performance.now();
    await show(makeRenderPayload({ ...STANDARD_TOP, animation: SLIDE }));
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(180);
    expect(elapsed).toBeLessThan(1000);
  });

  it('keeps the journey on the page until the exit animation ends', async () => {
    await show(makeRenderPayload({ ...STANDARD_TOP, animation: SLIDE }));
    const start = performance.now();
    const closed = close();
    expect(host()).not.toBeNull();
    await closed;
    expect(performance.now() - start).toBeGreaterThanOrEqual(180);
    expect(host()).toBeNull();
  });

  it('still animates the exit when only the entrance is disabled', async () => {
    const start = performance.now();
    await showWith(makeRenderPayload({ ...STANDARD_TOP, animation: SLIDE }), {
      entryAnimationDisabled: true,
    });
    expect(performance.now() - start).toBeLessThan(150);
    const banner = shadow().getElementById('branch-banner');
    const closed = close();
    expect(getComputedStyle(banner).animationName).toBe('t-out');
    const exitStart = performance.now();
    await closed;
    expect(performance.now() - exitStart).toBeGreaterThanOrEqual(150);
  });

  it('keeps a centered banner centered: translate composes with the slide transform', async () => {
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        placement: {
          ...STANDARD_TOP.placement,
          sticky: 'fixed',
          anchorY: 'bottom',
        },
        geometry: {
          css: 'position: fixed; left: 50%; bottom: 0; translate: -50% 0; width: 200px;',
          zIndex: 99999,
        },
        animation: {
          css:
            '@keyframes t-up { from { transform: translateY(100%); } to { transform: translateY(0); } }' +
            '.branch-banner-enter { animation: t-up 0.1s both; }',
        },
      }),
    );
    const box = shadow()
      .getElementById('branch-banner')
      .getBoundingClientRect();
    expect(box.left).toBe(100);
    expect(box.width).toBe(200);
    expect(box.bottom).toBe(window.innerHeight);
  });

  it('locks page scroll for a full-page fixed creative and unlocks it on close', async () => {
    setPage('main { height: 3000px; }', '<main>m</main>');
    // The default fixture: full-page, fixed.
    await show(makeRenderPayload());
    expect(getComputedStyle(document.body).overflow).toBe('hidden');
    expect(document.body.classList.contains('branch-banner-no-scroll')).toBe(
      true,
    );
    await close();
    expect(getComputedStyle(document.body).overflow).toBe('visible');
    expect(document.body.classList.contains('branch-banner-no-scroll')).toBe(
      false,
    );
  });

  describe('font links', () => {
    // Port 9 refuses at once: no network, and a failed font load is harmless.
    const URL = 'http://127.0.0.1:9/css2?family=Branch+Test+Sans:wght@400';
    const fontLinks = () =>
      document.head.querySelectorAll('link[data-branch-journey-font]');

    it('adds a nonce-tagged link for the journey and removes it after the exit', async () => {
      await showWith(makeRenderPayload({ ...STANDARD_TOP, fonts: [URL] }), {
        nonce: 'n0nce',
      });
      const [link] = fontLinks();
      expect(link.href).toBe(URL);
      // Browsers hide the attribute's value once connected; the property keeps it.
      expect(link.nonce).toBe('n0nce');
      await close();
      expect(fontLinks()).toHaveLength(0);
    });

    // Chrome ignores @font-face inside a shadow root, which is why fonts are hoisted.
    // A face the hoisted link declares must be requested by text inside the shadow root.
    // Skipped on WebKit: it requests a font only when it paints, and its headless page
    // sometimes doesn't paint while the other engines run. The Chrome behavior this
    // guards is what matters.
    it.skipIf(server.browser === 'webkit')(
      'makes a hoisted font reach the text inside the shadow root',
      async () => {
        const family = 'Branch Hoist Test';
        const local = `${location.origin}/test/browser/fixtures/branch-test-font.css?family=Branch+Hoist+Test`;
        const requested = () =>
          Array.from(document.fonts).some(
            (face) =>
              face.family.replace(/["']/g, '') === family &&
              face.status !== 'unloaded',
          );
        await show(
          makeRenderPayload({
            ...STANDARD_TOP,
            creative: {
              ...STANDARD_TOP.creative,
              css: `${STANDARD_TOP.creative.css} #branch-mobile-action { font-family: '${family}', monospace; }`,
            },
            fonts: [local],
          }),
        );
        await vi.waitFor(() => expect(requested()).toBe(true), {
          timeout: 3000,
        });
      },
    );

    it('adds nothing for a bare family the page already declares', async () => {
      const face = new FontFace('Branch Test Sans', 'local(Arial)');
      document.fonts.add(face);
      try {
        const bare = 'http://127.0.0.1:9/css2?family=Branch+Test+Sans';
        await show(makeRenderPayload({ ...STANDARD_TOP, fonts: [bare] }));
        expect(fontLinks()).toHaveLength(0);
      } finally {
        document.fonts.delete(face);
      }
    });
  });

  it('reports a control once per use, and page click listeners see the host as the target', async () => {
    const actions = [];
    const targets = [];
    const onClick = (event) => targets.push(event.target.id);
    document.addEventListener('click', onClick);
    try {
      await showWith(makeRenderPayload(STANDARD_TOP), {
        onAction: (action) => actions.push(action),
      });
      shadow().getElementById('branch-mobile-action').click();
      expect(actions).toEqual(['cta']);
      expect(targets).toEqual(['branch-journey-host']);
    } finally {
      document.removeEventListener('click', onClick);
    }
  });

  it('stops reporting controls once closing starts', async () => {
    const actions = [];
    await showWith(makeRenderPayload({ ...STANDARD_TOP, animation: SLIDE }), {
      onAction: (action) => actions.push(action),
    });
    const closed = close();
    shadow().getElementById('branch-mobile-action').click();
    await closed;
    expect(actions).toEqual([]);
  });

  describe('keyboard (WCAG creatives)', () => {
    // The default fixture is a full-page WCAG creative, so modal: a close button and the
    // CTA, both div role="button".
    async function showModal() {
      const actions = [];
      await showWith(makeRenderPayload(), {
        onAction: (action) => actions.push(action),
      });
      return {
        actions,
        close: shadow().getElementById('branch-banner-close1'),
        cta: shadow().getElementById('branch-mobile-action'),
      };
    }

    it('activates role="button" controls with Enter and Space', async () => {
      const modal = await showModal();
      modal.cta.focus();
      await userEvent.keyboard('{Enter}');
      modal.close.focus();
      await userEvent.keyboard(' ');
      expect(modal.actions).toEqual(['cta', 'close']);
    });

    it('starts focus on the dialog, then Tab and Shift+Tab stay inside', async () => {
      const modal = await showModal();
      const dialog = shadow().querySelector('[role="dialog"]');
      expect(shadow().activeElement).toBe(dialog);
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
      expect(shadow().activeElement).toBe(modal.cta);
      dialog.focus();
      await userEvent.keyboard('{Tab}');
      expect(shadow().activeElement).toBe(modal.close);
    });

    it('closes the modal on Escape, like its close button', async () => {
      const modal = await showModal();
      await userEvent.keyboard('{Escape}');
      expect(modal.actions).toEqual(['close']);
    });

    it('wraps Tab and Shift+Tab inside a modal', async () => {
      const modal = await showModal();
      modal.cta.focus();
      await userEvent.keyboard('{Tab}');
      expect(shadow().activeElement).toBe(modal.close);
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
      expect(shadow().activeElement).toBe(modal.cta);
    });
  });
});
