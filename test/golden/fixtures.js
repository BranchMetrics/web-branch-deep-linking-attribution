/**
 * Fixed inputs for the golden scenarios. IDs match the globals in
 * test/test-utils.js so traces look familiar.
 */
// Well-formed but fake: real keys never go into the repo.
export const KEY = 'key_live_goldenTraceFakeKey00000000000000';
export const BFP = '79336952217731267';
export const IDENTITY_ID = '98807509250212101';
export const SESSION_ID = '98807509250212102';

export const UA = {
  desktopChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  desktopSafari17:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iosWKWebView:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  windowsEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
};

const openBody = (extra = {}) => ({
  identity_id: IDENTITY_ID,
  session_id: SESSION_ID,
  browser_fingerprint_id: BFP,
  link: 'https://bnc.lt/i/4LYQTXE0_k',
  identity: null,
  has_app: false,
  data: JSON.stringify({
    '+clicked_branch_link': false,
    '+is_first_session': true,
  }),
  ...extra,
});

/**
 * A Journey template as /v1/pageview returns it. The server fills in the
 * callback the SDK sent as `callback_string`; its script hands the CTA back.
 */
export const journeyHtml = (callback) =>
  `<html><head><style>#branch-banner-spacer {margin-bottom: 76px;}</style><script type="application/json">{"bannerHeight":"76px","position":"top","sticky":"absolute","globalDismissPeriod":7}</script><script type="text/javascript">window.${callback}(function () { window.top.location.replace("https://bnc.lt/j/jv1-cta"); });</script></head><body><div id="branch-banner"><a id="branch-mobile-action" href="https://bnc.lt/j/jv1-cta">Open</a><div class="branch-banner-continue">No thanks</div><div class="branch-banner-close">x</div></div></body></html>`;

export const API = {
  openBody,
  defaults() {
    return {
      '/_r': { body: BFP },
      '/v1/open': { body: openBody() },
      '/v1/pageview': { body: { branch_view_enabled: false } },
      '/v1/url': { body: { url: 'https://bnc.lt/l/3HZMytU-BW' } },
      '/v1/qr-code': { body: 'PNGDATA' },
      // The real endpoint answers with a CTA function.
      '/v1/deepview': {
        script:
          'function () { window.top.location.replace("https://bnc.lt/d/abc"); }',
      },
      '/v2/event/standard': { body: { branch_view_enabled: false } },
      '/v2/event/custom': { body: { branch_view_enabled: false } },
      '/v1/dismiss': { body: {} },
      '/v1/cpid': {
        body: {
          user_data: { developer_identity: 'u1', cross_platform_id: 'cp1' },
        },
      },
      '/v1/cpid/latd': {
        body: { last_attributed_touch_data: { '~campaign': 'spring' } },
      },
    };
  },
  /** A /v1/pageview route that renders a Journey. */
  pageviewWithJourney(extra = {}) {
    return (req) => ({
      body: {
        branch_view_enabled: true,
        template: journeyHtml(
          new URLSearchParams(req.body).get('callback_string'),
        ),
        event_data: { branch_view_data: { id: 'jv1', ...extra } },
        journey_link_data: { url: 'https://bnc.lt/j/jv1' },
      },
    });
  },
};
