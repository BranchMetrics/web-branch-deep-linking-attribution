import { createContext } from '../../src/core/context.js';
import { setEnv } from '../../src/env/env.js';
import {
  buildDismissRequestData,
  sendDismiss,
} from '../../src/journeys/dismiss-request.js';
import { makeFakeEnv } from '../helpers/fake-env.js';

describe('journeys/dismiss-request', () => {
  afterEach(() => setEnv(null));

  it('builds the dismiss request from the pageview request plus decoded journey fields', () => {
    setEnv(
      makeFakeEnv({ hostedDeepLinkData: () => ({ $deeplink_path: 'x' }) }),
    );
    const branch = { _ctx: createContext() };
    const branchView = {
      _getPageviewRequestData: vi.fn((metadata) => ({
        event: 'dismiss',
        metadata,
      })),
    };
    const data = buildDismissRequestData({
      branch,
      branchView,
      source: 'Button(X)',
      linkData: {
        banner_id: 'view-1',
        journey_link_data: {
          journey_id: 'j1',
          journey_name: 'A &amp; B',
          view_id: 'view-1',
          view_name: 'V',
          channel: 'c',
          campaign: 'k',
          tags: ['t'],
        },
      },
    });
    expect(branchView._getPageviewRequestData).toHaveBeenCalledWith(
      expect.objectContaining({
        hosted_deeplink_data: { $deeplink_path: 'x' },
      }),
      null,
      branch,
      true,
    );
    expect(data).toMatchObject({
      event: 'dismiss',
      journey_id: 'j1',
      journey_name: 'A & B',
      view_id: 'view-1',
      view_name: 'V',
      channel: 'c',
      campaign: 'k',
      tags: '["t"]',
      dismissal_source: 'Button(X)',
    });
  });

  it('sendDismiss hands the response on success and ignores errors', () => {
    const responses = [];
    const branch = { _api: vi.fn((_r, _d, cb) => cb(null, { ok: true })) };
    sendDismiss({
      branch,
      requestData: {},
      onResponse: (d) => responses.push(d),
    });
    expect(responses).toEqual([{ ok: true }]);

    const failing = { _api: vi.fn((_r, _d, cb) => cb(new Error('x'))) };
    sendDismiss({
      branch: failing,
      requestData: {},
      onResponse: (d) => responses.push(d),
    });
    expect(responses).toHaveLength(1);
  });
});
