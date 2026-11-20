import { branch_view } from '../../../src/journeys/branch-view.js';
import { journeys_utils } from '../../../src/journeys/journeys-utils.js';
import { resetV2ForTests } from '../../../src/journeys/v2/index.js';
import { cleanCreativeHtml } from '../../../src/journeys/v2/renderer/sanitize.js';
import { UA, useFakeEnv } from '../../helpers/fake-env.js';
import { makeBranch } from './fixtures.js';

// Copies of audience-rule-service's journey-payload fixtures, whose tests assert the
// server still produces them. Here the SDK must accept their shape and render them, so a
// change on either side fails a test. Refresh by copying the directory again.

const DIR = './fixtures/server-payload/';
const PAYLOADS = import.meta.glob(
  './fixtures/server-payload/*.render-payload.json',
  {
    import: 'default',
    eager: true,
  },
);
const JSON_SUFFIX = '.render-payload.json';
const fixtures = Object.entries(PAYLOADS).map(([path, json]) => ({
  name: path.slice(DIR.length, -JSON_SUFFIX.length),
  json,
}));

const oneOf = (...values) =>
  expect.stringMatching(new RegExp(`^(${values.join('|')})$`));
const DIMENSION = {
  value: expect.any(Number),
  unit: oneOf('px', '%', 'vh', 'svh', 'dvh', 'vw', 'svw', 'em', 'rem'),
};

// Exact keys: a field the SDK doesn't know about fails too.
function expectShape(name, json) {
  const { render, dismissal } = json;
  expect(Object.keys(json).sort(), `${name}: top-level keys`).toEqual([
    'dismissal',
    'render',
    'version',
  ]);
  expect(json.version, `${name}: version`).toBe(1);
  const { creative, box, page } = render;
  expect(render, `${name}: render`).toEqual({
    creative: {
      deviceType: oneOf('mobile', 'desktop'),
      html: expect.any(String),
      css: expect.any(String),
    },
    box: { style: expect.any(Object) },
    page: {
      ...(page.push !== undefined && {
        push: {
          side: oneOf('top', 'bottom'),
          ...(page.push.offset !== undefined && { offset: DIMENSION }),
        },
      }),
      lockScroll: expect.any(Boolean),
      shiftTopElements: expect.any(Boolean),
    },
    presentation: {
      fullPage: expect.any(Boolean),
      modal: expect.any(Boolean),
    },
    animation: {
      enterClass: expect.any(String),
      exitClass: expect.any(String),
      css: expect.any(String),
    },
    fonts: render.fonts.map(() => ({
      family: expect.any(String),
      url: expect.stringMatching(/^https:\/\/fonts\.googleapis\.com\//),
    })),
    ctaText: { hasApp: expect.any(String), noApp: expect.any(String) },
    showEvent: {
      position: oneOf('top', 'bottom'),
      sticky: oneOf('absolute', 'fixed'),
    },
  });
  // mount.ts writes each entry as a declaration, so none may break out of it.
  for (const [property, value] of Object.entries(box.style)) {
    expect(property, `${name}: box.style property`).toMatch(/^-?[a-z][a-z-]*$/);
    expect(value, `${name}: box.style.${property}`).toMatch(/^[^;{}!]+$/);
  }
  // An intrinsic creative keeps its placement rule in creative.css, as in v1; otherwise
  // the server supplies it in box.style.
  const creativePlaces = /#branch-banner\s*\{[^}]*position\s*:/.test(
    creative.css,
  );
  const boxEmpty = Object.keys(box.style).length === 0;
  expect(
    boxEmpty,
    `${name}: box.style is empty iff creative.css has the #branch-banner position rule`,
  ).toBe(creativePlaces);
  if (!boxEmpty) {
    expect(box.style, `${name}: box.style has position`).toHaveProperty(
      'position',
    );
  }
  // The server strips these; the SDK's mount-time clean is only defense in depth.
  const template = document.createElement('template');
  template.innerHTML = creative.html;
  expect(
    template.content.querySelectorAll('script, style, meta, link').length,
    `${name}: creative.html has no script, style, meta or link elements`,
  ).toBe(0);
  expect(dismissal, `${name}: dismissal`).toEqual({
    ...(dismissal.globalPeriodSeconds !== undefined && {
      globalPeriodSeconds: expect.any(Number),
    }),
    ...(dismissal.redirectUrl !== undefined && {
      redirectUrl: expect.stringMatching(/^https?:\/\//),
    }),
  });
}

describe('server payload fixtures: the contract', () => {
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
  });

  it('has at least one fixture', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  function show(name, json, hasApp) {
    const callback = 'branch_view_callback__1';
    const script = `if (typeof ${callback} === 'function') { ${callback}(function () {}); }`;
    const notShown = vi.fn();
    branch_view.showJourneyFromResponse(
      {
        event_data: { branch_view_data: { id: name } },
        use_v2_renderer: true,
        banner_payload: { ...json, cta: { script } },
        template: '<html></html>',
        journey_link_data: { type: json.render.creative.deviceType },
      },
      {
        callback_string: callback,
        has_app_websdk: hasApp,
        banner_payload: 1,
      },
      {},
      notShown,
    );
    expect(notShown).not.toHaveBeenCalled();
    return document.getElementById('branch-journey-host')?.shadowRoot;
  }

  it('shows the has-app CTA text only when the request says the app is installed', () => {
    const { json } = fixtures.find((f) => f.name === 'standard-default');
    const cta = (root) => root.getElementById('branch-mobile-action');

    let root = show('standard-default', json, false);
    expect(cta(root).textContent).toBe(json.render.ctaText.noApp);
    expect(cta(root).getAttribute('aria-label')).toBe(
      json.render.ctaText.noApp,
    );
    resetV2ForTests();
    document.body.innerHTML = '';

    root = show('standard-default', json, true);
    expect(cta(root).textContent).toBe(json.render.ctaText.hasApp);
  });

  it("applies the server's fonts, push offset and dismissal settings", () => {
    const { json } = fixtures.find((f) => f.name === 'campaign-settings');
    const { fonts, page } = json.render;
    const root = show('campaign-settings', json, false);

    expect(
      document.head.querySelector(`link[href="${fonts[0].url}"]`),
    ).not.toBeNull();
    const offset = `${page.push.offset.value}${page.push.offset.unit}`;
    expect(
      document.getElementById('branch-journey-page').textContent,
    ).toContain(`+ ${offset})`);

    const branch = journeys_utils.branch;
    branch._api.mockImplementation((_resource, _data, cb) => cb(null, {}));
    const originalLocation = window.location;
    try {
      vi.advanceTimersByTime(20);
      root.querySelector('.branch-banner-close').click();
      vi.advanceTimersByTime(20);
      expect(
        Number(branch._storage.get('globalJourneysDismiss', true)),
      ).toBeGreaterThan(
        Date.now() + (json.dismissal.globalPeriodSeconds - 60) * 1000,
      );
      expect(branch._api).toHaveBeenCalledTimes(1);
      expect(String(window.location)).toBe(json.dismissal.redirectUrl);
    } finally {
      window.location = originalLocation;
    }
  });

  for (const { name, json } of fixtures) {
    it(`${name}: has the shape the SDK reads`, () => {
      expectShape(name, json);
    });

    it(`${name}: the mount-time clean leaves its html unchanged`, () => {
      const { html } = json.render.creative;
      const parsed = document.createElement('div');
      parsed.innerHTML = html;
      const cleaned = document.createElement('div');
      cleaned.appendChild(cleanCreativeHtml(document, html));
      expect(cleaned.innerHTML).toBe(parsed.innerHTML);
    });

    it(`${name}: the SDK shows it with v2`, () => {
      const root = show(name, json, false);
      expect(
        root?.getElementById('branch-banner'),
        `${name}: #branch-banner in the shadow root`,
      ).toBeTruthy();
      expect(
        document.getElementById('branch-banner-iframe'),
        `${name}: rendered with v2, not the v1 fallback`,
      ).toBeNull();
    });
  }
});
