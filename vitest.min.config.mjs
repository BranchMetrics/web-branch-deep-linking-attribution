import { resolve } from 'node:path';
import { minifySync } from 'vite';
import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config.mjs';

const SRC_DIR = resolve('src') + '/';

/**
 * Runs the unit suite against src/ modules minified with the same Oxc minifier
 * that produces dist/build.min.js, to catch bugs the minifier introduces.
 * Each module is minified on its own (exports kept), so a problem that only
 * shows up once modules are scope-hoisted into one bundle can still slip past;
 * test:bundle covers the real artifact's public contract.
 */
function minifySrc() {
  return {
    name: 'minify-src',
    enforce: 'post',
    transform(code, id) {
      if (!id.startsWith(SRC_DIR) || !/\.[jt]s$/.test(id)) {
        return null;
      }
      const result = minifySync(id, code, {
        module: true,
        compress: { target: 'es2015' },
        // Module top-levels are locals inside the IIFE bundle, so the real
        // build mangles them too.
        mangle: { toplevel: true },
        sourcemap: true,
      });
      if (result.errors.length) {
        throw new Error(
          `${id}: ${result.errors.map((e) => e.message).join('\n')}`,
        );
      }
      return { code: result.code, map: result.map };
    },
  };
}

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [minifySrc()],
    test: {
      // Minified code would make the coverage numbers meaningless.
      coverage: { enabled: false },
    },
  }),
);
