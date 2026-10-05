import { config } from '../core/config.js';
import { base64encode } from './encoding.js';

export function generateDynamicBNCLink(branchKey, data) {
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
          value = base64encode(value);
        }
        fallbackUrl = addKeyAndValueToUrl(fallbackUrl, key, value);
      }
    }
  }
  return fallbackUrl;
}

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
export function extractDeeplinkPath(url: string) {
  if (!url) {
    return null;
  }
  if (url.indexOf('://') > -1) {
    url = url.split('://')[1];
  }
  return url.substring(url.indexOf('/') + 1);
}

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
export function extractMobileDeeplinkPath(url: string) {
  if (!url) {
    return null;
  }
  if (url.indexOf('://') > -1) {
    url = url.split('://')[1];
  } else if (url.charAt(0) === '/') {
    url = url.slice(1);
  }
  return url;
}

/**
 * @param url
 * A utility function to validate url
 */
export function isValidURL(url: string) {
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
}

/**
 * @param link
 */
export function processReferringLink(link: string) {
  return link
    ? link.substring(0, 4) !== 'http'
      ? config.link_service_endpoint + link
      : link
    : null;
}

/**
 * @param versionNumber
 * A utility function to remove trailing dot zeroes
 */
export function removeTrailingDotZeros(versionNumber: string) {
  if (!!versionNumber) {
    const dotZeroRegex = /^([1-9]\d*)\.(0\d*)(\.[0]\d*){1,}$/;

    if (versionNumber.indexOf('.') !== -1) {
      const dotString = versionNumber.substring(0, versionNumber.indexOf('.'));
      versionNumber = versionNumber.replace(dotZeroRegex, dotString);
    }
  }
  return versionNumber;
}
