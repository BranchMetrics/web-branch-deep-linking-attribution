/**
 * Thin JSON wrappers that throw descriptive errors on failure.
 */

export const safejson = {};

safejson.parse = function (sJSON) {
  sJSON = String(sJSON);
  try {
    return JSON.parse(sJSON);
  } catch (_e) {}

  throw Error('Invalid JSON string: ' + sJSON);
};

const JSON_ESCAPES = {
  '"': '\\"',
  '\\': '\\\\',
  '/': '\\/',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\x0B': '\\u000b',
};

function serializeString(s) {
  return (
    '"' +
    // biome-ignore lint/suspicious/noControlCharactersInRegex: escaping control chars is the purpose of this regex
    s.replace(/[\\"\x00-\x1f\x7f-\uffff]/g, function (c) {
      return (
        JSON_ESCAPES[c] ||
        '\\u' + (c.charCodeAt(0) | 0x10000).toString(16).slice(1)
      );
    }) +
    '"'
  );
}

/**
 * JSON serializer. Unlike JSON.stringify, its output is always ASCII (every
 * non-ASCII character is \u-escaped, which base64encode relies on for
 * surrogate pairs), undefined object values serialize as null instead of
 * being dropped, and toJSON() is ignored.
 */
safejson.serialize = function (value) {
  let items;
  let members;
  let i;
  let key;
  if (value == null) {
    return 'null';
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      items = [];
      for (i = 0; i < value.length; i++) {
        items.push(safejson.serialize(value[i]));
      }
      return '[' + items.join(',') + ']';
    }
    if (
      value instanceof String ||
      value instanceof Number ||
      value instanceof Boolean
    ) {
      value = value.valueOf();
    } else {
      members = [];
      for (key in value) {
        if (
          Object.prototype.hasOwnProperty.call(value, key) &&
          typeof value[key] !== 'function'
        ) {
          members.push(
            serializeString(key) + ':' + safejson.serialize(value[key]),
          );
        }
      }
      return '{' + members.join(',') + '}';
    }
  }
  switch (typeof value) {
    case 'string':
      return serializeString(value);
    case 'number':
      return Number.isFinite(value) && !Number.isNaN(value)
        ? String(value)
        : 'null';
    case 'boolean':
      return String(value);
    case 'function':
      return 'null';
    default:
      throw new Error('Unknown type: ' + typeof value);
  }
};

safejson.stringify = function (objJSON) {
  try {
    return JSON.stringify(objJSON);
  } catch (_e) {}

  throw Error('Could not stringify object');
};
