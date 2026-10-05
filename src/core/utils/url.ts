import { utils } from '../utils.js';
import { safejson } from '../safejson.js';

export const url = {
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
};
