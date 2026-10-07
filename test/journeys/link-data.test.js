import { buildJourneyLinkData } from '../../src/journeys/link-data.js';

describe('journeys/link-data', () => {
  it('carries only banner_id without link data', () => {
    expect(buildJourneyLinkData('view-1', null)).toEqual({
      banner_id: 'view-1',
    });
    expect(buildJourneyLinkData('view-1', {})).toEqual({ banner_id: 'view-1' });
  });

  it('copies link data minus the filtered keys without mutating the input', () => {
    const raw = {
      type: 'mobile',
      view_id: 'view-1',
      browser_fingerprint_id: 'bfp',
      app_id: 'app',
      source: 'web-sdk',
      open_app: false,
      link_click_id: 'lc',
    };
    const before = { ...raw };
    expect(buildJourneyLinkData('view-1', raw)).toEqual({
      banner_id: 'view-1',
      journey_link_data: { type: 'mobile', view_id: 'view-1' },
    });
    expect(raw).toEqual(before);
  });
});
