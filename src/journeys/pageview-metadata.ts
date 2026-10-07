import { getEnv } from '../env/env.js';
import { addPropertyIfNotNullorEmpty, merge } from '../lib/objects.js';

// Page and device metadata sent with /v1/pageview and /v1/dismiss.
export function getPageviewMetadata(
  options: any,
  additionalMetadata: any,
  ctx: { userAgentData?: any },
): Record<string, any> {
  let pageviewMetadata = merge(
    {
      'url': options?.url || getEnv().windowLocation(),
      'user_agent': getEnv().userAgent(),
      'language': getEnv().language(),
      'screen_width': getEnv().screenWidth() || -1,
      'screen_height': getEnv().screenHeight() || -1,
      'window_device_pixel_ratio': getEnv().devicePixelRatio() || 1,
    },
    additionalMetadata || {},
  );
  pageviewMetadata = addPropertyIfNotNullorEmpty(
    pageviewMetadata,
    'model',
    ctx.userAgentData ? ctx.userAgentData.model : '',
  );
  pageviewMetadata = addPropertyIfNotNullorEmpty(
    pageviewMetadata,
    'os_version',
    ctx.userAgentData ? ctx.userAgentData.platformVersion : '',
  );
  return pageviewMetadata;
}
