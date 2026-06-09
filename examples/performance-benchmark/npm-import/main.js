// Driver for the npm-import page — the HEADLINE npm arm. Uses a STATIC
// `import branch from 'branch-sdk'`, so the bundler inlines the SDK into this
// entry chunk (no separate request, no code-split round-trip). This is the
// integration layout we recommend; it is the fair counterpart to the <script>
// tag. (The code-split / lazy `await import()` variant — which costs an extra
// round-trip — is documented as a caveat in docs/npm-vs-script-tag-performance.md;
// reproduce it by swapping this static import for `await import('branch-sdk')`.)

import branchDefault from 'branch-sdk';
import { measureLoad, runSeries, qp, renderResult, resetSeries } from '../shared/harness.js';

// UMD/closure interop: the default export is the branch instance under most
// bundlers; fall back to named/global shapes just in case.
const branch =
	branchDefault && typeof branchDefault.init === 'function'
		? branchDefault
		: branchDefault.default || branchDefault.branch || window.branch;

const KEY = qp('key', 'key_live_hshD4wiPK2sSxfkZqkH30ggmyBfmGmD7');
const ITERATIONS = parseInt(qp('iterations', '20'), 10);
const AUTO = qp('auto', '1') === '1';
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');

document.getElementById('controls').innerHTML =
	`<button id="rerun">Re-run series</button> ` +
	`<span class="meta">key=${KEY.slice(0, 12)}… · iterations=${ITERATIONS} · static import 'branch-sdk' (inline)</span>`;
document.getElementById('rerun').onclick = () => {
	resetSeries();
	location.href = location.pathname + `?auto=1&iterations=${ITERATIONS}&key=${encodeURIComponent(KEY)}`;
};

const measureFn = () =>
	measureLoad({
		branch,
		key: KEY,
		method: 'npm-import',
		sdkAssetMatch: 'branch-sdk',
		fallbackLargestScript: true // SDK is inlined into the largest same-origin chunk
	});

(async function main() {
	try {
		if (!branch || typeof branch.init !== 'function') throw new Error("could not resolve branch from 'branch-sdk'");
		if (AUTO) {
			const running = await runSeries(
				measureFn,
				ITERATIONS,
				(done, total) => {
					statusEl.textContent = `Running load ${done}/${total}… (page reloads between loads)`;
				},
				(samples, agg) => {
					statusEl.textContent = `Done — ${samples.length} loads.`;
					renderResult(resultEl, 'npm import (static / inline) delivery', samples, agg, "static import 'branch-sdk'");
				}
			);
			if (running) statusEl.textContent = statusEl.textContent || 'Reloading…';
		} else {
			window.__BENCH_SAMPLE__ = await measureFn();
			window.__BENCH_DONE__ = true;
			statusEl.textContent = 'Single load measured (runner mode).';
			resultEl.innerHTML = `<pre>${JSON.stringify(window.__BENCH_SAMPLE__, null, 2)}</pre>`;
		}
	} catch (e) {
		statusEl.textContent = 'Error: ' + e.message;
		window.__BENCH_ERROR__ = e.message;
	}
})();
