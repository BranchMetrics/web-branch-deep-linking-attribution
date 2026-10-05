import { KEY, UA } from '../fixtures.js';
import { createPage, snap } from '../harness.js';

// A fresh object per call: the SDK mutates the options it is given.
const options = () => ({
  title: 'App',
  icon: 'https://x/i.png',
  description: 'd',
  openAppButtonText: 'Open',
  downloadAppButtonText: 'Get',
});

describe('golden: banner', () => {
  it('show and close with a callback', async () => {
    const p = createPage({ ua: UA.iphoneSafari });
    p.listen();
    p.branch.init(KEY);
    p.branch.banner(options(), { data: { k: 'v' } }, p.cb('banner'));
    await p.run(2000);
    p.branch.closeBanner(p.cb('closeBanner'));
    await snap('banner/show-and-close', p);
  });

  it('close without a callback', async () => {
    const p = createPage({ ua: UA.androidChrome });
    p.branch.init(KEY);
    p.branch.banner(options(), { data: {} });
    await p.run(2000);
    p.branch.closeBanner();
    await snap('banner/close-without-callback', p);
  });

  it('dark theme', async () => {
    const p = createPage({ ua: UA.iphoneSafari });
    p.branch.init(KEY);
    p.branch.banner({ ...options(), theme: 'dark' }, { data: {} });
    await p.run(2000);
    await snap('banner/theme-dark', p);
  });

  it('not supported on desktop', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.banner(options(), { data: {} }, p.cb('banner'));
    await snap('banner/desktop-unsupported', p);
  });
});
