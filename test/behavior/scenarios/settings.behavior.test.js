import { KEY } from '../fixtures.js';
import { createPage, snap } from '../harness.js';

describe('behavior: settings', () => {
  it('addListener and removeListener', async () => {
    const p = createPage();
    p.listen('kept');
    const removed = p.listen('removed');
    p.branch.addListener('didInit', (event) =>
      p.push({ event: 'didInit-only', name: event }),
    );
    p.branch.removeListener(removed);
    p.branch.init(KEY, p.cb('init'));
    p.branch.logEvent('PURCHASE');
    await snap('settings/addListener-removeListener', p);
  });
});
