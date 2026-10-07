import { createContext } from '../../src/core/context.js';
import { getEnv } from '../../src/env/env.js';
import { getPageviewMetadata } from '../../src/journeys/pageview-metadata.js';

describe('journeys/pageview-metadata', () => {
  it('builds url/ua/screen data and merges extra metadata', () => {
    const result = getPageviewMetadata(
      { url: 'https://example.com/x' },
      { extra: 1 },
      createContext(),
    );
    expect(result).toEqual({
      url: 'https://example.com/x',
      user_agent: navigator.userAgent,
      language: navigator.language,
      screen_width: screen.width || -1,
      screen_height: screen.height || -1,
      window_device_pixel_ratio: window.devicePixelRatio || 1,
      extra: 1,
    });
  });

  it('defaults url to the window location and adds userAgentData', () => {
    const ctx = createContext();
    ctx.userAgentData = { model: 'Pixel 9', platformVersion: '15' };
    const result = getPageviewMetadata(null, null, ctx);
    expect(result.url).toBe(getEnv().windowLocation());
    expect(result.model).toBe('Pixel 9');
    expect(result.os_version).toBe('15');
  });
});
