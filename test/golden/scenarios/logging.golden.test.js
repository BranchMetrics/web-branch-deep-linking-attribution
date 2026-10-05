import { KEY } from '../fixtures.js';
import { createPage, snap } from '../harness.js';

// enableLogging turns on the SDK's debug console messages; these pin which
// messages each failure path logs.
describe('golden: debug logging', () => {
  it('init fails, then a queued call logs initFailed', async () => {
    const p = createPage({
      routes: { '/v1/open': { status: 500, body: { error: 'x' } } },
    });
    p.branch.init(KEY, { enableLogging: true }, p.cb('init'));
    p.branch.getBrowserFingerprintId(p.cb('getBrowserFingerprintId'));
    await snap('logging/init-failed-then-call', p);
  });

  it('setIdentity(null) logs missingIdentity', async () => {
    const p = createPage();
    p.branch.init(KEY, { enableLogging: true }, p.cb('init'));
    p.branch.setIdentity(null, p.cb('setIdentity'));
    await snap('logging/setIdentity-null', p);
  });

  it('link with a wrongly typed param logs the validator error', async () => {
    const p = createPage();
    p.branch.init(KEY, { enableLogging: true }, p.cb('init'));
    p.branch.link({ tags: 'not-an-array', channel: 'x' }, p.cb('link'));
    await snap('logging/link-invalid-param', p);
  });
});
