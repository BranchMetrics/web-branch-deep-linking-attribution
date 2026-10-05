import { safejson } from './safejson.js';
import { getEnv } from '../env/env.js';

/**
 * Find debugging parameters
 */
export function getParameterByName(name) {
  name = name.replace(/[\[\]]/g, '\\$&');
  const url = getEnv().windowLocation();
  const re = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const match = re.exec(url);
  if (!match?.[2]) {
    return '';
  }
  return decodeURIComponent(match[2].replace(/\+/g, ' '));
}

export function cleanLinkData(linkData) {
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
    data.$canonical_url = getEnv().windowLocation();
  }
  if (!data.$og_title) {
    data.$og_title = hasOGRedirectOrFallback
      ? null
      : getEnv().openGraphContent('title');
  }
  if (!data.$og_description) {
    data.$og_description = hasOGRedirectOrFallback
      ? null
      : getEnv().openGraphContent('description');
  }
  if (!data.$og_image_url) {
    data.$og_image_url = hasOGRedirectOrFallback
      ? null
      : getEnv().openGraphContent('image');
  }
  if (!data.$og_video) {
    data.$og_video = hasOGRedirectOrFallback
      ? null
      : getEnv().openGraphContent('video');
  }
  if (!data.$og_type) {
    data.$og_type = hasOGRedirectOrFallback
      ? null
      : getEnv().openGraphContent('type');
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
}

/**
 * @param key
 */
export function hashValue(key: string) {
  try {
    const match = getEnv()
      .locationHash()
      .match(new RegExp(key + ':([^&]*)'));
    if (match && match.length >= 1) {
      return match[1];
    }
  } catch (_e) {}
}

/**
 * @param key
 */
export function getParamValue(key: string) {
  try {
    const match = getEnv()
      .locationSearch()
      .substring(1)
      .match(new RegExp(key + '=([^&]*)'));
    if (match && match.length >= 1) {
      return match[1];
    }
  } catch (_e) {}
}

export const getInitialReferrer = (referringLink?: string) =>
  referringLink || getEnv().initialReferrer();
