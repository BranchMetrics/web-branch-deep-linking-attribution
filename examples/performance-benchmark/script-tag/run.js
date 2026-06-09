// Driver for the <script>-tag page. Waits for the injected SDK to attach the
// global `branch`, then runs the shared harness. Manual path (?auto=1) self-
// reloads; runner path (?auto=0) measures one load for Playwright to orchestrate.

import { measureLoad, runSeries, qp, renderResult, resetSeries } from '../shared/harness.js';

const KEY = qp('key', 'key_live_hshD4wiPK2sSxfkZqkH30ggmyBfmGmD7');
const ITERATIONS = parseInt(qp('iterations', '20'), 10);
const AUTO = qp('auto', '1') === '1';
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');

document.getElementById('controls').innerHTML =
	`<button id="rerun">Re-run series</button> ` +
	`<span class="meta">key=${KEY.slice(0, 12)}… · iterations=${ITERATIONS} · src=${window.__SDK_SRC__}</span>`;
document.getElementById('rerun').onclick = () => {
	resetSeries();
	location.href = location.pathname + `?auto=1&iterations=${ITERATIONS}&key=${encodeURIComponent(KEY)}`;
};

function waitForBranch(timeoutMs) {
	return new Promise((resolve, reject) => {
		const t0 = Date.now();
		(function poll() {
			if (window.branch && typeof window.branch.init === 'function') return resolve(window.branch);
			if (Date.now() - t0 > timeoutMs) return reject(new Error('branch global never appeared'));
			setTimeout(poll, 30);
		})();
	});
}

const measureFn = async () => {
	const branch = await waitForBranch(10000);
	return measureLoad({ branch, key: KEY, method: 'script-tag', sdkAssetMatch: window.__SDK_MATCH__ });
};

(async function main() {
	try {
		if (AUTO) {
			const running = await runSeries(
				measureFn,
				ITERATIONS,
				(done, total) => {
					statusEl.textContent = `Running load ${done}/${total}… (page reloads between loads)`;
				},
				(samples, agg) => {
					statusEl.textContent = `Done — ${samples.length} loads.`;
					renderResult(resultEl, '<script> tag (CDN) delivery', samples, agg, `src=${window.__SDK_SRC__}`);
				}
			);
			if (running) statusEl.textContent = statusEl.textContent || 'Reloading…';
		} else {
			const sample = await measureFn();
			window.__BENCH_SAMPLE__ = sample;
			window.__BENCH_DONE__ = true;
			statusEl.textContent = 'Single load measured (runner mode).';
			resultEl.innerHTML = `<pre>${JSON.stringify(sample, null, 2)}</pre>`;
		}
	} catch (e) {
		statusEl.textContent = 'Error: ' + e.message;
		window.__BENCH_ERROR__ = e.message;
	}
})();
