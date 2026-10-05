import { utils } from '../utils.js';
import { config } from '../config.js';
import { safejson } from '../safejson.js';

export const url = {
  generateDynamicBNCLink: function (branchKey, data) {
    if (!branchKey && !data) {
      return;
    }
    const addKeyAndValueToUrl = function (fallbackUrl, tagName, tagData) {
      const first = fallbackUrl[fallbackUrl.length - 1] === '?';
      let modifiedFallbackURL = first
        ? fallbackUrl + tagName
        : fallbackUrl + '&' + tagName;
      modifiedFallbackURL += '=';
      return modifiedFallbackURL + encodeURIComponent(tagData);
    };

    let fallbackUrl = config.link_service_endpoint + '/a/' + branchKey + '?';
    const topLevelKeys = [
      'tags',
      'alias',
      'channel',
      'feature',
      'stage',
      'campaign',
      'type',
      'duration',
      'sdk',
      'source',
      'data',
    ];
    for (let i = 0; i < topLevelKeys.length; i++) {
      const key = topLevelKeys[i];
      let value = data[key];
      if (value) {
        if (key === 'tags' && Array.isArray(value)) {
          for (let index = 0; index < value.length; index++) {
            fallbackUrl = addKeyAndValueToUrl(fallbackUrl, key, value[index]);
          }
        } else if (
          (typeof value === 'string' && value.length > 0) ||
          typeof value === 'number'
        ) {
          if (key === 'data' && typeof value === 'string') {
            value = utils.base64encode(value);
          }
          fallbackUrl = addKeyAndValueToUrl(fallbackUrl, key, value);
        }
      }
    }
    return fallbackUrl;
  },

  /*
   * Getters for location.search and location.hash, so that we can stub this for testing
   */
  getLocationSearch: function () {
    return utils.isIframeAndFromSameOrigin()
      ? window.top.location.search
      : window.location.search;
  },

  getLocationHash: function () {
    return utils.isIframeAndFromSameOrigin()
      ? window.top.location.hash
      : window.location.hash;
  },

  /**
   * Abstract away the window.location for better testing
   */
  getWindowLocation: function () {
    return utils.isIframe() ? document.referrer : String(window.location);
  },

  /**
   * Find debugging parameters
   */
  getParameterByName: function (name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const url = utils.getWindowLocation();
    const re = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const match = re.exec(url);
    if (!match?.[2]) {
      return '';
    }
    return decodeURIComponent(match[2].replace(/\+/g, ' '));
  },

  cleanLinkData: function (linkData) {
    linkData.source = 'web-sdk';
    let data = linkData.data;

    switch (typeof data) {
      case 'string':
        try {
          data = safejson.parse(data);
        } catch (_e) {
          data = { '_bncNoEval': true };
        }
        break;
      case 'object':
        // do nothing:
        break;
      default:
        data = {};
        break;
    }

    const hasOGRedirectOrFallback =
      data.$og_redirect || data.$fallback_url || data.$desktop_url;

    if (!data.$canonical_url) {
      data.$canonical_url = utils.getWindowLocation();
    }
    if (!data.$og_title) {
      data.$og_title = hasOGRedirectOrFallback
        ? null
        : utils.getOpenGraphContent('title');
    }
    if (!data.$og_description) {
      data.$og_description = hasOGRedirectOrFallback
        ? null
        : utils.getOpenGraphContent('description');
    }
    if (!data.$og_image_url) {
      data.$og_image_url = hasOGRedirectOrFallback
        ? null
        : utils.getOpenGraphContent('image');
    }
    if (!data.$og_video) {
      data.$og_video = hasOGRedirectOrFallback
        ? null
        : utils.getOpenGraphContent('video');
    }
    if (!data.$og_type) {
      data.$og_type = hasOGRedirectOrFallback
        ? null
        : utils.getOpenGraphContent('type');
    }

    if (typeof data.$desktop_url === 'string') {
      data.$desktop_url = data.$desktop_url
        .replace(/#r:[a-z0-9-_]+$/i, '')
        .replace(/([\?\&]_branch_match_id=\d+)/, '');
    }

    try {
      safejson.parse(data);
    } catch (_e) {
      data = safejson.serialize(data);
    }
    linkData.data = data;

    return linkData;
  },

  /**
   * @param link
   */
  getClickIdAndSearchStringFromLink: function (link: string) {
    if (!link || typeof link !== 'string') {
      return '';
    }
    const elem = document.createElement('a');
    elem.href = link;
    function notEmpty(data) {
      return data !== '';
    }
    const pathname = elem.pathname?.split('/').filter(notEmpty);
    return Array.isArray(pathname) && pathname.length
      ? pathname[pathname.length - 1] + elem.search
      : elem.search;
  },

  /**
   * @param link
   */
  processReferringLink: function (link: string) {
    return link
      ? link.substring(0, 4) !== 'http'
        ? config.link_service_endpoint + link
        : link
      : null;
  },

  /**
   * @param key
   */
  hashValue: function (key: string) {
    try {
      const match = utils.getLocationHash().match(new RegExp(key + ':([^&]*)'));
      if (match && match.length >= 1) {
        return match[1];
      }
    } catch (_e) {}
  },

  /**
   * @param key
   */
  getParamValue: function (key: string) {
    try {
      const match = utils
        .getLocationSearch()
        .substring(1)
        .match(new RegExp(key + '=([^&]*)'));
      if (match && match.length >= 1) {
        return match[1];
      }
    } catch (_e) {}
  },

  /**
   * Extract the path (the part of the url excluding protocol and domain name) from urls in the forms
   * of:
   * - "protocol://domain.name/some/path
   * - "domain.name/some/path"
   *
   * and returns (for the above sample input cases):
   * - "some/path"
   *
   * @param url
   */
  extractDeeplinkPath: function (url: string) {
    if (!url) {
      return null;
    }
    if (url.indexOf('://') > -1) {
      url = url.split('://')[1];
    }
    return url.substring(url.indexOf('/') + 1);
  },

  /**
   * Extract the path (the part of the url excluding protocol and domain name) from urls in the forms
   * of:
   * - "AppName://some/path
   * - some/path
   * - /some/path
   *
   * and returns (for the above sample input cases):
   * - "some/path"
   *
   * @param url
   */
  extractMobileDeeplinkPath: function (url: string) {
    if (!url) {
      return null;
    }
    if (url.indexOf('://') > -1) {
      url = url.split('://')[1];
    } else if (url.charAt(0) === '/') {
      url = url.slice(1);
    }
    return url;
  },

  getInitialReferrer: function (referringLink) {
    if (referringLink) {
      return referringLink;
    }
    if (utils.isIframe()) {
      return utils.isSameOriginFrame() ? window.top.document.referrer : '';
    }
    return document.referrer;
  },

  getCurrentUrl: function () {
    return utils.isIframeAndFromSameOrigin()
      ? window.top.location.href
      : window.location.href;
  },

  /**
   * @param url
   * A utility function to validate url
   */
  isValidURL: function (url: string) {
    if (!url || url.trim() === '') {
      return false;
    }
    // The label's inner group is `?`, not `*`: with `*` a run like "0000" can be split many ways,
    // causing exponential backtracking (ReDoS) on invalid input. Both accept the same URLs.
    // biome-ignore lint/complexity/useRegexLiterals: kept as a string, same form as before the fix
    const urlPattern = new RegExp(
      '^(https?)://((([a-z\\d]([a-z\\d-]*[a-z\\d])?)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?$',
      'i',
    );
    return urlPattern.test(url);
  },
};
