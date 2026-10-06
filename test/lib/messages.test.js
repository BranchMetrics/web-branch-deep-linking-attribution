import { formatMessage, messages } from '../../src/lib/messages.js';

describe('lib/messages', () => {
  describe('formatMessage', () => {
    it('substitutes $1/$2 placeholders with params', () => {
      expect(formatMessage(messages.missingParam, ['init', 'branch_key'])).toBe(
        'API request init missing parameter branch_key',
      );
    });

    it('appends failure code when provided', () => {
      expect(formatMessage('base message', [], 500)).toBe(
        'base message\n Failure Code:500',
      );
    });

    it('appends failure details when provided', () => {
      expect(formatMessage('base message', [], undefined, 'bad request')).toBe(
        'base message\n Failure Details:bad request',
      );
    });

    it('appends both failure code and details', () => {
      expect(formatMessage('base message', [], 404, 'not found')).toBe(
        'base message\n Failure Code:404\n Failure Details:not found',
      );
    });
  });

  describe('messages', () => {
    it('contains the expected message templates', () => {
      expect(messages.nonInit).toBe('Branch SDK not initialized');
      expect(messages.missingUrl).toBe('Required argument: URL, is missing');
    });
  });
});
