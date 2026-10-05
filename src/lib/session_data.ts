import { safejson } from '../core/safejson.js';
import { getBooleanOrNull } from './objects.js';

/**
 * @param data
 */
export function whiteListSessionData(data: Record<string, any>) {
  return {
    'data': data.data || '',
    'data_parsed': data.data_parsed || {},
    'has_app': getBooleanOrNull(data.has_app),
    'identity': data.identity || null,
    'developer_identity': data.identity || null,
    'referring_identity': data.referring_identity || null,
    'referring_link': data.referring_link || null,
  };
}

/**
 * @param sessionData
 * @return retData
 */
export function whiteListJourneysLanguageData(
  sessionData: Record<string, any>,
) {
  const re = /^\$journeys_\S+$/;
  let data = sessionData.data;
  const retData: Record<string, any> = {};

  if (!data) {
    return {};
  }

  switch (typeof data) {
    case 'string':
      try {
        data = safejson.parse(data);
      } catch (_e) {
        data = {};
      }
      break;
    case 'object':
      // do nothing:
      break;
    default:
      data = {};
      break;
  }

  Object.keys(data).forEach(function (key) {
    const found = re.test(key);
    if (found) {
      retData[key] = data[key];
    }
  });

  return retData;
}
