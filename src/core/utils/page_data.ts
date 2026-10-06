import { utils } from '../state.js';
import { getEnv } from '../../env/env.js';

export const page_data = {
  // Environment reads live in src/env/env.ts; these delegate to it.
  getHostedDeepLinkData: () => getEnv().hostedDeepLinkData(),

  openGraphDataAsObject: function () {
    let ogData: Record<string, any> = {};
    ogData = utils.addPropertyIfNotNull(
      ogData,
      '$og_title',
      getEnv().openGraphContent('title'),
    );
    ogData = utils.addPropertyIfNotNull(
      ogData,
      '$og_description',
      getEnv().openGraphContent('description'),
    );
    ogData = utils.addPropertyIfNotNull(
      ogData,
      '$og_image_url',
      getEnv().openGraphContent('image'),
    );
    ogData = utils.addPropertyIfNotNull(
      ogData,
      '$og_video',
      getEnv().openGraphContent('video'),
    );
    ogData = utils.addPropertyIfNotNull(
      ogData,
      '$og_type',
      getEnv().openGraphContent('type'),
    );
    return ogData && Object.keys(ogData).length > 0 ? ogData : null;
  },

  getAdditionalMetadata: function () {
    let metadata: Record<string, any> = {};
    metadata = utils.addPropertyIfNotNull(
      metadata,
      'og_data',
      utils.openGraphDataAsObject(),
    );
    metadata = utils.addPropertyIfNotNull(
      metadata,
      'hosted_deeplink_data',
      getEnv().hostedDeepLinkData(),
    );
    metadata = utils.addPropertyIfNotNull(metadata, 'title', getEnv().title());
    metadata = utils.addPropertyIfNotNull(
      metadata,
      'description',
      getEnv().description(),
    );
    metadata = utils.addPropertyIfNotNull(
      metadata,
      'canonical_url',
      getEnv().canonicalURL(),
    );
    return metadata && Object.keys(metadata).length > 0 ? metadata : {};
  },
};
