import {
  DUMMY_API_HOST,
  DUMMY_IP,
  DUMMY_KEY,
  DUMMY_LINK_HOST,
  DUMMY_VIEW_ID,
  findLeaks,
  scrub,
} from './scrub.mjs';

const KEY = 'key_live_abcdefghijklmnopqrstuvwxyz123456';
const VIEW = '6a16024406b67500015d55a9';

describe('perf fixture scrubbing', function () {
  it('replaces the recording key and view id', function () {
    const out = scrub(`{"branch_key":"${KEY}","view_id":"${VIEW}"}`, {
      secrets: [KEY, VIEW],
    });
    expect(out).toBe(
      `{"branch_key":"${DUMMY_KEY}","view_id":"${DUMMY_VIEW_ID}"}`,
    );
  });

  it('replaces keys it was not told about', function () {
    const out = scrub('key_test_ZZZZZZZZZZZZZZZZZZZZZZZZ', { secrets: [] });
    expect(out).toBe(DUMMY_KEY);
  });

  it('maps long numeric ids to stable dummies', function () {
    const out = scrub(
      '{"app_id":"1604190038780825762","again":"1604190038780825762","session_id":"1634123687206692815"}',
      {
        secrets: [],
      },
    );
    expect(out).toBe(
      '{"app_id":"100000000000000001","again":"100000000000000001","session_id":"100000000000000002"}',
    );
  });

  it('replaces the recording API host, plain and URL-encoded', function () {
    const host = 'api.internal.example';
    const raw = `https://${host}/v1 branch_api=https%253A%252F%252F${host}`;
    const out = scrub(raw, { secrets: [], hosts: [host] });
    expect(out).toBe(
      `https://${DUMMY_API_HOST}/v1 branch_api=https%253A%252F%252F${DUMMY_API_HOST}`,
    );
    expect(findLeaks(raw, { secrets: [], hosts: [host] })).toEqual([host]);
    expect(findLeaks(out, { secrets: [], hosts: [host] })).toEqual([]);
  });

  it('replaces branch link domains', function () {
    const out = scrub('https://q2zib.branchbeta.link/x', { secrets: [] });
    expect(out).toBe(`https://${DUMMY_LINK_HOST}/x`);
  });

  it('replaces client IPs but keeps loopback and versions', function () {
    const out = scrub(
      '{"ip":"216.180.70.159","url":"http://127.0.0.1/x","ua":"Chrome/153.0.8010.12"}',
      { secrets: [] },
    );
    expect(out).toBe(
      `{"ip":"${DUMMY_IP}","url":"http://127.0.0.1/x","ua":"Chrome/153.0.8010.12"}`,
    );
    expect(findLeaks('"ip":"216.180.70.159"', { secrets: [] })).toEqual([
      '216.180.70.159',
    ]);
    // Nested JSON, as in pageview metadata.
    expect(scrub('{\\"ip\\":\\"216.180.70.159\\"}', { secrets: [] })).toBe(
      `{\\"ip\\":\\"${DUMMY_IP}\\"}`,
    );
  });

  it('leaves css and short numbers alone', function () {
    const css = '#i09eq{gap:8px;width:100%;color:#580DB5;z-index:99999}';
    expect(scrub(css, { secrets: [] })).toBe(css);
    const svg = '<path d="M1.5.5.5 0 10.10.10.10l2.2.2.2"/>';
    expect(scrub(svg, { secrets: [] })).toBe(svg);
  });

  it('finds leftover secrets, keys, link hosts and ids', function () {
    const raw = `${KEY} ${VIEW} x.app.link 1604190038780825762`;
    expect(findLeaks(raw, { secrets: [KEY, VIEW] })).toEqual([
      KEY,
      VIEW,
      'x.app.link',
      '1604190038780825762',
    ]);
    expect(
      findLeaks(scrub(raw, { secrets: [KEY, VIEW] }), {
        secrets: [KEY, VIEW],
      }),
    ).toEqual([]);
  });
});
