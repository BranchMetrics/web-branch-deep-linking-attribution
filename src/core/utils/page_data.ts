import { utils } from '../state.js';

export const page_data = {
  /**
   * Search for a particular og tag by name, and return the content, if it exists. The optional
   * parameter 'content' will be the default value used if the og tag is not found or cannot
   * be parsed.
   * @param property
   * @param content
   */
  getOpenGraphContent: function (property: string, content?: null | string) {
    property = String(property);
    content = content || null;

    const el = document.querySelector(
      'meta[property="og:' + property + '"]',
    ) as HTMLMetaElement | null;
    if (el?.content) {
      content = el.content;
    }

    return content;
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
    const el = document.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement | null;
    return el?.content ? el.content : null;
  },

  getCanonicalURL: function () {
    const el = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;
    return el?.href ? el.href : null;
  },

  openGraphDataAsObject: function () {
    let ogData: Record<string, any> = {};
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
    let metadata: Record<string, any> = {};
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
};
