import { KEY } from '../fixtures.js';
import { createPage, snap } from '../harness.js';

describe('golden: privacy', () => {
  it('init with tracking disabled', async () => {
    const p = createPage({
      url: 'https://shop.example.com/p?_branch_match_id=123456789',
    });
    p.branch.init(KEY, { tracking_disabled: true }, p.cb('init'));
    p.branch.track('pageview', {}, p.cb('track'));
    p.branch.link({ data: { k: 'v' } }, p.cb('link'));
    p.branch.logEvent('PURCHASE', { revenue: 1 }, p.cb('logEvent'));
    await snap('privacy/init-tracking-disabled', p);
  });

  it('disableTracking toggled off and on', async () => {
    const p = createPage();
    p.branch.init(KEY, p.cb('init'));
    p.branch.disableTracking(p.cb('disableTracking'));
    p.branch.logEvent('PURCHASE', {}, p.cb('logEvent1'));
    p.branch.disableTracking(false, p.cb('enableTracking'));
    p.branch.logEvent('PURCHASE', {}, p.cb('logEvent2'));
    await snap('privacy/disableTracking-toggle', p);
  });

  it('setDMAParamsForEEA', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.setDMAParamsForEEA(true, false, true, p.cb('setDMAParamsForEEA'));
    p.branch.logEvent('PURCHASE', {}, p.cb('logEvent'));
    p.branch.track('pageview', {}, p.cb('track'));
    await snap('privacy/setDMAParamsForEEA', p);
  });

  it('setDMAParamsForEEA with invalid values', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.setDMAParamsForEEA('yes', false, true, p.cb('setDMAParamsForEEA'));
    p.branch.logEvent('PURCHASE', {}, p.cb('logEvent'));
    await snap('privacy/setDMAParamsForEEA-invalid', p);
  });
});
