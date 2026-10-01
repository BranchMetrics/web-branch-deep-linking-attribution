/**
 * Builds the SDK bundles into dist/:
 *   build.js          readable IIFE (uploaded as branch-latest.js / branch.js)
 *   build.min.js      minified IIFE (npm "main", CDN branch-latest.min.js)
 *   build.min.js.gz   gzip of build.min.js (what the deploy scripts upload)
 *
 * Fails if build.min.js.gz exceeds the budget in size-budget.json.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

const ENTRY = 'src/7_initialization.js';
const TARGET = 'es2015';
const ENTRY_PATH = resolve(ENTRY);

/**
 * Bundles the SDK into dist/<fileName>. Pass `watch: true` to keep rebuilding
 * on source changes; the returned watcher emits rolldown watch events.
 */
export function bundle(fileName, { minify = false, watch = false } = {}) {
  return build({
    configFile: false,
    logLevel: 'warn',
    build: {
      target: TARGET,
      outDir: 'dist',
      emptyOutDir: false,
      minify,
      sourcemap: false,
      watch: watch ? {} : null,
      rolldownOptions: {
        input: ENTRY,
        output: {
          format: 'iife',
          entryFileNames: fileName,
          // Closure stripped 'use strict', so the shipped SDK has always run
          // sloppy; a top-level directive would also leak into any code a
          // customer concatenates after this file.
          strict: false,
        },
        onwarn(warning, warn) {
          // The entry's UMD block intentionally reads the host page's free
          // `module`/`exports`/`define`, and the IIFE needs no global name
          // because the entry assigns window.branch itself. CommonJS globals
          // anywhere else in src/ are a bug, so only the entry is exempt.
          if (
            warning.code === 'COMMONJS_VARIABLE_IN_ESM' &&
            warning.id === ENTRY_PATH
          ) {
            return;
          }
          if (warning.code === 'MISSING_NAME_OPTION_FOR_IIFE_EXPORT') return;
          warn(warning);
        },
      },
    },
  });
}

/**
 * The minifier prints every string as a template literal, which turns the
 * entry's AMD call into define(`branch`, ...). webpack only recognizes a named
 * AMD define whose id is a plain string literal; otherwise it swaps `define`
 * for a stub that throws "define cannot be used indirect", so the SDK fails to
 * load for every npm consumer bundling with webpack. Restore the plain string.
 */
async function quoteAmdDefineId(file) {
  const code = (await readFile(file, 'utf8')).replace(
    'define(`branch`,',
    'define("branch",',
  );
  if (code.split('define("branch",').length !== 2) {
    throw new Error(
      `${file}: expected exactly one define("branch", ...) call for webpack AMD detection`,
    );
  }
  await writeFile(file, code);
}

async function main() {
  await bundle('build.js');
  await bundle('build.min.js', { minify: true });
  await quoteAmdDefineId('dist/build.js');
  await quoteAmdDefineId('dist/build.min.js');

  const min = await readFile('dist/build.min.js');
  const gz = gzipSync(min, { level: 9 });
  await writeFile('dist/build.min.js.gz', gz);
  console.log(`dist/build.min.js  ${min.length} B raw, ${gz.length} B gzip`);

  const { maxGzipBytes } = JSON.parse(
    await readFile('size-budget.json', 'utf8'),
  );
  if (gz.length > maxGzipBytes) {
    throw new Error(
      `dist/build.min.js.gz is ${gz.length} B, over the ${maxGzipBytes} B budget in size-budget.json`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
