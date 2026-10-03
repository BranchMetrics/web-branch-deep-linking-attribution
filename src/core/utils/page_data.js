import { utils } from '../utils.js';

export const page_data = /** @satisfies {Record<string, unknown>} */ ({
  /**
   * Search for a particular og tag by name, and return the content, if it exists. The optional
   * parameter 'content' will be the default value used if the og tag is not found or cannot
   * be parsed.
   * @param {string} property
   * @param {null|string=} content
   */
  getOpenGraphContent: function (property, content) {
    property = String(property);
    content = content || null;

    const el = /** @type {HTMLMetaElement | null} */ (
      document.querySelector('meta[property="og:' + property + '"]')
    );
    if (el?.content) {
      content = el.content;
    }

    return content;
  },

  /**
   * Used by utils.processHostedDeepLinkData() to prioritize deeplink paths found from various sources.
   * Returned params may include $ios_deeplink_path, $android_deeplink_path and $deeplink_path.
   */
  prioritizeDeeplinkPaths: function (params, deeplinkPaths) {
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
  },

  /**
   * Used by utils.getHostedDeepLinkData() to process page metadata.
   */
  processHostedDeepLinkData: function (metadata) {
    const params = {};
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
          deeplinkPaths.hostedIOS = utils.extractMobileDeeplinkPath(
            metadata[i].getAttribute('content'),
          );
        } else if (split[2] === '$android_deeplink_path') {
          deeplinkPaths.hostedAndroid = utils.extractMobileDeeplinkPath(
            metadata[i].getAttribute('content'),
          );
        } else {
          // Add all other hosted deeplink data key/values to params without needing special treatment
          params[split[2]] = metadata[i].getAttribute('content');
        }
      }
      if (nameOrProperty === 'al:ios:url') {
        // Deeplink path detected from App Links meta tag
        deeplinkPaths.applinksIOS = utils.extractMobileDeeplinkPath(
          metadata[i].getAttribute('content'),
        );
      }
      if (nameOrProperty === 'twitter:app:url:iphone') {
        // Deeplink path detected from Twitter meta tag
        deeplinkPaths.twitterIOS = utils.extractMobileDeeplinkPath(
          metadata[i].getAttribute('content'),
        );
      }
      if (nameOrProperty === 'al:android:url') {
        deeplinkPaths.applinksAndroid = utils.extractMobileDeeplinkPath(
          metadata[i].getAttribute('content'),
        );
      }
      if (nameOrProperty === 'twitter:app:url:googleplay') {
        deeplinkPaths.twitterAndroid = utils.extractMobileDeeplinkPath(
          metadata[i].getAttribute('content'),
        );
      }
    }
    return utils.prioritizeDeeplinkPaths(params, deeplinkPaths);
  },

  /**
   * Search for hosted deep link data on the page, as outlined here https://dev.branch.io/getting-started/hosted-deep-link-data/guide/#adding-metatags-to-your-site.
   * Also searches for twitter and applinks tags, i.e. <meta property="al:ios:url" content="applinks://docs" />, <meta name="twitter:app:url:googleplay" content="twitter://docs">.
   */
  getHostedDeepLinkData: function () {
    const metadata = document.getElementsByTagName('meta');
    return utils.processHostedDeepLinkData(metadata);
  },

  getTitle: function () {
    const tags = document.getElementsByTagName('title');
    return tags.length > 0 ? tags[0].innerText : null;
  },

  getDescription: function () {
    const el = /** @type {HTMLMetaElement | null} */ (
      document.querySelector('meta[name="description"]')
    );
    return el?.content ? el.content : null;
  },

  getCanonicalURL: function () {
    const el = /** @type {HTMLLinkElement | null} */ (
      document.querySelector('link[rel="canonical"]')
    );
    return el?.href ? el.href : null;
  },

  openGraphDataAsObject: function () {
    let ogData = {};
    ogData = utils.addPropertyIfNotNull(
      ogData,
      '$og_title',
      utils.getOpenGraphContent('title'),
    );
    ogData = utils.addPropertyIfNotNull(
      ogData,
      '$og_description',
      utils.getOpenGraphContent('description'),
    );
    ogData = utils.addPropertyIfNotNull(
      ogData,
      '$og_image_url',
      utils.getOpenGraphContent('image'),
    );
    ogData = utils.addPropertyIfNotNull(
      ogData,
      '$og_video',
      utils.getOpenGraphContent('video'),
    );
    ogData = utils.addPropertyIfNotNull(
      ogData,
      '$og_type',
      utils.getOpenGraphContent('type'),
    );
    return ogData && Object.keys(ogData).length > 0 ? ogData : null;
  },

  getAdditionalMetadata: function () {
    let metadata = {};
    metadata = utils.addPropertyIfNotNull(
      metadata,
      'og_data',
      utils.openGraphDataAsObject(),
    );
    metadata = utils.addPropertyIfNotNull(
      metadata,
      'hosted_deeplink_data',
      utils.getHostedDeepLinkData(),
    );
    metadata = utils.addPropertyIfNotNull(metadata, 'title', utils.getTitle());
    metadata = utils.addPropertyIfNotNull(
      metadata,
      'description',
      utils.getDescription(),
    );
    metadata = utils.addPropertyIfNotNull(
      metadata,
      'canonical_url',
      utils.getCanonicalURL(),
    );
    return metadata && Object.keys(metadata).length > 0 ? metadata : {};
  },

  // Merges user supplied metadata to hosted deep link data for additional Journeys user targeting
  mergeHostedDeeplinkData: function (hostedDeepLinkData, metadata) {
    const hostedDeepLinkDataClone = hostedDeepLinkData
      ? utils.merge({}, hostedDeepLinkData)
      : {};
    if (metadata && Object.keys(metadata).length > 0) {
      return Object.keys(hostedDeepLinkDataClone).length > 0
        ? utils.merge(hostedDeepLinkDataClone, metadata)
        : utils.merge({}, metadata);
    }
    return hostedDeepLinkDataClone;
  },
});
