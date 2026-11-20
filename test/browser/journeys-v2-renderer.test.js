import { server, userEvent } from 'vitest/browser';
import { render } from '../../src/journeys/v2/renderer/index.js';
import { makeRenderPayload } from '../journeys/v2/fixtures.js';

// What jsdom can't check: the cascade between page and shadow CSS, page layout and
// positioning. Each test sets up the host page, shows a journey and measures it.

const STANDARD_TOP = {
  creative: {
    html: '<div id="branch-banner"><div class="branch-banner-content"><div id="branch-mobile-action">Get</div></div></div>',
    // The content decides the banner's height.
    css: '#branch-banner { background: #eee; } .branch-banner-content { height: 76px; }',
  },
  page: { push: { side: 'top' }, lockScroll: false },
  presentation: { fullPage: false },
  showEvent: { position: 'top', sticky: 'absolute' },
  // What the server sends: the iframe's box minus its fixed height.
  box: {
    style: {
      position: 'absolute',
      left: '0',
      right: '0',
      top: '0',
      'min-width': '100%',
    },
  },
};

// A 76px top banner whose content is 60px tall.
const CONTENT_SIZED_TOP = {
  creative: { css: '.branch-banner-content { height: 60px; }' },
  page: { lockScroll: false },
  presentation: { fullPage: false },
  showEvent: { position: 'top', sticky: 'absolute' },
  box: {
    style: {
      position: 'absolute',
      left: '0',
      right: '0',
      top: '0',
      'min-width': '100%',
    },
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
      onAction() {},
      onShown: resolve,
    });
  });
}

function showWith(payload, opts) {
  return new Promise((resolve) => {
    journey = render(payload, {
      platform: 'android',
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
        showEvent: { ...STANDARD_TOP.showEvent, sticky: 'fixed' },
        page: { lockScroll: false },
        box: {
          style: {
            position: 'fixed',
            left: '0',
            right: '0',
            top: '0',
            bottom: '0',
            height: 'auto',
          },
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
      'body { color: red; font: italic 30px monospace; letter-spacing: 5px; } div { display: flex !important; position: relative !important; transform: scale(.5) !important; color: lime !important; margin: 40px !important; }',
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
    expect(button.fontFamily).toBe('system-ui, serif');
    expect(button.letterSpacing).toBe('normal');
    expect(button.direction).toBe('ltr');
    expect(rect(shadow().getElementById('branch-banner'))).toEqual({
      top: 0,
      width: 400,
      height: 76,
    });
  });

  // A shadow root has no html or body. Every creative's rules for them are margin resets
  // for v1's iframe; any others are ignored in v2, and none reach the page.
  it("ignores the creative's html, :root and body rules, wherever they are", async () => {
    setPage('', '<p id="page">page</p>');
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: {
          ...STANDARD_TOP.creative,
          // Minified, as GrapesJS writes media rules.
          css: `${STANDARD_TOP.creative.css}html{color:rgb(1, 2, 3)}:root{--c:rgb(4, 5, 6)}#branch-mobile-action{background-color:var(--c, rgb(7, 8, 9))}@media (max-width:480px){body{font-family:monospace}}`,
        },
      }),
    );
    const button = getComputedStyle(
      shadow().getElementById('branch-mobile-action'),
    );
    expect(button.color).not.toBe('rgb(1, 2, 3)');
    expect(button.backgroundColor).toBe('rgb(7, 8, 9)');
    expect(button.fontFamily).not.toBe('monospace');
    const page = getComputedStyle(document.getElementById('page'));
    expect(page.color).not.toBe('rgb(1, 2, 3)');
    expect(page.fontFamily).not.toBe('monospace');
  });

  it("resolves the creative's rem against the user's default size, not the page root", async () => {
    document.documentElement.style.fontSize = '62.5%';
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: {
          ...STANDARD_TOP.creative,
          css: '#branch-banner { padding: 1rem; }',
        },
      }),
    );
    expect(
      getComputedStyle(shadow().getElementById('branch-banner')).paddingTop,
    ).toBe('16px');
  });

  it('sizes the banner from its content, not the height the backend sent, and reports that height', async () => {
    await show(makeRenderPayload(CONTENT_SIZED_TOP));
    expect(rect(shadow().getElementById('branch-banner')).height).toBe(60);
    expect(journey.bannerHeight()).toBe(60);
  });

  it('keeps its own rules over any creative rule, and the box over any normal one, whatever the specificity', async () => {
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
          css: `${STANDARD_TOP.creative.css} body.branch-journey-root, html { display: flex !important; } div#branch-banner#branch-banner { position: static; top: 300px; z-index: 1; }`,
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

  it("places an intrinsic creative by its own rule over the renderer's default position", async () => {
    setPage('body { margin: 0; }', '');
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: {
          ...STANDARD_TOP.creative,
          css: `${STANDARD_TOP.creative.css}\n#branch-banner {\n    position: fixed;\n    left: 0; right: 0;\n    bottom: 0;\n}`,
        },
        box: { style: {} },
        page: { lockScroll: false },
      }),
    );
    const banner = shadow().getElementById('branch-banner');
    expect(getComputedStyle(banner).position).toBe('fixed');
    expect(banner.getBoundingClientRect().bottom).toBe(window.innerHeight);
  });

  it('lets the page restyle the box through ::part(banner)', async () => {
    setPage(
      '#branch-journey-host::part(banner) { z-index: 5; position: absolute; top: 40px; }',
      '',
    );
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        box: { style: { ...STANDARD_TOP.box.style, position: 'fixed' } },
      }),
    );
    const banner = shadow().getElementById('branch-banner');
    expect(getComputedStyle(banner).zIndex).toBe('5');
    expect(getComputedStyle(banner).position).toBe('absolute');
    expect(rect(banner).top).toBe(40);
  });

  it("keeps the box over the creative's own normal rules for #branch-banner", async () => {
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: {
          ...STANDARD_TOP.creative,
          css: `${STANDARD_TOP.creative.css} #branch-banner { height: 300px; }`,
        },
        box: { style: { ...STANDARD_TOP.box.style, height: '50px' } },
      }),
    );
    expect(
      getComputedStyle(shadow().getElementById('branch-banner')).height,
    ).toBe('50px');
  });

  it("drops the box's box-shadow only when the content has no background", async () => {
    const shadowed = (contentCss) =>
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: {
          ...STANDARD_TOP.creative,
          css: `.branch-banner-content { height: 76px; ${contentCss} }`,
        },
        box: {
          style: {
            'box-shadow': '0 0 5px rgba(0, 0, 0, 0.35)',
            ...STANDARD_TOP.box.style,
          },
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
    await show(makeRenderPayload(STANDARD_TOP));
    expect(document.activeElement).toBe(search);
    await close();
    expect(document.activeElement).toBe(search);
  });

  it('focuses a modal on show and hands focus back on close', async () => {
    setPage('', '<input id="search">');
    const search = document.getElementById('search');
    search.focus();
    // The default fixture is a full-page creative: modal.
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
    await show(
      makeRenderPayload({
        ...CONTENT_SIZED_TOP,
        page: { ...CONTENT_SIZED_TOP.page, push: { side: 'top' } },
      }),
    );
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
        box: {
          style: { position: 'absolute', left: '0', right: '0', top: '10px' },
        },
        page: {
          ...STANDARD_TOP.page,
          push: { side: 'top', offset: { value: 10, unit: 'px' } },
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

  it('reports shown asynchronously, after render returns', async () => {
    for (const animation of [SLIDE, { css: '' }]) {
      let returned = false;
      const shown = new Promise((resolve) => {
        journey = render(makeRenderPayload({ ...STANDARD_TOP, animation }), {
          platform: 'android',
          onAction() {},
          onShown: () => resolve(returned),
        });
      });
      returned = true;
      expect(await shown).toBe(true);
      journey.discard();
    }
  });

  it("doesn't wait for an infinite creative animation, on the banner or inside it", async () => {
    const start = performance.now();
    await show(
      makeRenderPayload({
        ...STANDARD_TOP,
        creative: {
          ...STANDARD_TOP.creative,
          css: `${STANDARD_TOP.creative.css} @keyframes t-pulse { to { opacity: 0.5; } } #branch-mobile-action { animation: t-pulse 0.1s infinite; }`,
        },
        animation: {
          css: `${SLIDE.css} #branch-banner.branch-banner-enter { animation: t-in 0.2s linear both, t-pulse 0.1s infinite; }`,
        },
      }),
    );
    expect(performance.now() - start).toBeLessThan(1000);
  });

  it('never reports shown once discarded mid-entrance', async () => {
    const onShown = vi.fn();
    journey = render(makeRenderPayload({ ...STANDARD_TOP, animation: SLIDE }), {
      platform: 'android',
      onAction() {},
      onShown,
    });
    journey.discard();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(onShown).not.toHaveBeenCalled();
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
        showEvent: { position: 'bottom', sticky: 'fixed' },
        page: { lockScroll: false },
        box: {
          style: {
            position: 'fixed',
            left: '50%',
            bottom: '0',
            translate: '-50% 0',
            width: '200px',
          },
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
    const FONT = { family: 'Branch Test Sans', url: URL };
    const fontLinks = () =>
      document.head.querySelectorAll('link[data-branch-journey-font]');

    it('adds a nonce-tagged link for the journey and removes it after the exit', async () => {
      await showWith(makeRenderPayload({ ...STANDARD_TOP, fonts: [FONT] }), {
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
            fonts: [{ family, url: local }],
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
        const bare = {
          family: FONT.family,
          url: 'http://127.0.0.1:9/css2?family=Branch+Test+Sans',
        };
        await show(makeRenderPayload({ ...STANDARD_TOP, fonts: [bare] }));
        expect(fontLinks()).toHaveLength(0);
      } finally {
        document.fonts.delete(face);
      }
    });

    it('links each font the page lacks, once per URL', async () => {
      const other = {
        family: 'Branch Other Sans',
        url: 'http://127.0.0.1:9/css2?family=Branch+Other+Sans',
      };
      await show(
        makeRenderPayload({ ...STANDARD_TOP, fonts: [FONT, other, FONT] }),
      );
      expect(Array.from(fontLinks(), (link) => link.href)).toEqual([
        URL,
        other.url,
      ]);
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
