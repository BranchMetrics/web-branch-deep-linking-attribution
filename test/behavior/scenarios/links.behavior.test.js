import { KEY, UA } from '../fixtures.js';
import { createPage, snap } from '../harness.js';

// A fresh object per call: the SDK mutates the link data it is given.
const linkData = () => ({
  tags: ['a', 'b'],
  channel: 'sms',
  feature: 'share',
  stage: 'new user',
  campaign: 'spring',
  data: { $desktop_url: 'https://shop.example.com/d', k: 'v' },
});

describe('behavior: links', () => {
  it('link with full data', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.link(linkData(), p.cb('link'));
    await snap('links/link-full', p);
  });

  it('link fails 500', async () => {
    const p = createPage({ routes: { '/v1/url': { status: 500, body: 'x' } } });
    p.branch.init(KEY);
    p.branch.link(linkData(), p.cb('link'));
    await snap('links/link-error-500', p);
  });

  it('qrCode', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.qrCode(linkData(), { code_color: '#000' }, (err, qr) =>
      p.push({
        callback: 'qrCode',
        err: err && String(err),
        rawBuffer: qr?.rawBuffer?.byteLength ?? null,
        base64: err ? null : qr.base64(),
      }),
    );
    await snap('links/qrCode', p);
  });

  it('deepview then deepviewCta', async () => {
    const p = createPage({ ua: UA.androidChrome });
    p.listen();
    p.branch.init(KEY);
    p.branch.deepview(linkData(), p.cb('deepview'));
    await p.run(100);
    p.branch.deepviewCta(p.cb('deepviewCta'));
    await snap('links/deepview-then-cta', p);
  });

  it('deepview with open_app', async () => {
    const p = createPage({ ua: UA.androidChrome });
    p.branch.init(KEY);
    p.branch.deepview(linkData(), { open_app: true }, p.cb('deepview'));
    await p.run(100);
    p.branch.deepviewCta(p.cb('deepviewCta'));
    await snap('links/deepview-open-app', p);
  });

  it('deepview error falls back to a dynamic link CTA', async () => {
    const p = createPage({
      ua: UA.androidChrome,
      routes: { '/v1/deepview': { networkError: true } },
    });
    p.branch.init(KEY);
    p.branch.deepview(
      linkData(),
      { open_app: false, append_deeplink_path: true },
      p.cb('deepview'),
    );
    await p.run(100);
    p.branch.deepviewCta(p.cb('deepviewCta'));
    await snap('links/deepview-error-fallback-cta', p);
  });

  it('deepviewCta before deepview', async () => {
    const p = createPage();
    p.branch.init(KEY);
    p.branch.deepviewCta(p.cb('deepviewCta'));
    await snap('links/deepviewCta-before-deepview', p);
  });
});
