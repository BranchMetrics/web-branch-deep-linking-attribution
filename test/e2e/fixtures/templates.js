// One template per layout family, as the pageview server sends them. The SDK only finds
// <style> blocks with type before id.

export const CTA_URL = 'https://example.app.link/e2e';
const ICON = 'https://cdn.branch.io/e2e/icon.png';

function template({ css, iframeCss, body, metadata }) {
  return (callback) =>
    [
      '<html>',
      ' <head>',
      `  <style type="text/css" id="branch-css">* { box-sizing: border-box; } body {margin: 0;}${css}</style>`,
      `  <style type="text/css" id="branch-iframe-css">${iframeCss}</style>`,
      ' </head>',
      ' <body>',
      body,
      '<script type="text/javascript">',
      'function validate(url) { return url; }',
      `(function(root) { var cta = function() { window.top.location = validate("${CTA_URL}"); };`,
      `if (typeof ${callback} === 'function') { ${callback}(cta); } })(window);`,
      '</script>',
      `<script type="application/json">${JSON.stringify(metadata)}</script>`,
      ' </body>',
      '</html>',
    ].join('\n');
}

const FONT = 'font-family:system-ui;';

// animationConfig as the backend generates it.
function animation(surface, enter, exit) {
  return {
    surface,
    type: enter.name.includes('fade') ? 'FADE_IN' : 'SLIDE',
    classes: { enter: 'branch-banner-enter', exit: 'branch-banner-exit' },
    generatedCss: [
      `.branch-banner-enter { animation: ${enter.name} 0.25s ease both; }`,
      `@keyframes ${enter.name} { ${enter.frames} }`,
      `.branch-banner-exit { animation: ${exit.name} 0.25s ease both; }`,
      `@keyframes ${exit.name} { ${exit.frames} }`,
    ].join('\n'),
  };
}

function slide(surface, edge, offscreen, centering = '') {
  const resting = centering || 'translate(0)';
  const away = `${centering} ${offscreen}`.trim();
  return animation(
    surface,
    {
      name: `branch-slide-in-${edge}`,
      frames: `from { transform: ${away}; } to { transform: ${resting}; }`,
    },
    {
      name: `branch-slide-out-${edge}`,
      frames: `from { transform: ${resting}; } to { transform: ${away}; }`,
    },
  );
}

const FADE = animation(
  'CONTENT',
  {
    name: 'branch-journey-fade-in',
    frames: 'from { opacity: 0; } to { opacity: 1; }',
  },
  {
    name: 'branch-journey-fade-out',
    frames: 'from { opacity: 1; } to { opacity: 0; }',
  },
);

export const TEMPLATES = {
  'top-banner': {
    device: 'mobile',
    animation: slide('IFRAME', 'top', 'translateY(-100%)'),
    html: template({
      css:
        `#i1{display:flex;align-items:center;height:76px;padding:0 12px;background-color:#F4EDFD;box-shadow:0 1px 3px rgba(0,0,0,0.2);}` +
        `#i2{width:48px;height:48px;border-radius:10px;}` +
        `#i3{flex:1;margin:0 10px;${FONT}}#i4{margin:0;font-size:15px;font-weight:600;color:#27272A;}#i5{margin:2px 0 0;font-size:12px;color:#580DB5;}` +
        `#branch-mobile-action{color:#FAFAFA;height:30px;display:flex;align-items:center;padding:0 16px;border-radius:999px;background-color:#580DB5;font-size:13px;${FONT}}` +
        `.branch-banner-close{width:20px;height:20px;margin-right:8px;color:#71717A;font-size:16px;line-height:20px;text-align:center;${FONT}}`,
      iframeCss:
        'body { transition: 0.25s; margin-top: 76px; } #branch-banner-iframe { border: 0; z-index: 99999; position: fixed; left: 0; right: 0; top: 0; min-width: 100%; height: calc(76px + 3px); }',
      body:
        '<div id="branch-banner"><div id="i1" class="branch-banner-content">' +
        '<div class="branch-banner-close" role="button" tabindex="0" aria-label="Close">&#x2715;</div>' +
        `<img id="i2" src="${ICON}" alt="">` +
        '<div id="i3"><p id="i4">Shop App</p><p id="i5">Faster checkout in the app</p></div>' +
        '<div id="branch-mobile-action" class="branch-banner-button" role="button" tabindex="0">Get</div>' +
        '</div></div>',
      metadata: {
        bannerHeight: '76px',
        position: 'top',
        sticky: 'fixed',
        offsetY: '0',
        isIntrinsic: false,
        injectorSelector: '.branch-journeys-top',
        ctaText: { has_app: 'Open', no_app: 'Get' },
      },
    }),
  },

  'floating-button': {
    device: 'mobile',
    // The backend's centering value is a whole declaration, which makes these keyframes
    // invalid, so centered buttons don't slide in production.
    animation: slide(
      'IFRAME',
      'bottom',
      'translateY(calc(100% + 24px))',
      'translate: -50% 0;',
    ),
    // v1 clips the shadow at the iframe's edge; v2 draws all of it (~4.5%).
    allowedDiff: 0.06,
    html: template({
      css:
        `#i1{display:flex;align-items:center;justify-content:center;height:50px;border-radius:999px;background-color:#580DB5;box-shadow:0 4px 10px rgba(0,0,0,0.25);}` +
        `#branch-mobile-action{color:#FAFAFA;font-size:15px;font-weight:500;${FONT}}`,
      iframeCss:
        '#branch-banner-iframe { border: 0; z-index: 99999; position: fixed; left: 50%; bottom: 24px; translate: -50% 0; width: 220px; height: 50px; }',
      body:
        '<div id="branch-banner"><div id="i1" class="branch-banner-content">' +
        '<div id="branch-mobile-action" class="branch-banner-button" role="button" tabindex="0">Get the App</div>' +
        '</div></div>',
      metadata: {
        bannerHeight: '50px',
        position: 'bottom',
        sticky: 'fixed',
        offsetY: '24px',
        isIntrinsic: false,
        injectorSelector: '',
        ctaText: { has_app: 'Open the App', no_app: 'Get the App' },
      },
    }),
  },

  'center-modal': {
    device: 'mobile',
    animation: FADE,
    html: template({
      css:
        '#branch-banner-dismiss-background{top:0;left:0;width:100vw;height:100vh;position:fixed;background-color:rgba(0, 0, 0, 0.2);}' +
        '#branch-banner{position:fixed;left:50%;top:50%;transform:translate(-50%, -50%);}' +
        `#i1{position:relative;width:300px;padding:28px 20px 20px;border-radius:8px;background-color:#E9D9FC;box-shadow:0 4px 10px rgba(0,0,0,0.2);text-align:center;${FONT}}` +
        '#i2{display:block;margin:0 auto;width:64px;height:64px;border-radius:14px;}#i3{margin:12px 0 4px;font-size:20px;font-weight:500;color:#27272A;}#i4{margin:0 0 16px;font-size:15px;color:#580DB5;}' +
        `#branch-mobile-action{display:inline-flex;align-items:center;height:32px;padding:0 18px;border-radius:999px;background-color:#580DB5;color:#FAFAFA;font-size:13px;}` +
        '.branch-banner-close{position:absolute;top:10px;right:12px;font-size:16px;color:#27272A;}',
      iframeCss:
        '#branch-banner-iframe { border: 0; z-index: 99999; position: fixed; left: 0; right: 0; min-width: 100%; top: 0; bottom: 0; height: 100vh; }',
      body:
        '<div id="branch-banner-dismiss-background" class="branch-banner-dismiss-background"></div>' +
        '<div id="branch-banner"><main id="i1" class="branch-banner-content" role="dialog" aria-label="Get the app" tabindex="-1">' +
        '<div class="branch-banner-close" role="button" tabindex="0" aria-label="Close">&#x2715;</div>' +
        `<img id="i2" src="${ICON}" alt="">` +
        '<p id="i3">Shop App</p><p id="i4">Rated 4.8 by 20k shoppers</p>' +
        '<div id="branch-mobile-action" class="branch-banner-button" role="button" tabindex="0">Get the App</div>' +
        '</main></div><meta name="accessibility" content="wcag">',
      metadata: {
        bannerHeight: '100vh',
        position: 'bottom',
        sticky: 'fixed',
        offsetY: '0',
        isIntrinsic: true,
        injectorSelector: '',
        ctaText: { has_app: 'Open the App', no_app: 'Get the App' },
      },
    }),
  },

  'full-page': {
    device: 'mobile',
    animation: FADE,
    html: template({
      css:
        `#i1{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:24px;background-color:#580DB5;color:#FAFAFA;text-align:center;${FONT}}` +
        '#i2{width:96px;height:96px;border-radius:20px;}#i3{margin:20px 0 8px;font-size:26px;font-weight:600;}#i4{margin:0 0 28px;font-size:16px;}' +
        '#branch-mobile-action{display:flex;align-items:center;justify-content:center;width:100%;height:48px;border-radius:999px;background-color:#FAFAFA;color:#580DB5;font-size:16px;font-weight:600;}' +
        '.branch-banner-continue{margin-top:16px;font-size:14px;text-decoration:underline;}' +
        '.branch-banner-close{position:absolute;top:16px;right:16px;font-size:20px;}',
      iframeCss:
        'body { transition: 0.25s; margin-top: 100vh; } #branch-banner-iframe { border: 0; z-index: 99999; position: fixed; left: 0; right: 0; top: 0; min-width: 100%; height: 100vh; }',
      body:
        '<div id="branch-banner"><div id="i1" class="branch-banner-content">' +
        '<div class="branch-banner-close" role="button" tabindex="0" aria-label="Close">&#x2715;</div>' +
        `<img id="i2" src="${ICON}" alt="">` +
        '<p id="i3">Shop App</p><p id="i4">Your cart, wherever you are</p>' +
        '<div id="branch-mobile-action" class="branch-banner-button" role="button" tabindex="0">Get the App</div>' +
        '<div class="branch-banner-continue" role="button" tabindex="0">Continue on web</div>' +
        '</div></div>',
      metadata: {
        bannerHeight: '100vh',
        position: 'top',
        sticky: 'fixed',
        offsetY: '0',
        isIntrinsic: false,
        injectorSelector: '.branch-journeys-top',
        ctaText: { has_app: 'Open the App', no_app: 'Get the App' },
      },
    }),
  },

  'desktop-corner-card': {
    device: 'desktop',
    animation: slide('IFRAME', 'bottom', 'translateY(100%)'),
    html: template({
      css:
        `#i1{display:flex;flex-direction:column;align-items:center;height:218px;padding:20px;border-radius:12px 12px 0 0;background-color:#FFFFFF;box-shadow:0 0 10px rgba(0,0,0,0.2);${FONT}}` +
        '#i2{width:56px;height:56px;border-radius:12px;}#i3{margin:12px 0 4px;font-size:17px;font-weight:600;color:#27272A;}#i4{margin:0 0 14px;font-size:13px;color:#52525B;}' +
        '#branch-mobile-action{display:flex;align-items:center;height:34px;padding:0 20px;border-radius:999px;background-color:#580DB5;color:#FAFAFA;font-size:14px;}' +
        '.branch-banner-close{position:absolute;top:10px;right:14px;font-size:16px;color:#71717A;}#branch-banner{position:relative;}',
      iframeCss:
        '#branch-banner-iframe { border: 0; z-index: 99999; position: fixed; right: 24px; bottom: 0; width: 300px; height: 218px; }',
      body:
        '<div id="branch-banner"><div id="i1" class="branch-banner-content">' +
        '<div class="branch-banner-close" role="button" tabindex="0" aria-label="Close">&#x2715;</div>' +
        `<img id="i2" src="${ICON}" alt="">` +
        '<p id="i3">Shop on your phone</p><p id="i4">Send the app to your phone</p>' +
        '<div id="branch-mobile-action" class="branch-banner-button" role="button" tabindex="0">Get</div>' +
        '</div></div>',
      metadata: {
        bannerHeight: '218px',
        position: 'bottom',
        sticky: 'fixed',
        offsetY: '0',
        isIntrinsic: false,
        injectorSelector: '',
        ctaText: { has_app: 'Open', no_app: 'Get' },
      },
    }),
  },
};
