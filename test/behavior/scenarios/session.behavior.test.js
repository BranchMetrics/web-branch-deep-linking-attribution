import { API, KEY } from '../fixtures.js';
import { createPage, nextPage, snap } from '../harness.js';

describe('behavior: session', () => {
  it('data() before init', async () => {
    const p = createPage();
    p.branch.data(p.cb('data'));
    p.branch.init(KEY, p.cb('init'));
    await snap('session/data-before-init', p);
  });

  it('data() after init', async () => {
    const p = createPage({
      url: 'https://shop.example.com/p?_branch_match_id=123456789',
      routes: {
        '/v1/open': {
          body: API.openBody({
            referring_link: 'https://bnc.lt/abc?%24deeplink_path=x',
            data: JSON.stringify({ '+clicked_branch_link': true, k: 'v' }),
          }),
        },
      },
    });
    p.branch.init(KEY, p.cb('init'));
    p.branch.data(p.cb('data'));
    await snap('session/data-after-init', p);
  });

  it('first() after init', async () => {
    const p = createPage();
    p.branch.init(KEY, p.cb('init'));
    p.branch.first(p.cb('first'));
    await snap('session/first-after-init', p);
  });

  it('first() with no stored first session', async () => {
    const p = createPage();
    p.branch.init(KEY, p.cb('init'));
    await p.run(100);
    p.win.localStorage.clear();
    p.record('first', () => p.branch.first(p.cb('first')));
    await snap('session/first-null-storage', p);
  });

  it('referringLink with extended journeys assist', async () => {
    const options = () => ({
      enableExtendedJourneysAssist: true,
      extendedJourneysAssistExpiryTime: 1000,
    });
    const first = createPage({
      url: 'https://shop.example.com/p?_branch_match_id=1',
      routes: {
        '/v1/open': {
          body: API.openBody({ referring_link: 'https://bnc.lt/abc' }),
        },
      },
    });
    first.branch.init(KEY, options());
    await first.finish();
    // A new tab: only localStorage carries the referring link and its expiry.
    const p = nextPage(first);
    p.win.sessionStorage.clear();
    p.branch.init(KEY, options());
    await p.run(100);
    p.record('referringLink', () => p.branch.referringLink(true));
    p.record('referringLinkPlain', () => p.branch.referringLink());
    await p.run(2000);
    p.record('referringLink', () => p.branch.referringLink(true));
    p.record('referringLinkPlain', () => p.branch.referringLink());
    await snap('session/referringLink-extended-assist', p);
  });
});
