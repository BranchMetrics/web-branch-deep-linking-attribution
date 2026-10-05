import { API, KEY, UA } from '../fixtures.js';
import { createPage, nextPage, snap } from '../harness.js';

describe('golden: init', () => {
  it('fresh visitor, plain URL', async () => {
    const p = createPage();
    p.listen();
    p.branch.init(KEY, p.cb('init'));
    await snap('init/fresh-visitor', p);
  });

  it('init with options and no callback', async () => {
    const p = createPage();
    p.branch.init(KEY, {
      no_journeys: true,
      enableLogging: true,
      nonce: 'n0nce',
      metadata: { a: '1' },
    });
    await snap('init/options-no-callback', p);
  });

  it('click from a Branch link (_branch_match_id)', async () => {
    const p = createPage({
      url: 'https://shop.example.com/p?_branch_match_id=123456789&utm_source=x',
    });
    p.branch.init(KEY, p.cb('init'));
    await snap('init/branch-match-id', p);
  });

  it('click from hash link (#r:)', async () => {
    const p = createPage({ url: 'https://shop.example.com/p#r:abcdefgh' });
    p.branch.init(KEY, p.cb('init'));
    await snap('init/hash-r', p);
  });

  it('_branch_referrer param', async () => {
    const p = createPage({
      url:
        'https://shop.example.com/p?_branch_referrer=' +
        encodeURIComponent(btoa('https://ref.example.com')),
    });
    p.branch.init(KEY, p.cb('init'));
    await snap('init/branch-referrer', p);
  });

  it('with document.referrer', async () => {
    const p = createPage({ referrer: 'https://google.com/search?q=x' });
    p.branch.init(KEY, p.cb('init'));
    await snap('init/with-referrer', p);
  });

  it('returning visitor: session storage has a session', async () => {
    const first = createPage();
    first.branch.init(KEY, first.cb('init'));
    await first.finish();
    const p = nextPage(first);
    p.branch.init(KEY, p.cb('init'));
    await snap('init/returning-visitor-session-storage', p);
  });

  it('returning visitor: only local branch_session_first', async () => {
    const first = createPage();
    first.branch.init(KEY, first.cb('init'));
    await first.finish();
    const p = nextPage(first);
    p.win.sessionStorage.clear();
    p.branch.init(KEY, p.cb('init'));
    await snap('init/returning-visitor-local-first', p);
  });

  it('legacy unencoded BFP values in storage', async () => {
    const p = createPage({
      local: {
        branch_session_first: JSON.stringify({
          browser_fingerprint_id: '79336952217731267',
          alternative_browser_fingerprint_id: '79336952217731268',
          identity_id: '1',
          session_id: '2',
        }),
      },
    });
    p.branch.init(KEY, p.cb('init'));
    await snap('init/legacy-unencoded-bfp-in-storage', p);
  });

  it('/v1/open returns an alternative fingerprint', async () => {
    const p = createPage({
      routes: {
        '/v1/open': {
          body: API.openBody({
            alternative_browser_fingerprint_id: '79336952217731268',
          }),
        },
      },
    });
    p.branch.init(KEY, p.cb('init'));
    await snap('init/open-returns-alternative-bfp', p);
  });

  it('_open_delay_ms delays /v1/open', async () => {
    const p = createPage({
      url: 'https://shop.example.com/p?_open_delay_ms=300',
    });
    p.branch.init(KEY, p.cb('init'));
    await snap('init/open-delay-ms', p);
  });

  it('/v1/open fails 500', async () => {
    const p = createPage({
      routes: { '/v1/open': { status: 500, body: { error: 'x' } } },
    });
    p.branch.init(KEY, p.cb('init'));
    await snap('init/open-500', p);
  });

  it('/v1/open times out (retries)', async () => {
    const p = createPage({ routes: { '/v1/open': { timeout: true } } });
    p.branch.init(
      KEY,
      { retries: 1, retry_delay: 10, timeout: 100 },
      p.cb('init'),
    );
    await snap('init/open-timeout-retries', p);
  });

  it('/v1/open fails 503 then succeeds on retry', async () => {
    let calls = 0;
    const p = createPage({
      routes: {
        '/v1/open': () =>
          calls++ === 0 ? { status: 503, body: 'busy' } : { body: {} },
      },
    });
    p.branch.init(KEY, { retries: 2, retry_delay: 10 }, p.cb('init'));
    await snap('init/open-503-retry-succeeds', p);
  });

  it('invalid key', async () => {
    const p = createPage();
    p.branch.init('not-a-key', p.cb('init'));
    await snap('init/invalid-key', p);
  });

  it('init called twice', async () => {
    const p = createPage();
    p.branch.init(KEY, p.cb('init1'));
    p.branch.init(KEY, p.cb('init2'));
    await snap('init/twice', p);
  });

  for (const [name, ua] of Object.entries(UA)) {
    it(`user agent: ${name}`, async () => {
      const p = createPage({ ua });
      p.branch.init(KEY, p.cb('init'));
      await snap(`init/ua-${name}`, p);
    });
  }

  it('hosted deep link data and og tags in head', async () => {
    const p = createPage({
      head: '<meta property="og:title" content="Shoe"><meta name="branch:deeplink:product" content="42"><meta property="al:ios:url" content="app://product/42"><link rel="canonical" href="https://shop.example.com/c">',
    });
    p.branch.init(KEY, p.cb('init'));
    await snap('init/hosted-deeplink-og', p);
  });

  it('tab becomes visible again re-fetches the fingerprint', async () => {
    const first = createPage();
    first.branch.init(KEY);
    await first.finish();
    const p = nextPage(first);
    p.branch.init(KEY, p.cb('init'));
    await p.run(100);
    p.step('visibilitychange');
    p.win.document.dispatchEvent(new p.win.Event('visibilitychange'));
    await snap('init/visibilitychange-refetches-bfp', p);
  });
});
