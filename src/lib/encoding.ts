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

// Decodes the HTML entities node-api escapes in journey link data.
export function decodeSymbols(str: string | null | undefined): string | null {
  if (str === undefined || str === null) {
    return null;
  }
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&brvbar;/g, '¦')
    .replace(/&laquo;/g, '«')
    .replace(/&acute;/g, '´')
    .replace(/&middot;/g, '·')
    .replace(/&raquo;/g, '»')
    .replace(/&amp;/g, '&')
    .replace(/&iquest;/g, '¿')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&Agrave;/g, 'À')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Acirc;/g, 'Â')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Aring;/g, 'Å')
    .replace(/&AElig;/g, 'Æ')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Ecirc;/g, 'Ê')
    .replace(/&Euml;/g, 'Ë')
    .replace(/&Igrave;/g, 'Ì')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Icirc;/g, 'Î')
    .replace(/&Iuml;/g, 'Ï')
    .replace(/&ETH;/g, 'Ð')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&Ograve;/g, 'Ò')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&Oslash;/g, 'Ø')
    .replace(/&Ugrave;/g, 'Ù')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ucirc;/g, 'Û')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&Yacute;/g, 'Ý')
    .replace(/&THORN;/g, 'Þ')
    .replace(/&szlig;/g, 'ß')
    .replace(/&agrave;/g, 'à')
    .replace(/&aacute;/g, 'á')
    .replace(/&acirc;/g, 'â')
    .replace(/&atilde;/g, 'ã')
    .replace(/&auml;/g, 'ä')
    .replace(/&aring;/g, 'å')
    .replace(/&aelig;/g, 'æ')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&euml;/g, 'ë')
    .replace(/&igrave;/g, 'ì')
    .replace(/&iacute;/g, 'í')
    .replace(/&icirc;/g, 'î')
    .replace(/&iuml;/g, 'ï')
    .replace(/&eth;/g, 'ð')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&ograve;/g, 'ò')
    .replace(/&oacute;/g, 'ó')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&otilde;/g, 'õ')
    .replace(/&ouml;/g, 'ö')
    .replace(/&oslash;/g, 'ø')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ucirc;/g, 'û')
    .replace(/&uuml;/g, 'ü')
    .replace(/&yacute;/g, 'ý')
    .replace(/&thorn;/g, 'þ')
    .replace(/&yuml;/g, 'ÿ');
}
