import {
  HOST_ID,
  isTransparent,
  mount,
  shadowCss,
} from '../../../../src/journeys/v2/renderer/mount.js';
import { makeRenderPayload } from '../fixtures.js';

const view = { document, nonce: 'n0nce', platform: 'android' };

describe('journeys/v2 mount', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts an open shadow root on a box-less, CSSOM-styled host prepended on mobile', () => {
    document.body.innerHTML = '<p id="page">page</p>';
    const { host, root, banner } = mount(makeRenderPayload(), {
      ...view,
      hasApp: false,
    });
    expect(document.body.firstElementChild).toBe(host);
    expect(host.id).toBe(HOST_ID);
    expect(host.shadowRoot).toBe(root);
    // One declaration: no box means page CSS has nothing to lay out, and the
    // grid/flex body of the page never sees the host as an item.
    expect(host.style.length).toBe(1);
    expect(host.style.getPropertyValue('display')).toBe('contents');
    expect(host.style.getPropertyPriority('display')).toBe('important');
    expect(banner).toBe(root.getElementById('branch-banner'));
  });

  it('appends the host for desktop journeys', () => {
    document.body.innerHTML = '<p id="page">page</p>';
    const { host } = mount(
      makeRenderPayload({ creative: { deviceType: 'desktop' } }),
      { ...view, hasApp: false },
    );
    expect(document.body.lastElementChild).toBe(host);
  });

  it('puts one nonce-tagged style in the shadow root with the geometry on #branch-banner', () => {
    const payload = makeRenderPayload({
      geometry: { css: 'position: absolute; top: 0;' },
      animation: { css: '.branch-banner-enter { animation: x 1s; }' },
    });
    const { root } = mount(payload, { ...view, hasApp: false });
    const styles = root.querySelectorAll('style');
    expect(styles).toHaveLength(1);
    expect(styles[0].getAttribute('nonce')).toBe('n0nce');
    const css = styles[0].textContent;
    expect(css).toContain(
      '#branch-banner { z-index: 99999 !important; position: absolute !important; top: 0 !important; }',
    );
    expect(css).toContain('.branch-banner-enter { animation: x 1s; }');
  });

  it('keeps the iframe stacking level for every creative, scrim just below the banner', () => {
    const css = shadowCss(makeRenderPayload());
    expect(css).toContain('#branch-banner { z-index: 99999 !important; }');
    expect(css).toContain(
      '.branch-banner-dismiss-background { z-index: 99998 !important; }',
    );
  });

  it("doesn't double an !important the geometry already has", () => {
    const css = shadowCss(
      makeRenderPayload({ geometry: { css: 'top: 0 !important;' } }),
    );
    expect(css).toContain('top: 0 !important;');
    expect(css).not.toContain('!important !important');
  });

  it('wraps the creative in box-less html and body stand-ins', () => {
    const { root } = mount(makeRenderPayload(), { ...view, hasApp: false });
    const body = root.getElementById('branch-banner').parentElement;
    expect(body.className).toBe('branch-journey-root branch-banner-android');
    expect(body.parentElement.className).toBe('branch-journey-html');
    expect(body.parentElement.parentNode).toBe(root);
    expect(shadowCss(makeRenderPayload())).toContain(
      ':host, .branch-journey-html, .branch-journey-root { display: contents !important; }',
    );
  });

  it('layers the css: renderer rules first and important, then the reset, then the creative', () => {
    const payload = makeRenderPayload({
      creative: { css: '#branch-banner { color: red; }' },
      geometry: { css: 'top: 0;' },
      animation: { css: '.branch-banner-exit { animation: out 1s; }' },
    });
    const css = shadowCss(payload);
    // Important declarations reverse the layer order: the first layer's beat every
    // other rule in the shadow root, creative !important ones included.
    expect(css.startsWith('@layer branch-renderer, reset, creative;')).toBe(
      true,
    );
    const reset = css.indexOf('@layer reset {');
    expect(css.slice(reset)).toMatch(
      /^@layer reset \{\n\.branch-journey-html \{ all: initial; direction: ltr; font-family: serif; \}/,
    );
    expect(css).toContain(
      '@layer creative {\n#branch-banner { color: red; }\n}',
    );
    // The animation stays unlayered: it beats the creative's normal rules.
    expect(
      css.trimEnd().endsWith('.branch-banner-exit { animation: out 1s; }'),
    ).toBe(true);
  });

  it("maps the creative's html, :root and body selectors onto the stand-ins", () => {
    const css = shadowCss(
      makeRenderPayload({
        creative: {
          css: 'body {margin: 0;}@media (max-width: 480px){body{font-size:12px;}}html,body{color:red}:root{--x:1}',
        },
      }),
    );
    expect(css).toContain(
      '.branch-journey-root {margin: 0;}@media (max-width: 480px){.branch-journey-root{font-size:12px;}}.branch-journey-html,.branch-journey-root{color:red}.branch-journey-html{--x:1}',
    );
  });

  it('sets CTA text as text, never markup, picking has_app only when the app is installed', () => {
    const payload = makeRenderPayload({
      cta: { text: { hasApp: 'Open', noApp: '<b>Get</b>' } },
    });
    let { root } = mount(payload, { ...view, hasApp: false });
    const button = root.getElementById('branch-mobile-action');
    expect(button.textContent).toBe('<b>Get</b>');
    expect(button.querySelector('b')).toBeNull();
    expect(button.getAttribute('aria-label')).toBe('<b>Get</b>');
    document.body.innerHTML = '';
    ({ root } = mount(payload, { ...view, hasApp: true }));
    expect(root.getElementById('branch-mobile-action').textContent).toBe(
      'Open',
    );
  });

  it('styles the host only through the CSSOM (no setAttribute("style"))', () => {
    const spy = vi.spyOn(Element.prototype, 'setAttribute');
    mount(makeRenderPayload(), { ...view, hasApp: false });
    expect(spy.mock.calls.some(([name]) => name === 'style')).toBe(false);
    spy.mockRestore();
  });

  it('puts the platform class it is given on the wrapper', () => {
    const { root } = mount(makeRenderPayload(), {
      document,
      platform: 'ios',
      hasApp: false,
    });
    expect(root.querySelector('.branch-banner-ios')).not.toBeNull();
  });

  it("rewrites the creative's rem against the user's default size, not the page root", () => {
    document.documentElement.style.fontSize = '62.5%';
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((el) =>
        el.classList?.contains('branch-journey-root')
          ? { fontSize: '18px', getPropertyValue: () => '' }
          : { fontSize: '10px', getPropertyValue: () => '' },
      );
    try {
      const { root } = mount(
        makeRenderPayload({
          creative: { css: '#branch-banner { padding: 1rem; }' },
          geometry: { css: 'height: 5rem;' },
        }),
        { document, platform: 'android', hasApp: false },
      );
      const css = root.querySelector('style').textContent;
      expect(css).toContain('#branch-banner { padding: 18px; }');
      expect(css).toContain('height: 5rem !important;');
    } finally {
      spy.mockRestore();
      document.documentElement.style.fontSize = '';
    }
  });

  it('leaves no host behind when mounting fails after inserting it', () => {
    const create = document.createElement.bind(document);
    const spy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag) => {
        if (tag === 'style') {
          throw new Error('no styles');
        }
        return create(tag);
      });
    try {
      expect(() =>
        mount(makeRenderPayload(), {
          document,
          platform: 'android',
          hasApp: false,
        }),
      ).toThrow('no styles');
    } finally {
      spy.mockRestore();
    }
    expect(document.getElementById('branch-journey-host')).toBeNull();
  });

  const BARE =
    '<div id="branch-banner"><div class="branch-banner-content"><div id="branch-mobile-action">Get</div></div></div>';

  it('names a creative that has no name of its own', () => {
    const { banner } = mount(makeRenderPayload({ creative: { html: BARE } }), {
      document,
      platform: 'android',
      hasApp: false,
    });
    expect(banner.getAttribute('role')).toBe('region');
    expect(banner.getAttribute('aria-label')).toBe('Branch Banner');
  });

  it("doesn't add a second name when the creative already has a dialog", () => {
    // The fixture body is the builder's WCAG markup: <main role="dialog" aria-label="Branch Banner">.
    const { banner } = mount(makeRenderPayload(), {
      document,
      platform: 'android',
      hasApp: false,
    });
    expect(banner.hasAttribute('role')).toBe(false);
    expect(banner.hasAttribute('aria-label')).toBe(false);
  });

  it("keeps the creative's own label on #branch-banner", () => {
    const html = BARE.replace(
      'id="branch-banner"',
      'id="branch-banner" aria-labelledby="t"',
    );
    const { banner } = mount(makeRenderPayload({ creative: { html } }), {
      document,
      platform: 'android',
      hasApp: false,
    });
    expect(banner.hasAttribute('role')).toBe(false);
    expect(banner.hasAttribute('aria-label')).toBe(false);
  });

  it('reads a transparent background the way browsers serialize it', () => {
    expect(isTransparent('rgba(0, 0, 0, 0)')).toBe(true);
    expect(isTransparent('rgb(0 0 0 / 0)')).toBe(true);
    expect(isTransparent('transparent')).toBe(true);
    expect(isTransparent('rgba(0, 0, 0, 0.5)')).toBe(false);
    expect(isTransparent('rgb(255, 255, 255)')).toBe(false);
    expect(isTransparent('')).toBe(false);
  });

  it("drops the geometry's box-shadow when the content has no background (v1 parity)", () => {
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      fontSize: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      getPropertyValue: () => '',
    }));
    try {
      const shadowed = makeRenderPayload({
        geometry: { css: 'box-shadow: 0 0 5px black; top: 0;' },
      });
      const { banner } = mount(shadowed, { ...view, hasApp: false });
      expect(banner.style.getPropertyValue('box-shadow')).toBe('none');
      expect(banner.style.getPropertyPriority('box-shadow')).toBe('important');
      document.body.innerHTML = '';
      // No geometry shadow: the creative's own box-shadow is never touched.
      const plain = mount(makeRenderPayload(), { ...view, hasApp: false });
      expect(plain.banner.style.getPropertyValue('box-shadow')).toBe('');
    } finally {
      spy.mockRestore();
    }
  });
});
