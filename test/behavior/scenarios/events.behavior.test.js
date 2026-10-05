import { KEY } from '../fixtures.js';
import { createPage, snap } from '../harness.js';

describe('behavior: events', () => {
  it('track pageview', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.track('pageview', { page: 'home' }, p.cb('track'));
    await snap('events/track-pageview', p);
  });

  it('track custom event with metadata', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.track('signup', { plan: 'pro' }, p.cb('track'));
    await snap('events/track-custom-with-metadata', p);
  });

  it('logEvent standard event with every argument', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.logEvent(
      'PURCHASE',
      { transaction_id: 't1', revenue: 9.99, currency: 'USD', custom_key: 'v' },
      [{ $sku: 's1' }],
      'alias',
      p.cb('logEvent'),
    );
    await snap('events/logEvent-standard-full', p);
  });

  it('logEvent custom event', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.logEvent('my_event', { k: 'v' }, p.cb('logEvent'));
    await snap('events/logEvent-custom', p);
  });

  it('logEvent with an invalid name', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.logEvent(42, p.cb('logEvent'));
    await snap('events/logEvent-invalid-name', p);
  });

  it('logEvent rejected by the server', async () => {
    const p = createPage({
      routes: { '/v2/event/standard': { status: 400, body: 'bad event' } },
    });
    p.branch.init(KEY);
    p.branch.logEvent('PURCHASE', { revenue: 1 }, p.cb('logEvent'));
    await snap('events/logEvent-server-400', p);
  });

  it('trackCommerceEvent with a valid purchase', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.trackCommerceEvent(
      'purchase',
      {
        revenue: 50,
        currency: 'USD',
        transaction_id: 't1',
        products: [{ sku: 's1', name: 'Shoe', price: 50, quantity: 1 }],
      },
      { k: 'v' },
      p.cb('trackCommerceEvent'),
    );
    await snap('events/trackCommerceEvent-valid', p);
  });

  it('trackCommerceEvent without commerce data', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.trackCommerceEvent('purchase', p.cb('trackCommerceEvent'));
    await snap('events/trackCommerceEvent-invalid', p);
  });

  it('track before init is queued', async () => {
    const p = createPage();
    p.branch.track('pageview', {}, p.cb('track'));
    p.branch.init(KEY, p.cb('init'));
    await snap('events/before-init-queued', p);
  });
});
