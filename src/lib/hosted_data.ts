import { merge } from './objects.js';
import { extractMobileDeeplinkPath } from './url.js';

/**
 * Used by utils.processHostedDeepLinkData() to prioritize deeplink paths found from various sources.
 * Returned params may include $ios_deeplink_path, $android_deeplink_path and $deeplink_path.
 */
export function prioritizeDeeplinkPaths(params, deeplinkPaths) {
  if (
    !deeplinkPaths ||
    typeof deeplinkPaths !== 'object' ||
    Object.keys(deeplinkPaths || {}).length === 0
  ) {
    return params;
  }

  if (deeplinkPaths.hostedIOS) {
    params.$ios_deeplink_path = deeplinkPaths.hostedIOS;
  } else if (deeplinkPaths.applinksIOS) {
    params.$ios_deeplink_path = deeplinkPaths.applinksIOS;
  } else if (deeplinkPaths.twitterIOS) {
    params.$ios_deeplink_path = deeplinkPaths.twitterIOS;
  }

  if (deeplinkPaths.hostedAndroid) {
    params.$android_deeplink_path = deeplinkPaths.hostedAndroid;
  } else if (deeplinkPaths.applinksAndroid) {
    params.$android_deeplink_path = deeplinkPaths.applinksAndroid;
  } else if (deeplinkPaths.twitterAndroid) {
    params.$android_deeplink_path = deeplinkPaths.twitterAndroid;
  }

  // If $ios_deeplink_path and $android_deeplink_path are the same, set a $deeplink_path as well
  if (
    Object.prototype.hasOwnProperty.call(params, '$ios_deeplink_path') &&
    Object.prototype.hasOwnProperty.call(params, '$android_deeplink_path') &&
    params.$ios_deeplink_path === params.$android_deeplink_path
  ) {
    params.$deeplink_path = params.$ios_deeplink_path;
  }
  return params;
}

/**
 * Used by utils.getHostedDeepLinkData() to process page metadata.
 */
export function processHostedDeepLinkData(metadata) {
  const params: Record<string, any> = {};
  if (!metadata || metadata.length === 0) {
    return params;
  }
  const deeplinkPaths = {
    // keeps track of deeplink paths encountered when parsing page's meta tags
    'hostedIOS': null,
    'hostedAndroid': null,
    'applinksIOS': null,
    'applinksAndroid': null,
    'twitterIOS': null,
    'twitterAndroid': null,
  };

  for (let i = 0; i < metadata.length; i++) {
    if (
      (!metadata[i].getAttribute('name') &&
        !metadata[i].getAttribute('property')) ||
      !metadata[i].getAttribute('content')
    ) {
      continue;
    }

    const name = metadata[i].getAttribute('name');
    const property = metadata[i].getAttribute('property');
    // name takes precedence over property
    const nameOrProperty = name || property;

    const split = nameOrProperty.split(':');

    if (
      split.length === 3 &&
      split[0] === 'branch' &&
      split[1] === 'deeplink'
    ) {
      if (split[2] === '$ios_deeplink_path') {
        // Deeplink path detected from hosted deep link data
        deeplinkPaths.hostedIOS = extractMobileDeeplinkPath(
          metadata[i].getAttribute('content'),
        );
      } else if (split[2] === '$android_deeplink_path') {
        deeplinkPaths.hostedAndroid = extractMobileDeeplinkPath(
          metadata[i].getAttribute('content'),
        );
      } else {
        // Add all other hosted deeplink data key/values to params without needing special treatment
        params[split[2]] = metadata[i].getAttribute('content');
      }
    }
    if (nameOrProperty === 'al:ios:url') {
      // Deeplink path detected from App Links meta tag
      deeplinkPaths.applinksIOS = extractMobileDeeplinkPath(
        metadata[i].getAttribute('content'),
      );
    }
    if (nameOrProperty === 'twitter:app:url:iphone') {
      // Deeplink path detected from Twitter meta tag
      deeplinkPaths.twitterIOS = extractMobileDeeplinkPath(
        metadata[i].getAttribute('content'),
      );
    }
    if (nameOrProperty === 'al:android:url') {
      deeplinkPaths.applinksAndroid = extractMobileDeeplinkPath(
        metadata[i].getAttribute('content'),
      );
    }
    if (nameOrProperty === 'twitter:app:url:googleplay') {
      deeplinkPaths.twitterAndroid = extractMobileDeeplinkPath(
        metadata[i].getAttribute('content'),
      );
    }
  }
  return prioritizeDeeplinkPaths(params, deeplinkPaths);
}

// Merges user supplied metadata to hosted deep link data for additional Journeys user targeting
export function mergeHostedDeeplinkData(hostedDeepLinkData, metadata) {
  const hostedDeepLinkDataClone = hostedDeepLinkData
    ? merge({}, hostedDeepLinkData)
    : {};
  if (metadata && Object.keys(metadata).length > 0) {
    return Object.keys(hostedDeepLinkDataClone).length > 0
      ? merge(hostedDeepLinkDataClone, metadata)
      : merge({}, metadata);
  }
  return hostedDeepLinkDataClone;
}
