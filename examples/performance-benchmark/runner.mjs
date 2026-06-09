// Automated benchmark driver. Builds the multi-page app, serves dist/ via a
// tiny built-in static server, then uses Playwright (Chromium) to run each method
// for N iterations under both a normal and a throttled ("Slow 4G") network
// profile, with a cold-cache first load followed by warm reloads. Aggregates
// with the shared stats module and writes results/latest.json.
//
// Usage:  node runner.mjs [--headed] [--iterations 20] [--key key_live_xxx]
// Prereq: deps installed (`npm install`) and the SDK built (`npm run sync-sdk`
//         runs as part of `npm run bench`). Branch API must be reachable for the
//         init/total timings; size/parse/cache metrics work offline.

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { aggregateSamples, summarize } from './shared/stats.js';
import { startStaticServer } from './static-server.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name, def) => {
	const i = args.indexOf(name);
	return i !== -1 && args[i + 1] ? args[i + 1] : def;
};
const HEADED = args.includes('--headed');
const ITERATIONS = parseInt(flag('--iterations', '20'), 10);
const KEY = flag('--key', 'key_live_hshD4wiPK2sSxfkZqkH30ggmyBfmGmD7');
const PORT = 4317;
const BASE = `http://localhost:${PORT}`;

const PAGES = [
	{ method: 'script-tag', url: `${BASE}/script-tag/test-script-tag.html` },
	{ method: 'npm-import', url: `${BASE}/npm-import/test-npm-import.html` }
];
// Slow 4G-ish: ~1.6 Mbps down, 150ms RTT — mirrors the DevTools preset used in
// the EMT-3753 harness notes.
const PROFILES = {
	normal: null,
	throttled: {
		offline: false,
		downloadThroughput: (1.6 * 1024 * 1024) / 8,
		uploadThroughput: (750 * 1024) / 8,
		latency: 150
	}
};

function run(cmd, cmdArgs, opts = {}) {
	return spawn(cmd, cmdArgs, { cwd: here, stdio: 'inherit', shell: process.platform === 'win32', ...opts });
}

async function waitForServer(url, timeoutMs = 30000) {
	const t0 = Date.now();
	while (Date.now() - t0 < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.ok) return true;
		} catch (e) {
			/* not up yet */
		}
		await new Promise((r) => setTimeout(r, 400));
	}
	throw new Error(`server at ${url} did not start within ${timeoutMs}ms`);
}

async function newTab(browser, profile) {
	const context = await browser.newContext();
	const tab = await context.newPage();
	const cdp = await context.newCDPSession(tab).catch(() => null);
	if (cdp && profile) {
		await cdp.send('Network.enable');
		await cdp.send('Network.emulateNetworkConditions', profile);
	}
	return { context, tab };
}

async function measureOne(tab, target) {
	await tab.waitForFunction(() => window.__BENCH_DONE__ === true || window.__BENCH_ERROR__, null, { timeout: 30000 });
	const sample = await tab.evaluate(() => window.__BENCH_SAMPLE__ || null);
	await tab.evaluate(() => {
		window.__BENCH_DONE__ = false;
		window.__BENCH_SAMPLE__ = null;
	});
	return sample;
}

const TIMING_KEYS = ['init_callback_ms', 'total_init_ms', 'sdk_parse_ms', 'fcp_ms', 'sdk_encoded_bytes', 'sdk_decoded_bytes'];

function summarizeTimings(samples) {
	const out = { n: samples.length };
	for (const k of TIMING_KEYS) out[k] = summarize(samples.map((s) => s[k]));
	return out;
}

// COLD suite: a fresh browser context per iteration => fresh HTTP cache AND fresh
// Branch session, so every sample is a true cold init (the scenario where the
// delivery method actually matters). Cache hit rate is 0 here by construction.
async function measureCold(browser, page, profileName, profile) {
	const target = `${page.url}?auto=0&key=${encodeURIComponent(KEY)}`;
	const samples = [];
	let failures = 0;
	for (let i = 0; i < ITERATIONS; i++) {
		const { context, tab } = await newTab(browser, profile);
		try {
			await tab.goto(target, { waitUntil: 'load' });
			const sample = await measureOne(tab, target);
			if (sample) {
				sample.reloadIndex = 0;
				samples.push(sample);
			}
		} catch (e) {
			failures++; // one flaky live-API load shouldn't abort the whole suite
		} finally {
			await context.close();
		}
		process.stdout.write(`  ${page.method}/${profileName}/cold ${i + 1}/${ITERATIONS}\r`);
	}
	process.stdout.write(failures ? ` (${failures} skipped)\n` : '\n');
	return { samples, failures, summary: summarizeTimings(samples) };
}

// WARM suite: one context, first load cold then ITERATIONS-1 reloads. Captures the
// cache hit rate across reloads and the warm (session-cached) init timing.
async function measureWarm(browser, page, profileName, profile) {
	const target = `${page.url}?auto=0&key=${encodeURIComponent(KEY)}`;
	const { context, tab } = await newTab(browser, profile);
	const samples = [];
	let failures = 0;
	for (let i = 0; i < ITERATIONS; i++) {
		try {
			if (i === 0) await tab.goto(target, { waitUntil: 'load' });
			else await tab.reload({ waitUntil: 'load' });
			const sample = await measureOne(tab, target);
			if (sample) {
				sample.reloadIndex = i;
				samples.push(sample);
			}
		} catch (e) {
			failures++; // skip the flaky reload; the warm context survives for the next
		}
		process.stdout.write(`  ${page.method}/${profileName}/warm ${i + 1}/${ITERATIONS}\r`);
	}
	process.stdout.write(failures ? ` (${failures} skipped)\n` : '\n');
	await context.close();
	const warmOnly = samples.filter((s) => s.reloadIndex > 0);
	return {
		samples,
		failures,
		summary: summarizeTimings(warmOnly),
		cache_hit_rate: aggregateSamples(samples).cache_hit_rate
	};
}

async function measurePageProfile(browser, page, profileName, profile) {
	const cold = await measureCold(browser, page, profileName, profile);
	const warm = await measureWarm(browser, page, profileName, profile);
	return { cold, warm };
}

async function main() {
	// 1. Build (sync-sdk already ran via npm script). Use the local vite binary.
	const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
	await new Promise((resolve, reject) => {
		const b = run(npx, ['vite', 'build']);
		b.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('vite build failed'))));
	});

	// 2. Serve the built output with a zero-dependency static server (more
	// portable than `vite preview`, and sets CDN-like cache headers).
	const server = await startStaticServer(join(here, 'dist'), PORT);
	let playwright;
	try {
		await waitForServer(`${BASE}/landing.html`);

		// 3. Drive.
		const { chromium } = await import('playwright');
		playwright = await chromium.launch({ headless: !HEADED });
		const results = { generated: new Date().toISOString(), iterations: ITERATIONS, key: 'demo key', methods: {} };
		for (const page of PAGES) {
			results.methods[page.method] = {};
			for (const [profileName, profile] of Object.entries(PROFILES)) {
				console.log(`\n▶ ${page.method} · ${profileName}`);
				results.methods[page.method][profileName] = await measurePageProfile(
					playwright,
					page,
					profileName,
					profile
				);
			}
		}

		mkdirSync(join(here, 'results'), { recursive: true });
		const out = join(here, 'results', 'latest.json');
		writeFileSync(out, JSON.stringify(results, null, 2));
		console.log(`\n✓ wrote ${out}`);
		printSummary(results);
	} finally {
		if (playwright) await playwright.close();
		server.close();
	}
}

function printSummary(results) {
	for (const profile of ['normal', 'throttled']) {
		console.log(`\n=== SUMMARY (${profile}) — init_callback_ms ===`);
		for (const method of Object.keys(results.methods)) {
			const p = results.methods[method][profile];
			const cold = p.cold.summary.init_callback_ms || {};
			const warm = p.warm.summary.init_callback_ms || {};
			const wire = (p.cold.summary.sdk_encoded_bytes || {}).median;
			const fcp = (p.cold.summary.fcp_ms || {}).median;
			const chr = p.warm.cache_hit_rate || {};
			if (!cold.n) {
				console.log(`${method.padEnd(16)} (no samples — live API unreachable?)`);
				continue;
			}
			console.log(
				`${method.padEnd(16)} cold mean=${cold.mean}ms p95=${cold.p95}ms · warm mean=${warm.mean}ms · fcp=${fcp}ms · wire=${wire}B · cacheHit=${
					chr.rate === null ? 'n/a' : Math.round(chr.rate * 100) + '%'
				}`
			);
		}
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
