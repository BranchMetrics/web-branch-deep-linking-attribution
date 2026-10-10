import { defineConfig, devices } from '@playwright/test';

// Loads dist/build.min.js, so `pnpm run build` first.
export default defineConfig({
  testDir: 'test/e2e',
  testMatch: '**/*.e2e.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { trace: 'retain-on-failure' },
  projects: [
    {
      name: 'pixel',
      use: { ...devices['Pixel 7'] },
      grepInvert: /@desktop/,
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 15'] },
      grepInvert: /@desktop/,
    },
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
      grepInvert: /@mobile/,
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
      grepInvert: /@mobile/,
    },
    {
      name: 'desktop-safari',
      use: { ...devices['Desktop Safari'] },
      grepInvert: /@mobile/,
    },
  ],
});
