import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.js'],
    // Behavior traces run against the built bundle: see vitest.behavior.config.mjs.
    exclude: [...configDefaults.exclude, 'test/behavior/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      include: ['src/**'],
      exclude: ['src/snippet/onpage.js', 'src/index.js'],
    },
  },
});
