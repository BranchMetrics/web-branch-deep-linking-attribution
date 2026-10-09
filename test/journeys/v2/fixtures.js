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

export const STANDARD_METADATA = {
  bannerHeight: '76px',
  position: 'top',
  sticky: 'absolute',
  offsetY: '0',
  isIntrinsic: false,
  injectorSelector: '.branch-journeys-top',
  ctaText: { has_app: 'Open', no_app: 'Get' },
};

export const STANDARD_IFRAME_CSS =
  'body { -webkit-transition: all 0.25s ease; transition: 0.25s; margin-top: 76px; }\n#branch-banner-iframe { box-shadow: 0 0 5px rgba(0, 0, 0, .35); border: 0; z-index: 99999; position: absolute; left: 0; right: 0; top: 0; min-width: 100%; height:76px; }';

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

export function adapterInput(overrides = {}) {
  return {
    html: templateHtml(),
    requestData: {
      callback_string: 'branch_view_callback__1',
      has_app_websdk: false,
    },
    templateId: 'view-1',
    branchViewData: { audience_rule_id: 'rule-1' },
    journeyLinkData: {
      type: 'mobile',
      view_id: 'view-1',
      browser_fingerprint_id: 'bfp',
    },
    animationConfig: SAMPLE_ANIMATION,
    ...overrides,
  };
}

/** A complete JourneyPayload with no animation. Override keys match the old flat shape:
 * creative, placement, geometry, animation, fonts, cta ({ text, script, callbackString }),
 * view, dismissal, linkData. */
export function makePayload(overrides = {}) {
  const o = overrides;
  return {
    render: {
      creative: {
        deviceType: 'mobile',
        html: SAMPLE_BODY.replace(
          '<meta name="accessibility" content="wcag">',
          '',
        ),
        css: '#branch-banner { position: fixed; left: 0; right: 0; bottom: 0; }',
        wcag: true,
        ...o.creative,
      },
      placement: {
        sticky: 'fixed',
        anchorY: 'bottom',
        bannerHeight: { value: 100, unit: 'vh' },
        offsetY: { value: 0, unit: 'px' },
        isIntrinsic: true,
        ...o.placement,
      },
      geometry: { css: '', zIndex: 99999, ...o.geometry },
      animation: {
        enterClass: 'branch-banner-enter',
        exitClass: 'branch-banner-exit',
        css: '',
        ...o.animation,
      },
      fonts: o.fonts || [],
      ctaText: {
        hasApp: 'Open The App',
        noApp: 'Get The App',
        ...o.cta?.text,
      },
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

export function makeRenderPayload(overrides = {}) {
  return makePayload(overrides).render;
}
