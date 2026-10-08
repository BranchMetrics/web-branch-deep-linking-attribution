import { parseDimension, toPayload } from '../../../src/journeys/v2/adapter.js';
import { isFullPage } from '../../../src/journeys/v2/renderer/index.js';
import {
  adapterInput,
  SAMPLE_CSS,
  STANDARD_IFRAME_CSS,
  STANDARD_METADATA,
  templateHtml,
} from './fixtures.js';

const branch = { _branchViewData: {} };

describe('journeys/v2 adapter', () => {
  it('adapts the intrinsic sample response', () => {
    const { payload } = toPayload(adapterInput(), branch);
    expect(payload).toMatchObject({
      render: {
        creative: { deviceType: 'mobile', wcag: true },
        placement: {
          sticky: 'fixed',
          anchorY: 'bottom',
          bannerHeight: { value: 100, unit: 'vh' },
          offsetY: { value: 0, unit: 'px' },
          isIntrinsic: true,
          injectorSelector: undefined,
        },
        geometry: { css: '', zIndex: 99999 },
        animation: {
          enterClass: 'branch-banner-enter',
          exitClass: 'branch-banner-exit',
        },
        fonts: [],
        ctaText: { hasApp: 'Open The App', noApp: 'Get The App' },
      },
      view: { id: 'view-1', audienceRuleId: 'rule-1' },
      cta: { callbackString: 'branch_view_callback__1' },
      dismissal: {},
      linkData: {
        banner_id: 'view-1',
        journey_link_data: { type: 'mobile', view_id: 'view-1' },
      },
    });
    // Passed through as served; mapping body onto the shadow root is the renderer's job.
    expect(payload.render.creative.css.trim()).toBe(SAMPLE_CSS);
    expect(payload.render.creative.html).toContain('id="branch-banner"');
    expect(payload.render.creative.html).not.toMatch(
      /<script|<meta|<style|<link/,
    );
    expect(payload.cta.script).toContain('branch_view_callback__1(cta)');
    expect(payload.render.animation.css).toContain('.branch-banner-enter');
    expect(isFullPage(payload.render.placement)).toBe(true);
  });

  it('turns extrinsic iframe css into #branch-banner geometry and a page push', () => {
    const { payload } = toPayload(
      adapterInput({
        html: templateHtml({
          metadata: STANDARD_METADATA,
          iframeCss: STANDARD_IFRAME_CSS,
        }),
      }),
      branch,
    );
    expect(payload.render.geometry).toEqual({
      // No height: the content sizes the banner. No z-index: it travels as zIndex.
      css: 'box-shadow: 0 0 5px rgba(0, 0, 0, .35); position: absolute; left: 0; right: 0; top: 0; min-width: 100%;',
      push: { side: 'top' },
      zIndex: 99999,
    });
    expect(payload.render.placement).toMatchObject({
      sticky: 'absolute',
      anchorY: 'top',
      bannerHeight: { value: 76, unit: 'px' },
      isIntrinsic: false,
      injectorSelector: '.branch-journeys-top',
    });
    expect(isFullPage(payload.render.placement)).toBe(false);
  });

  it('keeps a viewport-filling height (stretch anchoring) and drops fixed ones', () => {
    const geometry = (box) =>
      toPayload(
        adapterInput({
          html: templateHtml({
            metadata: STANDARD_METADATA,
            iframeCss: `#branch-banner-iframe { position: fixed; left: 0; top: 0; ${box} }`,
          }),
        }),
        branch,
      ).payload.render.geometry.css;
    expect(geometry('width: 320px; height: 100vh;')).toBe(
      'position: fixed; left: 0; top: 0; width: 320px; height: 100vh;',
    );
    expect(geometry('width: 320px; height: 50vh;')).toBe(
      'position: fixed; left: 0; top: 0; width: 320px;',
    );
    expect(geometry('height: 240px; width: 320px;')).toBe(
      'position: fixed; left: 0; top: 0; width: 320px;',
    );
  });

  // 100vh is iOS Safari's large viewport, which puts the bottom under the toolbar.
  it('lets top and bottom size a fixed, vertically stretched box', () => {
    const geometry = (box) =>
      toPayload(
        adapterInput({
          html: templateHtml({
            metadata: STANDARD_METADATA,
            iframeCss: `#branch-banner-iframe { ${box} }`,
          }),
        }),
        branch,
      ).payload.render.geometry.css;
    expect(
      geometry(
        'position: fixed; left: 0; right: 0; top: 0; bottom: 0; height: 100vh;',
      ),
    ).toBe(
      'position: fixed; left: 0; right: 0; top: 0; bottom: 0; height: auto;',
    );
    // An absolute box would stretch to a positioned ancestor, maybe the whole page.
    expect(
      geometry(
        'position: absolute; left: 0; top: 0; bottom: 0; height: 100vh;',
      ),
    ).toBe('position: absolute; left: 0; top: 0; bottom: 0; height: 100vh;');
  });

  it('keeps Google Fonts stylesheet links as fonts', () => {
    const roboto =
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
    const { payload } = toPayload(
      adapterInput({ html: templateHtml({ fonts: [roboto] }) }),
      branch,
    );
    expect(payload.render.fonts).toEqual([roboto]);
  });

  it('falls back to v1 for a stylesheet link that is not Google Fonts', () => {
    expect(
      toPayload(
        adapterInput({
          html: templateHtml({ fonts: ['https://use.typekit.net/abc.css'] }),
        }),
        branch,
      ),
    ).toEqual({ fallback: 'unsupported-stylesheet' });
  });

  describe('@import in creative CSS (the documented custom-font method)', () => {
    const SOURCE_SANS =
      'https://fonts.googleapis.com/css?family=Source+Sans+Pro:600,900';
    const RULE =
      "#branch-banner { font-family: 'Source Sans Pro', sans-serif; }";
    const adapt = (css, fonts = []) =>
      toPayload(adapterInput({ html: templateHtml({ css, fonts }) }), branch);

    it('hoists a Google Fonts import with the font links and removes it from the CSS', () => {
      const { payload } = adapt(`@import url('${SOURCE_SANS}');\n${RULE}`);
      expect(payload.render.fonts).toEqual([SOURCE_SANS]);
      expect(payload.render.creative.css).not.toContain('@import');
      expect(payload.render.creative.css).toContain(RULE);
    });

    it('accepts every @import form and lists a font once', () => {
      const jost = 'https://fonts.googleapis.com/css2?family=Jost';
      const css = [
        `@import url("${SOURCE_SANS}");`,
        `@IMPORT url(${jost});`,
        `@import '${SOURCE_SANS}';`,
        '@import "//fonts.googleapis.com/css?family=Satisfy";',
        RULE,
      ].join('\n');
      const { payload } = adapt(css, [jost]);
      expect(payload.render.fonts).toEqual([
        jost,
        SOURCE_SANS,
        '//fonts.googleapis.com/css?family=Satisfy',
      ]);
      expect(payload.render.creative.css).not.toMatch(/@import/i);
    });

    it('leaves imports in comments and strings alone', () => {
      const css = `/* @import url('https://evil.test/x.css'); */\n.x::after { content: "@import url(x.css);"; }`;
      const { payload } = adapt(css);
      expect(payload.render.fonts).toEqual([]);
      expect(payload.render.creative.css.trim()).toBe(css);
    });

    it('falls back to v1 for any other import', () => {
      for (const css of [
        "@import url('https://use.typekit.net/abc.css');",
        "@import url('fonts.css');",
        `@import url('${SOURCE_SANS}') screen and (min-width: 600px);`,
      ]) {
        expect(adapt(css)).toEqual({ fallback: 'unsupported-stylesheet' });
      }
    });

    it('falls back to v1 for @font-face', () => {
      for (const css of [
        "@font-face { font-family: Brand; src: url('brand.woff2'); }",
        "@media (min-width: 1px) { @FONT-FACE { font-family: Brand; src: url('b.woff2'); } }",
      ]) {
        expect(adapt(`${css}\n${RULE}`)).toEqual({ fallback: 'font-face' });
      }
    });

    it('ignores @font-face in comments and strings', () => {
      const css = `/* @font-face { font-family: X; } */\n.x::after { content: "@font-face"; }`;
      expect(adapt(css).payload).toBeDefined();
    });
  });

  it('applies the $journeys_cta override to the CTA script', () => {
    const { payload } = toPayload(adapterInput(), {
      _branchViewData: { data: { $journeys_cta: 'https://custom.test' } },
    });
    expect(payload.cta.script).toContain('validate("https://custom.test")');
  });

  it('maps desktop overlay link data and dismissal metadata', () => {
    const { payload } = toPayload(
      adapterInput({
        journeyLinkData: { type: 'desktop', variant: 'overlay' },
        html: templateHtml({
          metadata: {
            ...STANDARD_METADATA,
            globalDismissPeriod: 3600,
            dismissRedirect: 'https://shop.test',
          },
          iframeCss: STANDARD_IFRAME_CSS,
        }),
      }),
      branch,
    );
    expect(payload.render.creative).toMatchObject({
      deviceType: 'desktop',
      variant: 'overlay',
    });
    expect(payload.dismissal).toEqual({
      globalPeriodSeconds: 3600,
      redirectUrl: 'https://shop.test',
    });
  });

  it.each([
    ['no-metadata', { html: templateHtml({ metadata: null }) }],
    [
      'bad-banner-height',
      {
        html: templateHtml({
          metadata: { ...STANDARD_METADATA, bannerHeight: 'auto' },
        }),
      },
    ],
    [
      'bad-placement',
      {
        html: templateHtml({
          metadata: { ...STANDARD_METADATA, sticky: 'sticky' },
        }),
      },
    ],
    [
      'bad-placement',
      {
        html: templateHtml({
          metadata: { ...STANDARD_METADATA, position: 'center' },
        }),
      },
    ],
    [
      'no-branch-banner',
      {
        html: templateHtml({
          body: '<div class="branch-banner-content"></div>',
        }),
      },
    ],
    ['no-cta-script', { html: templateHtml({ script: null }) }],
    ['no-cta-callback', { requestData: {} }],
    [
      'unknown-iframe-css',
      {
        html: templateHtml({
          metadata: STANDARD_METADATA,
          iframeCss: '.other { top: 0; }',
        }),
      },
    ],
    [
      'unknown-iframe-css',
      {
        html: templateHtml({
          metadata: STANDARD_METADATA,
          iframeCss: `${STANDARD_IFRAME_CSS}\n#branch-banner-iframe { top: 1px; }`,
        }),
      },
    ],
    ['adapter-error', { html: null }],
  ])('falls back to v1 with %s', (reason, overrides) => {
    expect(toPayload(adapterInput(overrides), branch)).toEqual({
      fallback: reason,
    });
  });

  it('parseDimension accepts CSS lengths and unitless zero only', () => {
    expect(parseDimension('76px')).toEqual({ value: 76, unit: 'px' });
    expect(parseDimension('50.5vh')).toEqual({ value: 50.5, unit: 'vh' });
    expect(parseDimension('100svh')).toEqual({ value: 100, unit: 'svh' });
    expect(parseDimension('0')).toEqual({ value: 0, unit: 'px' });
    expect(parseDimension('76')).toBeNull();
    expect(parseDimension('auto')).toBeNull();
    expect(parseDimension(undefined)).toBeNull();
  });
});
