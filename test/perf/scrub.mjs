// fixtures/ is committed and this repo is public.

// The SDK only accepts keys with exactly 32 characters after the prefix.
export const DUMMY_KEY = 'key_live_perfFixtureKey000000000000000000';
export const DUMMY_VIEW_ID = 'perf_fixture_view';
export const DUMMY_LINK_HOST = 'perf.app.link';
export const DUMMY_IP = '192.0.2.1';
export const DUMMY_API_HOST = 'api.perf.invalid';

const KEY_RE = /key_(live|test)_[A-Za-z0-9]{20,}/g;
// app_id, session_id, identity_id, browser_fingerprint_id, numeric view ids.
const LONG_ID_RE = /\b\d{15,20}\b/g;
const LINK_HOST_RE =
  /\b[a-z0-9-]+\.(app\.link|test-app\.link|branchbeta\.link|app\.branchbeta\.link)\b/gi;
// Whole quoted values only (quotes possibly escaped), so number runs in SVG
// or CSS are left alone.
const IP_RE = /(?<=")(?:\d{1,3}\.){3}\d{1,3}(?=\\*")/g;
const KEEP_IPS = ['127.0.0.1', DUMMY_IP];
const DUMMY_ID_BASE = 100000000000000000n;
const isDummyId = (id) =>
  BigInt(id) > DUMMY_ID_BASE && BigInt(id) < DUMMY_ID_BASE + 1000n;

// `hosts`: the recording API's hostname, which shows up in recorded page URLs.
export function scrub(text, { secrets, hosts = [] }) {
  let out = text;
  for (const host of hosts) out = out.split(host).join(DUMMY_API_HOST);
  for (const secret of secrets) {
    out = out
      .split(secret)
      .join(secret.startsWith('key_') ? DUMMY_KEY : DUMMY_VIEW_ID);
  }
  out = out.replace(KEY_RE, DUMMY_KEY);
  out = out.replace(LINK_HOST_RE, DUMMY_LINK_HOST);
  out = out.replace(IP_RE, (ip) => (KEEP_IPS.includes(ip) ? ip : DUMMY_IP));
  const ids = new Map();
  out = out.replace(LONG_ID_RE, (id) => {
    if (!ids.has(id)) ids.set(id, String(DUMMY_ID_BASE + BigInt(ids.size + 1)));
    return ids.get(id);
  });
  return out;
}

export function findLeaks(text, { secrets, hosts = [] }) {
  const leaks = [...secrets, ...hosts].filter((s) => text.includes(s));
  for (const k of text.match(KEY_RE) || []) if (k !== DUMMY_KEY) leaks.push(k);
  for (const h of text.match(LINK_HOST_RE) || [])
    if (h !== DUMMY_LINK_HOST) leaks.push(h);
  for (const ip of text.match(IP_RE) || [])
    if (!KEEP_IPS.includes(ip)) leaks.push(ip);
  for (const id of text.match(LONG_ID_RE) || [])
    if (!isDummyId(id)) leaks.push(id);
  return [...new Set(leaks)];
}
