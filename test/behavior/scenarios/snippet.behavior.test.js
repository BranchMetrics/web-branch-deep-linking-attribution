import { readFileSync } from 'node:fs';
import { KEY } from '../fixtures.js';
import { createPage, snap } from '../harness.js';

// The script-tag loader from the README's Installation section (same
// extraction as test/bundle-contract.js).
const README_SNIPPET = readFileSync('README.md', 'utf8')
  .split('```html\n<script>\n')[1]
  .split('\n\n  branch.init')[0];

describe('behavior: snippet', () => {
  it('replays calls queued by the loader snippet', async () => {
    const p = createPage({
      before(w, { cb, push }) {
        // The snippet inserts the SDK before the first script on the page.
        w.document.head.appendChild(w.document.createElement('script'));
        w.eval(README_SNIPPET);
        w.branch.init(KEY, cb('init'));
        w.branch.track('pageview', {}, cb('track'));
        w.branch.setIdentity('user-1', cb('setIdentity'));
        push({ queued: w.branch._q.length });
      },
    });
    p.record('queueAfterLoad', () => p.branch._q);
    await snap('snippet/queued-calls-replay', p);
  });

  it('registers with AMD and CommonJS loaders', async () => {
    let amd = null;
    const p = createPage({
      before(w) {
        w.define = (id, factory) => {
          amd = { id, value: factory() };
        };
        w.define.amd = {};
        w.module = { exports: {} };
        w.exports = w.module.exports;
      },
    });
    p.record('amd', () => ({
      id: amd?.id ?? null,
      isWindowBranch: amd?.value === p.win.branch,
    }));
    p.record('cjs', () => ({
      isWindowBranch: p.win.module.exports === p.win.branch,
    }));
    p.branch.init(KEY, p.cb('init'));
    await snap('snippet/amd-and-cjs', p);
  });
});
