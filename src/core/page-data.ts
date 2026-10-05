import { addPropertyIfNotNull } from '../lib/objects.js';
import { getEnv } from '../env/env.js';

export function openGraphDataAsObject() {
  let ogData: Record<string, any> = {};
  ogData = addPropertyIfNotNull(
    ogData,
    '$og_title',
    getEnv().openGraphContent('title'),
  );
  ogData = addPropertyIfNotNull(
    ogData,
    '$og_description',
    getEnv().openGraphContent('description'),
  );
  ogData = addPropertyIfNotNull(
    ogData,
    '$og_image_url',
    getEnv().openGraphContent('image'),
  );
  ogData = addPropertyIfNotNull(
    ogData,
    '$og_video',
    getEnv().openGraphContent('video'),
  );
  ogData = addPropertyIfNotNull(
    ogData,
    '$og_type',
    getEnv().openGraphContent('type'),
  );
  return ogData && Object.keys(ogData).length > 0 ? ogData : null;
}

export function getAdditionalMetadata() {
  let metadata: Record<string, any> = {};
  metadata = addPropertyIfNotNull(metadata, 'og_data', openGraphDataAsObject());
  metadata = addPropertyIfNotNull(
    metadata,
    'hosted_deeplink_data',
    getEnv().hostedDeepLinkData(),
  );
  metadata = addPropertyIfNotNull(metadata, 'title', getEnv().title());
  metadata = addPropertyIfNotNull(
    metadata,
    'description',
    getEnv().description(),
  );
  metadata = addPropertyIfNotNull(
    metadata,
    'canonical_url',
    getEnv().canonicalURL(),
  );
  return metadata && Object.keys(metadata).length > 0 ? metadata : {};
}
