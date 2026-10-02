import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as sdkConfig } from '../../src/0_config.js';
import {
  BANNERS,
  fixtureName,
  NO_BANNER,
  NO_BANNER_SOURCE,
} from './config.mjs';
import { ASSET_BASE, expect, isText, ORIGIN, test } from './fixtures.mjs';
import { findLeaks, scrub } from './scrub.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCAL_CONFIG = join(HERE, 'banners.local.json');
const FIXTURES = join(HERE, 'fixtures');
const SERVICE_ORIGINS = ['https://app.link', 'https://bnc.lt'];

const config = existsSync(LOCAL_CONFIG)
  ? JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8'))
  : null;
test.skip(!config, 'needs banners.local.json (copy banners.example.json)');
// Some stage templates load images from hosts that resolve to private
// addresses on VPN, which Chrome's Local Network Access blocks.
test.use({
  launchOptions: { args: ['--disable-features=LocalNetworkAccessChecks'] },
});
const secrets = Object.values(config?.banners ?? {}).flatMap((b) => [
  b.branchKey,
  b.branchViewId,
]);
const hosts = config ? [new URL(config.apiUrl).hostname] : [];
const sdkVersion = sdkConfig.version;

for (const { name, device, position } of BANNERS) {
  test(name, { tag: `@${device}` }, async ({ branch, page, device }) => {
    const banner = config.banners[name];
    expect(banner, `${name} in banners.local.json`).toBeTruthy();
    const responses = [];
    page.on('response', (r) =>
      responses.push({
        url: r.url(),
        status: r.status(),
        contentType: r.headers()['content-type'] || 'application/octet-stream',
        body: r.body().catch(() => null),
      }),
    );

    await branch.open(name, {
      live: {
        apiUrl: config.apiUrl,
        branchKey: banner.branchKey,
        viewId: banner.branchViewId,
      },
    });
    await branch.waitForBanner();
    expect(
      (await branch.bannerBox()).position,
      `${name} position (check banners.local.json)`,
    ).toBe(position);
    await branch.closeBanner();
    expect(branch.problems).toEqual([]);

    const fixture = await toFixture(name, device, responses);
    const files = { [fixtureName(name, device)]: fixture };
    if (name === NO_BANNER_SOURCE[device])
      files[fixtureName(NO_BANNER, device)] = withoutBanner(fixture);
    for (const [file, data] of Object.entries(files)) {
      const leaks = findLeaks(fixtureText(data), { secrets, hosts });
      expect(leaks, `${file} after scrubbing`).toEqual([]);
    }
    mkdirSync(FIXTURES, { recursive: true });
    for (const [file, data] of Object.entries(files))
      writeFileSync(
        join(FIXTURES, `${file}.json`),
        `${JSON.stringify(data, null, 2)}\n`,
      );
  });
}

async function toFixture(name, mode, responses) {
  const api = {};
  const services = {};
  const assets = {};
  const assetUrls = [];
  for (const response of responses) {
    const { url, contentType } = response;
    if (url.startsWith(ORIGIN)) continue;
    const body = await response.body;
    if (body === null) continue;
    const { origin, pathname } = new URL(url);
    if (url.startsWith(config.apiUrl)) {
      // The first answer is the one the banner was built from.
      api[pathname] ??= {
        status: response.status,
        contentType,
        body: body.toString('utf8'),
      };
    } else if (SERVICE_ORIGINS.includes(origin)) {
      services[origin + pathname] ??= {
        status: response.status,
        contentType,
        body: body.toString('utf8'),
      };
    } else {
      const asset = `a${assetUrls.length}${extname(pathname)}`;
      assetUrls.push([url, asset]);
      assets[asset] = { contentType, body };
    }
  }
  const relink = (text) => {
    for (const [url, asset] of assetUrls) {
      for (const form of [url, url.replace(/&/g, '&amp;')])
        text = text.split(form).join(`${ASSET_BASE}/${asset}`);
    }
    return scrub(text, { secrets, hosts });
  };
  for (const response of [...Object.values(api), ...Object.values(services)])
    response.body = relink(response.body);
  for (const asset of Object.values(assets)) {
    // Stylesheets can pull in fonts.
    if (isText(asset.contentType))
      asset.body = Buffer.from(relink(asset.body.toString('utf8')));
    asset.body = asset.body.toString('base64');
  }
  const pageview = api['/v1/pageview'] && JSON.parse(api['/v1/pageview'].body);
  return {
    banner: name,
    mode,
    recordedAt: new Date().toISOString(),
    sdkVersion,
    v2: !!pageview?.use_v2_renderer,
    api,
    services,
    assets,
  };
}

function fixtureText({ api, services, assets }) {
  const textAssets = Object.values(assets)
    .filter((a) => isText(a.contentType))
    .map((a) => Buffer.from(a.body, 'base64').toString('utf8'));
  return JSON.stringify([api, services, textAssets]);
}

function withoutBanner(source) {
  const pageview = JSON.parse(source.api['/v1/pageview'].body);
  delete pageview.template;
  return {
    ...source,
    banner: NO_BANNER,
    v2: false,
    api: {
      ...source.api,
      '/v1/pageview': {
        ...source.api['/v1/pageview'],
        body: JSON.stringify(pageview),
      },
    },
    assets: {},
  };
}
