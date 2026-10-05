import { utils } from '../utils.js';
import { safejson } from '../safejson.js';

export const data = /** @satisfies {Record<string, unknown>} */ ({
  /**
   * @param {Object} to
   * @param {Object} from
   * @param {boolean=} removeNull delete null or undefined entries instead of inserting
   */
  merge: function (to, from, removeNull) {
    if (!to || typeof to !== 'object') {
      to = {};
    }
    if (!from || typeof from !== 'object') {
      return to;
    }

    for (const attr in from) {
      if (Object.prototype.hasOwnProperty.call(from, attr)) {
        const fromAttr = from[attr];
        /* Only remove null and undefined, not all falsy values. */
        if (removeNull && (fromAttr === undefined || fromAttr === null)) {
          delete to[attr];
        } else {
          to[attr] = fromAttr;
        }
      }
    }
    return to;
  },

  /**
   * @param {string} key_or_id
   */
  isKey: function (key_or_id) {
    return key_or_id.indexOf('key_') > -1;
  },

  /**
   * @param {string} string
   */
  snakeToCamel: function (string) {
    const find = /(\-\w)/g;
    const convert = function (matches) {
      return matches[1].toUpperCase();
    };
    return string.replace(find, convert);
  },

  /**
   * Base64 encoding because ie9 does not have bota()
   *
   * @param {string} input
   */
  base64encode: function (input) {
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
    let chr1;
    let chr2;
    let chr3;
    let enc1;
    let enc2;
    let enc3;
    let enc4;
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
  },

  /**
   * Decode Base64 if the string is encoded
   * @param {string} str
   */
  base64Decode: function (str) {
    if (utils.isBase64Encoded(str)) {
      return atob(str);
    }
    return str;
  },

  /**
   * Check if a String is a BASE64 encoded value
   * @param {string} str
   */
  isBase64Encoded: function (str) {
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
  },

  /**
   * Encodes BFP in data object with Base64 encoding.
   * BFP is supposed to be Base64 encoded when stored in local storage/cookie.
   * @param {Object} data
   */
  encodeBFPs: function (data) {
    if (
      data?.browser_fingerprint_id &&
      !utils.isBase64Encoded(data.browser_fingerprint_id)
    ) {
      data.browser_fingerprint_id = btoa(data.browser_fingerprint_id);
    }
    if (
      data?.alternative_browser_fingerprint_id &&
      !utils.isBase64Encoded(data.alternative_browser_fingerprint_id)
    ) {
      data.alternative_browser_fingerprint_id = btoa(
        data.alternative_browser_fingerprint_id,
      );
    }
    return data;
  },

  /**
   * Decodes BFPs in data object from Base64 encoding.
   * BFP is supposed to be Base64 encoded when stored in local storage/cookie.
   * @param {Object} data
   */
  decodeBFPs: function (data) {
    if (data && utils.isBase64Encoded(data.browser_fingerprint_id)) {
      data.browser_fingerprint_id = atob(data.browser_fingerprint_id);
    }
    if (
      data &&
      utils.isBase64Encoded(data.alternative_browser_fingerprint_id)
    ) {
      data.alternative_browser_fingerprint_id = atob(
        data.alternative_browser_fingerprint_id,
      );
    }
    return data;
  },

  cleanBannerText: function (string) {
    if (typeof string !== 'string') {
      return null;
    }

    return string.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  addPropertyIfNotNull: function (obj, key, value) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && Object.keys(value || {}).length === 0) {
        return obj;
      }
      obj[key] = value;
    }
    return obj;
  },

  removePropertiesFromObject: function (objectToModify, keysToRemove) {
    if (
      objectToModify &&
      typeof objectToModify === 'object' &&
      !Array.isArray(objectToModify) &&
      Object.keys(objectToModify).length > 0 &&
      keysToRemove &&
      Array.isArray(keysToRemove) &&
      keysToRemove.length > 0
    ) {
      for (const key in objectToModify) {
        if (
          Object.prototype.hasOwnProperty.call(objectToModify, key) &&
          keysToRemove.indexOf(key) > -1
        ) {
          delete objectToModify[key];
        }
      }
    }
  },

  validateParameterType: function (parameter, type) {
    if (!type || (parameter === null && type === 'object')) {
      return false;
    }
    if (type === 'array') {
      return Array.isArray(parameter);
    }
    return typeof parameter === type && !Array.isArray(parameter);
  },

  convertValueToString: function (value) {
    if (utils.validateParameterType(value, 'object')) {
      return safejson.stringify(value);
    }
    if (utils.validateParameterType(value, 'array')) {
      return safejson.stringify(value);
    }
    if (value === null) {
      return 'null';
    }
    return value.toString();
  },

  // Required for logEvent()'s custom_data object - values must be converted to string
  convertObjectValuesToString: function (objectToConvert) {
    if (
      !utils.validateParameterType(objectToConvert, 'object') ||
      Object.keys(objectToConvert).length === 0
    ) {
      return {};
    }
    for (const key in objectToConvert) {
      if (Object.prototype.hasOwnProperty.call(objectToConvert, key)) {
        objectToConvert[key] = utils.convertValueToString(objectToConvert[key]);
      }
    }
    return objectToConvert;
  },

  getBooleanOrNull: function (value) {
    if (value === undefined) {
      return null;
    }

    return value;
  },

  /**
   * Execute operation immediately or after a timeout.
   * setTimeout(operation, 0) will enqueue the operation and may not execute
   * right away.
   * @param {() => void} operation A function with no arguments to be executed after delay ms.
   * @param {number} delay Operation will be executed after this number of ms. If 0, the operation is executed immediately, not using setTimeout.
   */
  delay: function (operation, delay) {
    if (Number.isNaN(Number(delay)) || delay <= 0) {
      operation();
      return;
    }

    setTimeout(operation, delay);
  },

  /**
   * @param {Object} obj
   * @param {string} key
   * @param {string} value
   * A utility function to add a property to an object only if its value is not null, empty
   */
  addPropertyIfNotNullorEmpty: function (obj, key, value) {
    if (typeof value === 'string' && !!value) {
      obj[key] = value;
    }
    return obj;
  },

  /**
   * @param {*} value
   * Check if given value is boolean or not
   */
  isBoolean: function (value) {
    return value === true || value === false;
  },
});
