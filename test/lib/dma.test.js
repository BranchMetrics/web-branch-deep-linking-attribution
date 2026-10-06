import {
  allowDMAParamURLMap,
  setDMAParams,
  shouldAddDMAParams,
} from '../../src/lib/dma.js';

describe('lib/dma', () => {
  describe('shouldAddDMAParams', () => {
    it('is true for whitelisted endpoints', () => {
      expect(shouldAddDMAParams('/v1/open')).toBe(true);
      expect(shouldAddDMAParams('/v2/event/custom')).toBe(true);
    });

    it('is false for other endpoints', () => {
      expect(shouldAddDMAParams('/v1/unknown')).toBe(false);
    });

    it('exposes the endpoint map used for the check', () => {
      expect(Object.keys(allowDMAParamURLMap)).toContain('/v1/pageview');
    });
  });

  describe('setDMAParams', () => {
    it('adds dma params directly onto the data object for v1 endpoints', () => {
      const data = {};
      setDMAParams(
        data,
        {
          eeaRegion: true,
          adPersonalizationConsent: false,
          adUserDataUsageConsent: true,
        },
        '/v1/open',
      );
      expect(data).toEqual({
        dma_eea: true,
        dma_ad_personalization: false,
        dma_ad_user_data: true,
      });
    });

    it('merges dma params into user_data JSON for v2 endpoints', () => {
      const data = {};
      setDMAParams(
        data,
        { eeaRegion: true, adPersonalizationConsent: true },
        '/v2/event/standard',
      );
      expect(JSON.parse(data.user_data)).toEqual({
        dma_eea: true,
        dma_ad_personalization: true,
        dma_ad_user_data: undefined,
      });
    });

    it('is a no-op for unrecognized endpoints', () => {
      const data = { existing: true };
      setDMAParams(data, { eeaRegion: true }, '/v3/unknown');
      expect(data).toEqual({ existing: true });
    });
  });
});
