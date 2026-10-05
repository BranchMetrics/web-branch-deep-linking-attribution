/**
 * Base64 encoding because ie9 does not have bota()
 *
 * @param input
 */
export function base64encode(input: string) {
  const utf8_encode = function (string) {
    string = string.replace(/\r\n/g, '\n');
    let utftext = '';
    for (let n = 0; n < string.length; n++) {
      const c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  };

  const keyStr =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  let output = '';
  let chr1: number;
  let chr2: number;
  let chr3: number;
  let enc1: number;
  let enc2: number;
  let enc3: number;
  let enc4: number;
  let i = 0;
  input = utf8_encode(input);

  while (i < input.length) {
    chr1 = input.charCodeAt(i++);
    chr2 = input.charCodeAt(i++);
    chr3 = input.charCodeAt(i++);
    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;
    if (Number.isNaN(chr2)) {
      enc3 = 64;
      enc4 = 64;
    } else if (Number.isNaN(chr3)) {
      enc4 = 64;
    }
    output =
      output +
      keyStr.charAt(enc1) +
      keyStr.charAt(enc2) +
      keyStr.charAt(enc3) +
      keyStr.charAt(enc4);
  }
  return output;
}

/**
 * Decode Base64 if the string is encoded
 * @param str
 */
export function base64Decode(str: string) {
  if (isBase64Encoded(str)) {
    return atob(str);
  }
  return str;
}

/**
 * Check if a String is a BASE64 encoded value
 * @param str
 */
export function isBase64Encoded(str: string) {
  if (typeof str !== 'string') {
    return false;
  }
  if (str === '' || str.trim() === '') {
    return false;
  }
  try {
    return btoa(atob(str)) === str;
  } catch (_err) {
    return false;
  }
}

/**
 * Encodes BFP in data object with Base64 encoding.
 * BFP is supposed to be Base64 encoded when stored in local storage/cookie.
 * @param data
 */
export function encodeBFPs(data: Record<string, any>) {
  if (
    data?.browser_fingerprint_id &&
    !isBase64Encoded(data.browser_fingerprint_id)
  ) {
    data.browser_fingerprint_id = btoa(data.browser_fingerprint_id);
  }
  if (
    data?.alternative_browser_fingerprint_id &&
    !isBase64Encoded(data.alternative_browser_fingerprint_id)
  ) {
    data.alternative_browser_fingerprint_id = btoa(
      data.alternative_browser_fingerprint_id,
    );
  }
  return data;
}

/**
 * Decodes BFPs in data object from Base64 encoding.
 * BFP is supposed to be Base64 encoded when stored in local storage/cookie.
 * @param data
 */
export function decodeBFPs(data: Record<string, any>) {
  if (data && isBase64Encoded(data.browser_fingerprint_id)) {
    data.browser_fingerprint_id = atob(data.browser_fingerprint_id);
  }
  if (data && isBase64Encoded(data.alternative_browser_fingerprint_id)) {
    data.alternative_browser_fingerprint_id = atob(
      data.alternative_browser_fingerprint_id,
    );
  }
  return data;
}
