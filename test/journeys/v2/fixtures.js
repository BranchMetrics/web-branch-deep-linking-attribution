import { init_states } from '../../../src/branch/wrap.js';
import { createContext } from '../../../src/core/context.js';
import { storage as storageModule } from '../../../src/core/storage.js';

/** The Branch members v2 touches, with fresh local storage. */
export function makeBranch(overrides = {}) {
  localStorage.clear();
  return {
    init_state: init_states.INIT_SUCCEEDED,
    init_options: {},
    _ctx: createContext(),
    _storage: new storageModule.BranchStorage(['local']),
    _publishEvent: vi.fn(),
    _api: vi.fn(),
    _branchViewData: {},
    _referringLink: vi.fn().mockReturnValue(null),
    _queue: (fn) => fn(() => {}),
    renderQueue: (fn) => fn(),
    ...overrides,
  };
}

export const SAMPLE_METADATA = {
  bannerHeight: '100vh',
  position: 'bottom',
  sticky: 'fixed',
  offsetY: '0',
  isIntrinsic: true,
  injectorSelector: '',
  ctaText: { has_app: 'Open The App', no_app: 'Get The App' },
};

export const SAMPLE_CSS =
  '* { box-sizing: border-box; } body {margin: 0;}#branch-banner-dismiss-background{top:0;left:0;width:100vw;height:100vh;position:fixed;}#branch-banner{overflow:hidden;}\n#branch-banner {\n    position: fixed;\n    left: 0; right: 0;\n    bottom: 0;\n}';

export const SAMPLE_IFRAME_CSS =
  '\n#branch-banner-iframe {\n    border: 0;\n    z-index: 99999;\n    position: fixed;\n    left: 0; right: 0;\n    min-width: 100%;\n    top: 0; bottom: 0;\n    height: 100vh;\n}\n';

export const SAMPLE_BODY =
  '<div id="branch-banner-dismiss-background" class="branch-banner-dismiss-background"></div>' +
  '<div id="branch-banner" tabindex="-1" class="branch-animation">' +
  '<main tabindex="-1" role="dialog" aria-label="Branch Banner" class="branch-banner-content">' +
  '<div role="button" tabindex="0" aria-label="Close banner" id="branch-banner-close1" class="branch-banner-close">x</div>' +
  '<div id="branch-mobile-action" role="button" tabindex="0" aria-label="Get The App" class="branch-banner-button">Get The App</div>' +
  '</main></div>' +
  '<meta name="accessibility" content="wcag">';

export const SAMPLE_SCRIPT =
  '(function(root) {\nvar cta = function() {\n\t// immediate_window\n\twindow.top.location = validate("https://example.app.link/abc?_t=1");\n};\n// callback_set\nif (typeof branch_view_callback__1 === \'function\') {\n\tbranch_view_callback__1(cta);\n}\n})(window);';

export const SAMPLE_ANIMATION = {
  classes: { enter: 'branch-banner-enter', exit: 'branch-banner-exit' },
  generatedCss:
    '.branch-banner-enter { animation: branch-slide-in-bottom 0.25s ease both; }',
  surface: 'CONTENT',
  type: 'SLIDE',
};

export function templateHtml({
  metadata = SAMPLE_METADATA,
  css = SAMPLE_CSS,
  iframeCss = SAMPLE_IFRAME_CSS,
  body = SAMPLE_BODY,
  script = SAMPLE_SCRIPT,
  fonts = [],
} = {}) {
  const links = fonts
    .map((href) => `<link rel="stylesheet" href="${href}">`)
    .join('\n');
  const scriptTag =
    script === null ? '' : `<script type="text/javascript">${script}</script>`;
  const metadataTag =
    metadata === null
      ? ''
      : `<script type="application/json">\n${JSON.stringify(metadata)}\n</script>`;
  return `<html>\n<head>\n${links}\n<style type="text/css" id="branch-css">\n${css}\n</style>\n<style type="text/css" id="branch-iframe-css">\n${iframeCss}\n</style>\n</head>\n<body>\n${body}\n${scriptTag}${metadataTag}\n</body>\n</html>`;
}

/** A complete JourneyPayload with no animation: an intrinsic full-page bottom creative.
 * Override keys: creative, box, page, presentation, showEvent, animation, fonts, ctaText,
 * cta ({ script, callbackString }), view, dismissal, linkData. presentation.modal
 * defaults to the server's rule. */
export function makePayload(overrides = {}) {
  const o = overrides;
  const creative = {
    deviceType: 'mobile',
    html: SAMPLE_BODY.replace('<meta name="accessibility" content="wcag">', ''),
    css: '',
    ...o.creative,
  };
  const fullPage = o.presentation?.fullPage ?? true;
  return {
    render: {
      creative,
      box: {
        style: { position: 'fixed', left: '0', right: '0', bottom: '0' },
        ...o.box,
      },
      page: { lockScroll: true, shiftTopElements: false, ...o.page },
      presentation: {
        fullPage,
        modal: serverModal(creative, fullPage),
        ...o.presentation,
      },
      animation: {
        enterClass: 'branch-banner-enter',
        exitClass: 'branch-banner-exit',
        css: '',
        ...o.animation,
      },
      fonts: o.fonts || [],
      ctaText: { hasApp: 'Open', noApp: 'Get', ...o.ctaText },
      showEvent: { position: 'bottom', sticky: 'fixed', ...o.showEvent },
    },
    view: { id: 'view-1', audienceRuleId: 'rule-1', ...o.view },
    cta: {
      script: o.cta?.script ?? 'void 0;',
      callbackString: o.cta?.callbackString ?? 'branch_view_callback__1',
    },
    dismissal: { ...o.dismissal },
    linkData: o.linkData || {
      banner_id: 'view-1',
      journey_link_data: { type: 'mobile', view_id: 'view-1' },
    },
  };
}

export function serverModal(creative, fullPage) {
  return (
    creative.deviceType === 'desktop' ||
    fullPage ||
    /class="[^"]*\bbranch-banner-dismiss-background\b/.test(creative.html)
  );
}

export function makeRenderPayload(overrides = {}) {
  return makePayload(overrides).render;
}

const WCAG_META = '<meta name="accessibility" content="wcag">';

/** banner_payload for templateHtml() with SAMPLE_ANIMATION: what the server sends for
 * the same creative. */
export function sampleServerPayload() {
  return {
    version: 1,
    render: {
      creative: {
        deviceType: 'mobile',
        html: SAMPLE_BODY.replace(WCAG_META, ''),
        css: `\n${SAMPLE_CSS}\n`,
      },
      // Intrinsic: the placement rule stays in creative.css.
      box: { style: {} },
      page: { lockScroll: true, shiftTopElements: false },
      presentation: { fullPage: true, modal: true },
      animation: {
        enterClass: 'branch-banner-enter',
        exitClass: 'branch-banner-exit',
        css: SAMPLE_ANIMATION.generatedCss,
      },
      fonts: [],
      ctaText: { hasApp: 'Open The App', noApp: 'Get The App' },
      showEvent: { position: 'bottom', sticky: 'fixed' },
    },
    dismissal: {},
    cta: { script: SAMPLE_SCRIPT },
  };
}

/** sampleServerPayload() as the SDK completes it for a pageview response. */
export function sampleJourneyPayload() {
  const { render, dismissal, cta } = sampleServerPayload();
  return {
    render,
    dismissal,
    cta: { script: cta.script, callbackString: 'branch_view_callback__1' },
    view: { id: 'view-1', audienceRuleId: 'rule-1' },
    linkData: {
      banner_id: 'view-1',
      journey_link_data: { type: 'mobile', view_id: 'view-1' },
    },
  };
}
