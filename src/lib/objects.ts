import { safejson } from '../core/safejson.js';

/**
 * @param to
 * @param from
 * @param removeNull delete null or undefined entries instead of inserting
 */
export function merge(
  to: Record<string, any>,
  from: Record<string, any>,
  removeNull?: boolean,
) {
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
}

/**
 * @param key_or_id
 */
export function isKey(key_or_id: string) {
  return key_or_id.indexOf('key_') > -1;
}

/**
 * @param string
 */
export function snakeToCamel(string: string) {
  const find = /(\-\w)/g;
  const convert = function (matches) {
    return matches[1].toUpperCase();
  };
  return string.replace(find, convert);
}

export function cleanBannerText(string) {
  if (typeof string !== 'string') {
    return null;
  }

  return string.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function addPropertyIfNotNull(obj, key, value) {
  if (value !== null && value !== undefined) {
    if (typeof value === 'object' && Object.keys(value || {}).length === 0) {
      return obj;
    }
    obj[key] = value;
  }
  return obj;
}

export function removePropertiesFromObject(objectToModify, keysToRemove) {
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
}

export function validateParameterType(parameter, type) {
  if (!type || (parameter === null && type === 'object')) {
    return false;
  }
  if (type === 'array') {
    return Array.isArray(parameter);
  }
  return typeof parameter === type && !Array.isArray(parameter);
}

export function convertValueToString(value) {
  if (validateParameterType(value, 'object')) {
    return safejson.stringify(value);
  }
  if (validateParameterType(value, 'array')) {
    return safejson.stringify(value);
  }
  if (value === null) {
    return 'null';
  }
  return value.toString();
}

// Required for logEvent()'s custom_data object - values must be converted to string
export function convertObjectValuesToString(objectToConvert) {
  if (
    !validateParameterType(objectToConvert, 'object') ||
    Object.keys(objectToConvert).length === 0
  ) {
    return {};
  }
  for (const key in objectToConvert) {
    if (Object.prototype.hasOwnProperty.call(objectToConvert, key)) {
      objectToConvert[key] = convertValueToString(objectToConvert[key]);
    }
  }
  return objectToConvert;
}

export function getBooleanOrNull(value) {
  if (value === undefined) {
    return null;
  }

  return value;
}

/**
 * Execute operation immediately or after a timeout.
 * setTimeout(operation, 0) will enqueue the operation and may not execute
 * right away.
 * @param operation A function with no arguments to be executed after delay ms.
 * @param delay Operation will be executed after this number of ms. If 0, the operation is executed immediately, not using setTimeout.
 */
export function delay(operation: () => void, delay: number) {
  if (Number.isNaN(Number(delay)) || delay <= 0) {
    operation();
    return;
  }

  setTimeout(operation, delay);
}

/**
 * @param obj
 * @param key
 * @param value
 * A utility function to add a property to an object only if its value is not null, empty
 */
export function addPropertyIfNotNullorEmpty(
  obj: Record<string, any>,
  key: string,
  value: string,
) {
  if (typeof value === 'string' && !!value) {
    obj[key] = value;
  }
  return obj;
}

/**
 * @param value
 * Check if given value is boolean or not
 */
export function isBoolean(value: any) {
  return value === true || value === false;
}
