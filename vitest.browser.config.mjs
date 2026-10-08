import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Real-browser tests for what jsdom can't check: cascade, layout and positioning.
// Chrome, Firefox and Safari engines. Needs the browsers:
// `pnpm exec playwright install chromium firefox webkit`.
export default defineConfig({
  test: {
    globals: true,
    include: ['test/browser/**/*.test.js'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' },
        { browser: 'firefox' },
        { browser: 'webkit' },
      ],
      viewport: { width: 400, height: 800 },
    },
  },
});
