import { utils } from '../utils.js';

export const dma = /** @satisfies {Record<string, unknown>} */ ({
  allowDMAParamURLMap: {
    '/v1/open': '',
    '/v1/pageview': '',
    '/v2/event/standard': 'user_data',
    '/v2/event/custom': 'user_data',
  },

  shouldAddDMAParams: function (endPointURL) {
    return Object.prototype.hasOwnProperty.call(
      utils.allowDMAParamURLMap,
      endPointURL,
    );
  },

  setDMAParams: function (data, dmaObj = {}, endPoint) {
    const v1_DMAEndPoints = ['/v1/open', '/v1/pageview'];
    const v2_DMAEndPoints = ['/v2/event/standard', '/v2/event/custom'];
    const dmaParams = {};
    dmaParams.dma_eea = dmaObj.eeaRegion;
    dmaParams.dma_ad_personalization = dmaObj.adPersonalizationConsent;
    dmaParams.dma_ad_user_data = dmaObj.adUserDataUsageConsent;
    if (v1_DMAEndPoints.includes(endPoint)) {
      Object.assign(data, dmaParams);
    } else if (v2_DMAEndPoints.includes(endPoint)) {
      try {
        let user_data;
        if (!data.user_data) {
          user_data = {};
        } else {
          user_data = JSON.parse(data.user_data);
        }
        Object.assign(user_data, dmaParams);
        data.user_data = JSON.stringify(user_data);
      } catch (_error) {
        console.error(
          `setDMAParams:: ${data.user_data} is not a valid JSON string`,
        );
      }
    }
  },
});
