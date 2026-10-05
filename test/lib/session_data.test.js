import {
  whiteListJourneysLanguageData,
  whiteListSessionData,
} from '../../src/lib/session_data.js';

describe('lib/session_data', () => {
  describe('whiteListSessionData', () => {
    it('whitelists only the known session fields', () => {
      expect(
        whiteListSessionData({
          data: '{}',
          has_app: true,
          identity: 'id1',
          referring_identity: 'rid',
          referring_link: 'https://bnc.lt/abc',
          extraneous: 'drop me',
        }),
      ).toEqual({
        data: '{}',
        data_parsed: {},
        has_app: true,
        identity: 'id1',
        developer_identity: 'id1',
        referring_identity: 'rid',
        referring_link: 'https://bnc.lt/abc',
      });
    });

    it('defaults missing fields', () => {
      expect(whiteListSessionData({})).toEqual({
        data: '',
        data_parsed: {},
        has_app: null,
        identity: null,
        developer_identity: null,
        referring_identity: null,
        referring_link: null,
      });
    });
  });

  describe('whiteListJourneysLanguageData', () => {
    it('extracts only $journeys_ prefixed keys from parsed JSON string data', () => {
      const sessionData = {
        data: JSON.stringify({
          '$journeys_language': 'en',
          'other_key': 'ignored',
        }),
      };
      expect(whiteListJourneysLanguageData(sessionData)).toEqual({
        '$journeys_language': 'en',
      });
    });

    it('extracts from an already-parsed object', () => {
      const sessionData = {
        data: { '$journeys_language': 'fr', 'other_key': 'ignored' },
      };
      expect(whiteListJourneysLanguageData(sessionData)).toEqual({
        '$journeys_language': 'fr',
      });
    });

    it('returns {} when data is missing or unparsable', () => {
      expect(whiteListJourneysLanguageData({})).toEqual({});
      expect(whiteListJourneysLanguageData({ data: 'not json' })).toEqual({});
    });
  });
});
