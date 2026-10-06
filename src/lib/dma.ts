export const allowDMAParamURLMap = {
  '/v1/open': '',
  '/v1/pageview': '',
  '/v2/event/standard': 'user_data',
  '/v2/event/custom': 'user_data',
};

export function shouldAddDMAParams(endPointURL) {
  return Object.prototype.hasOwnProperty.call(allowDMAParamURLMap, endPointURL);
}

export function setDMAParams(data, dmaObj: Record<string, any> = {}, endPoint) {
  const v1_DMAEndPoints = ['/v1/open', '/v1/pageview'];
  const v2_DMAEndPoints = ['/v2/event/standard', '/v2/event/custom'];
  const dmaParams: Record<string, any> = {};
  dmaParams.dma_eea = dmaObj.eeaRegion;
  dmaParams.dma_ad_personalization = dmaObj.adPersonalizationConsent;
  dmaParams.dma_ad_user_data = dmaObj.adUserDataUsageConsent;
  if (v1_DMAEndPoints.includes(endPoint)) {
    Object.assign(data, dmaParams);
  } else if (v2_DMAEndPoints.includes(endPoint)) {
    try {
      let user_data: Record<string, any>;
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
}
