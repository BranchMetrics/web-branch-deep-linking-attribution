import { userEvent } from 'vitest/browser';
import { render } from '../../src/journeys/v2/renderer/index.js';
import { makeRenderPayload } from '../journeys/v2/fixtures.js';

const TOP = {
  creative: {
    html: '<div id="branch-banner"><div class="branch-banner-content"><div id="branch-mobile-action">Get</div></div></div>',
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
    css: 'position: absolute; left: 0; right: 0; top: 0; min-width: 100%;',
    zIndex: 99999,
    push: { side: 'top' },
  },
};

const SLIDE = {
  css:
    '@keyframes t-in { from { opacity: 0; } to { opacity: 1; } }' +
    '@keyframes t-out { from { opacity: 1; } to { opacity: 0; } }' +
    '.branch-banner-enter { animation: t-in 0.1s linear both; }' +
    '.branch-banner-exit { animation: t-out 0.1s linear both; }',
};

const RICH = {
  ...TOP,
  creative: {
    ...TOP.creative,
    html:
      '<div id="branch-banner"><div class="branch-banner-content">' +
      '<h1 id="t">Title</h1><p id="d">Desc <a id="l" href="#">link</a></p>' +
      '<ul id="u"><li id="li">one</li></ul>' +
      '<img id="i" width="40" height="40" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">' +
      '<button id="b">Go</button><input id="in">' +
      '<div id="branch-mobile-action">Get</div></div></div>',
    css: '#branch-banner { background: #eee; }',
  },
};

const TAILWIND_PREFLIGHT =
  '*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}' +
  'html{line-height:1.5;-webkit-text-size-adjust:100%;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif}' +
  'body{margin:0;line-height:inherit}' +
  'h1,h2,h3{font-size:inherit;font-weight:inherit;margin:0}p{margin:0}ul{list-style:none;margin:0;padding:0}' +
  'a{color:inherit;text-decoration:inherit}' +
  'button,input{font-family:inherit;font-size:100%;line-height:inherit;color:inherit;margin:0;padding:0}' +
  'button{background-color:transparent;background-image:none}' +
  'img,svg,video{display:block;vertical-align:middle;max-width:100%;height:auto}';

const BOOTSTRAP_REBOOT =
  ':root{--bs-body-font-size:1rem;color-scheme:dark}' +
  '*,::after,::before{box-sizing:border-box}' +
  'body{margin:0;font-family:system-ui;font-size:1rem;font-weight:400;line-height:1.5;color:#212529;background-color:#fff;-webkit-text-size-adjust:100%}' +
  'h1{margin-top:0;margin-bottom:.5rem;font-weight:500;line-height:1.2;font-size:2.5rem}' +
  'p{margin-top:0;margin-bottom:1rem}a{color:#0d6efd;text-decoration:underline}' +
  'img,svg{vertical-align:middle}button{border-radius:0;text-transform:none}';

const CREATIVE_PROPS = [
  'display',
  'box-sizing',
  'margin-top',
  'padding-left',
  'border-top-width',
  'border-top-style',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'text-decoration-line',
  'list-style-type',
  'max-width',
  'vertical-align',
  'width',
  'height',
  'color-scheme',
];

let styles = [];
let journey = null;

function setPage(css, html) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  styles.push(style);
  if (html !== undefined) {
    document.body.innerHTML = html;
  }
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

const close = () => new Promise((resolve) => journey.close(resolve));
const shadow = () => document.getElementById('branch-journey-host').shadowRoot;
const marginTop = () => getComputedStyle(document.body).marginTop;

function creativeStyles() {
  return Array.from(shadow().querySelectorAll('[id]')).map((el) => {
    const style = getComputedStyle(el);
    return [
      el.id,
      ...CREATIVE_PROPS.map((p) => `${p}=${style.getPropertyValue(p)}`),
    ];
  });
}

describe('journeys/v2 renderer isolation from the host page', () => {
  afterEach(() => {
    journey?.discard();
    journey = null;
    for (const style of styles) {
      style.remove();
    }
    styles = [];
    document.body.innerHTML = '';
    document.body.className = '';
    document.body.removeAttribute('style');
    window.scrollTo(0, 0);
  });

  it("keeps the creative's styles off the page, even universal and !important ones", async () => {
    setPage('', '<p id="p">page</p><div id="d">div</div>');
    const props = [
      'display',
      'color',
      'margin-left',
      'overflow',
      'transform',
      'font-family',
      'background-color',
    ];
    const pageStyles = () =>
      [document.documentElement, document.body, ...document.body.children]
        .filter((el) => el.id !== 'branch-journey-host')
        .map((el) => {
          const style = getComputedStyle(el);
          return [el.tagName, ...props.map((p) => style.getPropertyValue(p))];
        });
    const before = pageStyles();
    await show(
      makeRenderPayload({
        ...TOP,
        creative: {
          ...TOP.creative,
          css:
            `${TOP.creative.css} * { display: none !important; color: red !important; }` +
            ' html, body, :root { margin: 99px !important; overflow: hidden !important; background: red !important; font-family: monospace !important; }' +
            ' :host { position: fixed; inset: 0; transform: scale(0); }' +
            ' div, p { transform: scale(0) !important; }' +
            ' @property --branch-test { syntax: "<color>"; inherits: true; initial-value: red; }',
        },
      }),
    );
    expect(pageStyles()).toEqual(before);
  });

  for (const [name, css] of [
    ['tailwind', TAILWIND_PREFLIGHT],
    ['bootstrap', BOOTSTRAP_REBOOT],
  ]) {
    it(`looks the same under ${name}'s reset as on a blank page`, async () => {
      await show(makeRenderPayload(RICH));
      const blank = creativeStyles();
      journey.discard();
      setPage(css);
      await show(makeRenderPayload(RICH));
      expect(creativeStyles()).toEqual(blank);
    });
  }

  it('runs its own keyframes when the page declares keyframes of the same name', async () => {
    setPage(
      '@keyframes t-in { from { opacity: 0.3; } to { opacity: 0.3; } }',
      '<p>page</p>',
    );
    await show(makeRenderPayload({ ...TOP, animation: SLIDE }));
    await expect
      .poll(
        () =>
          getComputedStyle(shadow().getElementById('branch-banner')).opacity,
        { timeout: 2000 },
      )
      .toBe('1');
  });

  it('pushes the page past a class margin on body (Tailwind m-0, WordPress body.home)', async () => {
    setPage('.m-0 { margin: 0; } body.home { margin-top: 0; }', '<p>page</p>');
    document.body.className = 'home m-0';
    await show(makeRenderPayload(TOP));
    await expect.poll(marginTop, { timeout: 2000 }).toBe('76px');
  });

  it('keeps the push when CSS-in-JS injects a body rule after the journey shows', async () => {
    setPage('', '<p>page</p>');
    await show(makeRenderPayload(TOP));
    setPage('body { margin: 0; }');
    await expect.poll(marginTop, { timeout: 2000 }).toBe('76px');
  });

  it('locks scroll on a page that sets overflow-y: scroll on html', async () => {
    setPage(
      'html { overflow-y: scroll; } main { height: 3000px; }',
      '<main>m</main>',
    );
    await show(makeRenderPayload());
    // overflow: hidden stops the user scrolling, not scrollTo().
    await userEvent.wheel(document.querySelector('main'), {
      delta: { y: 500 },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(window.scrollY).toBe(0);
  });

  it("keeps the page's own scroll lock and body margin once it closes", async () => {
    setPage('main { height: 3000px; }', '<main>m</main>');
    document.body.style.overflow = 'hidden';
    // Full-page and fixed, so it locks scroll; and it pushes.
    await show(makeRenderPayload({ geometry: { push: { side: 'top' } } }));
    document.body.style.marginTop = '10px';
    await close();
    expect(getComputedStyle(document.body).overflow).toBe('hidden');
    await expect.poll(marginTop, { timeout: 2000 }).toBe('10px');
  });

  it('leaves the page as it found it after repeated shows and a discard mid-entrance', async () => {
    setPage('main { height: 3000px; }', '<main>m</main>');
    const pageState = () => ({
      head: document.head.innerHTML,
      body: document.body.innerHTML,
      bodyAttrs: [document.body.className, document.body.getAttribute('style')],
      htmlAttrs: [
        document.documentElement.className,
        document.documentElement.getAttribute('style'),
      ],
      overflow: [
        getComputedStyle(document.body).overflow,
        getComputedStyle(document.documentElement).overflow,
      ],
      marginTop: marginTop(),
    });
    const before = pageState();
    for (const payload of [
      makeRenderPayload({ ...TOP, animation: SLIDE }),
      // Full-page and fixed, so it also locks scroll.
      makeRenderPayload(),
      makeRenderPayload({ ...TOP, animation: SLIDE }),
    ]) {
      await show(payload);
      await close();
    }
    render(makeRenderPayload({ ...TOP, animation: SLIDE }), {
      platform: 'android',
      hasApp: false,
      onAction() {},
    }).discard();
    await expect
      .poll(() => pageState().marginTop, { timeout: 2000 })
      .toBe(before.marginTop);
    expect(pageState()).toEqual(before);
  });
});
