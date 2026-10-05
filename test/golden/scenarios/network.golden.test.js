import { API, KEY, UA } from '../fixtures.js';
import { createPage, nextPage, snap } from '../harness.js';

// XHR send() throws for /v1/open; the JSONP retry gets the normal answer.
const xhrBlocked = () =>
  createPage({
    routes: { '/v1/open': { throwOnSend: true, body: API.openBody() } },
  });

describe('golden: network', () => {
  it('XHR that throws on send falls back to JSONP', async () => {
    const p = xhrBlocked();
    p.branch.init(KEY, p.cb('init'));
    p.branch.logEvent('PURCHASE', {}, p.cb('logEvent'));
    await snap('network/xhr-error-falls-back-to-jsonp', p);
  });

  it('use_jsonp persists to the next page load', async () => {
    const first = xhrBlocked();
    first.branch.init(KEY);
    await first.finish();
    const p = nextPage(first);
    p.branch.init(KEY, p.cb('init'));
    await snap('network/use-jsonp-persisted-next-load', p);
  });

  it('XHR network error', async () => {
    const p = createPage({ routes: { '/v1/open': { networkError: true } } });
    p.branch.init(KEY, p.cb('init'));
    await snap('network/xhr-network-error', p);
  });

  it('JSONP script error (blocked by client)', async () => {
    const p = createPage({ routes: { '/_r': { networkError: true } } });
    p.branch.init(KEY, p.cb('init'));
    await snap('network/jsonp-script-error', p);
  });

  it('setAPIUrl and getAPIUrl', async () => {
    const p = createPage();
    p.branch.setAPIUrl('https://api.example.net');
    p.record('getAPIUrl', () => p.branch.getAPIUrl());
    p.branch.init(KEY, p.cb('init'));
    p.branch.logEvent('PURCHASE');
    await snap('network/setAPIUrl-and-getAPIUrl', p);
  });

  it('setRequestMetaData', async () => {
    const p = createPage();
    p.branch.setRequestMetaData('$foo', 'bar');
    p.branch.setRequestMetaData('baz', 'qux');
    p.branch.init(KEY);
    p.branch.logEvent('PURCHASE');
    p.branch.link({ data: {} });
    await snap('network/setRequestMetaData', p);
  });

  it('setAPIResponseCallback', async () => {
    const p = createPage({
      routes: { '/v1/url': { status: 500, body: 'down' } },
    });
    p.branch.setAPIResponseCallback(p.cb('apiResponse'));
    p.branch.init(KEY);
    p.branch.link({ data: {} });
    await snap('network/setAPIResponseCallback', p);
  });

  it('Safari skips the first JSONP callback index', async () => {
    const p = createPage({ ua: UA.desktopSafari17 });
    p.branch.init(KEY);
    p.branch.deepview({ data: {} }, p.cb('deepview'));
    await snap('network/safari-jsonp-index', p);
  });
});
