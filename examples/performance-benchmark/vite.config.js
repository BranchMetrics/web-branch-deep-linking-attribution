import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Vite's dev server serves public/ files with `no-cache`, so the <script>-tag
// SDK gets revalidated (304) on every reload while Vite's optimized npm dep is
// served `immutable` (0-RTT cache hit). That asymmetry made the cache-hit metric
// read 0% for the script tag vs 100% for npm in dev — a dev-server artifact, not a
// real difference. Serve the SDK file with CDN-like immutable caching in dev so the
// manual view matches production (and the automated static-server) caching.
const cdnCacheEmulation = {
	name: 'cdn-cache-emulation',
	configureServer(server) {
		const file = resolve(__dirname, 'public/branch-sdk-cdn.min.js');
		server.middlewares.use((req, res, next) => {
			if (req.url && req.url.split('?')[0] === '/branch-sdk-cdn.min.js') {
				try {
					const buf = readFileSync(file);
					res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
					res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
					res.end(buf);
					return;
				} catch (e) {
					/* fall through to Vite's static handler */
				}
			}
			next();
		});
	}
};

// Multi-page build. Entry HTML files are named explicitly (not index.html) so
// they survive the repo's root .gitignore rule that ignores bare `index.html`.
// `branch-sdk` resolves to the repo via the file:../.. dependency; commonjs
// interop lets `import branch from 'branch-sdk'` consume the UMD dist build.
export default defineConfig({
	root: __dirname,
	publicDir: resolve(__dirname, 'public'),
	plugins: [cdnCacheEmulation],
	// branch-sdk is a UMD/CommonJS build linked via file:../.. (outside node_modules).
	// In dev, force esbuild to pre-bundle it so `import branch from 'branch-sdk'`
	// gets a proper default export (otherwise it's served raw as ESM with no default).
	optimizeDeps: { include: ['branch-sdk'] },
	build: {
		outDir: resolve(__dirname, 'dist'),
		emptyOutDir: true,
		// branch-sdk resolves (via file:../..) to dist/build.min.js, a UMD/CommonJS
		// bundle living OUTSIDE node_modules, so it escapes the commonjs plugin's
		// default node_modules-only filter. Include it explicitly so a static
		// `import branch from 'branch-sdk'` finds the default export at build time.
		commonjsOptions: {
			include: [/build\.min\.js$/, /node_modules/],
			transformMixedEsModules: true,
			requireReturnsDefault: 'auto'
		},
		rollupOptions: {
			input: {
				landing: resolve(__dirname, 'landing.html'),
				scriptTag: resolve(__dirname, 'script-tag/test-script-tag.html'),
				npmImport: resolve(__dirname, 'npm-import/test-npm-import.html')
			}
		}
	},
	server: { port: 4317, open: '/landing.html' },
	preview: { port: 4317 }
});
