import { KEY } from '../fixtures.js';
import { createPage, nextPage, snap } from '../harness.js';

describe('behavior: identity', () => {
  it('setIdentity', async () => {
    const p = createPage();
    p.listen();
    p.branch.init(KEY);
    p.branch.setIdentity('user-1', p.cb('setIdentity'));
    p.branch.logEvent('LOGIN');
    await snap('identity/setIdentity', p);
  });

  it('setIdentity carries into a new tab', async () => {
    const first = createPage();
    first.branch.init(KEY);
    first.branch.setIdentity('user-1');
    await first.finish();
    // A new tab: only localStorage carries the identity.
    const p = nextPage(first);
    p.win.sessionStorage.clear();
    p.branch.init(KEY);
    p.branch.logEvent('LOGIN');
    const { trace } = await p.finish();
    const body = (path) => trace.find((e) => e.path === path).body;
    expect(body('/v1/open').identity).toBe('user-1');
    const userData = JSON.parse(body('/v2/event/standard').user_data);
    expect(userData.developer_identity).toBe('user-1');
  });

  it('setIdentity with an empty identity', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.setIdentity('', p.cb('setIdentity'));
    await snap('identity/setIdentity-empty', p);
  });

  it('logout', async () => {
    const p = createPage();
    p.listen();
    p.branch.init(KEY);
    p.branch.setIdentity('user-1');
    p.branch.logout(p.cb('logout'));
    p.branch.logEvent('LOGIN');
    await snap('identity/logout', p);
  });

  it('crossPlatformIds', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.crossPlatformIds(p.cb('crossPlatformIds'));
    await snap('identity/crossPlatformIds', p);
  });

  it('lastAttributedTouchData with a 7 day window', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.lastAttributedTouchData(7, p.cb('lastAttributedTouchData'));
    await snap('identity/lastAttributedTouchData-7', p);
  });

  it('getBrowserFingerprintId', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.getBrowserFingerprintId(p.cb('getBrowserFingerprintId'));
    await snap('identity/getBrowserFingerprintId', p);
  });
});
