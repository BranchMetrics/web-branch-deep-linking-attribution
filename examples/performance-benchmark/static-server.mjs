// Tiny zero-dependency static file server for the built `dist/` output. Used by
// runner.mjs instead of `vite preview` so the automated path has no dependency
// on Vite's preview server (more portable, and avoids sandbox/TTY quirks). It
// sets CDN-like Cache-Control headers on the SDK + hashed assets so the cache
// hit rate across reloads is measurable, and no-cache on HTML.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

// Compress text assets like a real CDN does, so Resource Timing's
// encodedBodySize reflects realistic over-the-wire (gzip) bytes rather than the
// raw file size. Gzipped buffers are memoised per path.
const GZIPPABLE = new Set(['.js', '.mjs', '.css', '.html', '.json', '.map', '.svg']);
const gzCache = new Map();

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon'
};

function cacheControl(pathname) {
	if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
	if (pathname.endsWith('branch-sdk-cdn.min.js')) return 'public, max-age=31536000'; // emulate CDN edge cache
	if (pathname.endsWith('.html') || pathname === '/') return 'no-cache';
	return 'no-cache';
}

export function startStaticServer(rootDir, port) {
	const server = createServer(async (req, res) => {
		try {
			let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
			if (pathname === '/') pathname = '/landing.html';
			// Prevent path traversal.
			const filePath = join(rootDir, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
			if (!filePath.startsWith(rootDir)) {
				res.writeHead(403).end('Forbidden');
				return;
			}
			const info = await stat(filePath).catch(() => null);
			if (!info || !info.isFile()) {
				res.writeHead(404).end('Not found');
				return;
			}
			const raw = await readFile(filePath);
			const ext = extname(filePath);
			const headers = {
				'Content-Type': MIME[ext] || 'application/octet-stream',
				'Cache-Control': cacheControl(pathname)
			};
			const wantsGzip = (req.headers['accept-encoding'] || '').includes('gzip');
			if (wantsGzip && GZIPPABLE.has(ext) && raw.length > 256) {
				let gz = gzCache.get(filePath);
				if (!gz) {
					gz = gzipSync(raw, { level: 9 });
					gzCache.set(filePath, gz);
				}
				headers['Content-Encoding'] = 'gzip';
				headers['Content-Length'] = gz.length;
				res.writeHead(200, headers);
				res.end(gz);
			} else {
				headers['Content-Length'] = raw.length;
				res.writeHead(200, headers);
				res.end(raw);
			}
		} catch (e) {
			res.writeHead(500).end(String(e));
		}
	});
	return new Promise((resolve) => {
		server.listen(port, '127.0.0.1', () => resolve(server));
	});
}
