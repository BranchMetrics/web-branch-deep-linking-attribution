// Copies the repo's freshly-built SDK (dist/build.min.js) into this subproject's
// public/ dir so the <script> tag test can load the SAME version that the npm
// import test bundles. Both paths therefore measure ONE SDK build under two
// delivery mechanisms — the apples-to-apples comparison EMT-3769 asks for.
//
// It also records the on-disk + gzip size of that build (the SDK's own byte
// contribution) into public/sdk-build-info.json, which the report consumes for
// the "bundle size" row. Zero external deps — Node core only.

import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const builtSdk = join(repoRoot, 'dist', 'build.min.js');
const publicDir = join(here, 'public');

if (!existsSync(builtSdk)) {
	console.error('[copy-sdk] dist/build.min.js not found.');
	console.error('[copy-sdk] Build the SDK first (Node 24): `cd ../.. && make` or `npm run build`.');
	process.exit(1);
}

const bytes = readFileSync(builtSdk);
const gz = gzipSync(bytes, { level: 9 });

// public/ is git-ignored, so it won't exist on a fresh clone — create it.
mkdirSync(publicDir, { recursive: true });
copyFileSync(builtSdk, join(publicDir, 'branch-sdk-cdn.min.js'));

const info = {
	source: 'dist/build.min.js',
	bytes_raw: bytes.length,
	bytes_gzip: gz.length,
	kb_raw: Math.round((bytes.length / 1024) * 10) / 10,
	kb_gzip: Math.round((gz.length / 1024) * 10) / 10
};
writeFileSync(join(publicDir, 'sdk-build-info.json'), JSON.stringify(info, null, 2));

console.log(`[copy-sdk] synced build.min.js -> public/branch-sdk-cdn.min.js`);
console.log(`[copy-sdk] SDK size: ${info.kb_raw} KB raw, ${info.kb_gzip} KB gzip`);
