// scripts/check-cycles.mjs
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|ts)$/.test(p) && !p.endsWith('.d.ts')) files.push(p);
  }
})('src');
const resolve = (from, spec) => {
  if (!spec.startsWith('.')) return null;
  const p = join(dirname(from), spec);
  for (const c of [
    p,
    p.replace(/\.js$/, '.ts'),
    `${p}.js`,
    `${p}.ts`,
    join(p, 'index.js'),
    join(p, 'index.ts'),
  ]) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
};
const graph = {};
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  graph[f] = [];
  const re = /^\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gms;
  for (const m of src.matchAll(re)) {
    const r = resolve(f, m[1] || m[2]);
    if (r) graph[f].push(r);
  }
}
let i = 0;
const idx = {}, low = {}, stack = [], on = {}, sccs = [];
function visit(v) {
  idx[v] = low[v] = i++; stack.push(v); on[v] = true;
  for (const w of graph[v]) {
    if (idx[w] === undefined) { visit(w); low[v] = Math.min(low[v], low[w]); }
    else if (on[w]) low[v] = Math.min(low[v], idx[w]);
  }
  if (low[v] === idx[v]) {
    const c = []; let w;
    do { w = stack.pop(); on[w] = false; c.push(w); } while (w !== v);
    if (c.length > 1) sccs.push(c);
  }
}
for (const f of files) if (idx[f] === undefined) visit(f);
for (const c of sccs) console.error('import cycle:\n  ' + c.sort().join('\n  '));

// Layer boundaries:
//   src/lib/**  may import only src/lib/**, src/core/config.js, src/core/safejson.js
//   src/env/**  may import only src/lib/**, src/env/**, src/core/config.js, src/core/safejson.js
const ALLOWED_EXTRA = new Set([
  join('src', 'core', 'config.js'),
  join('src', 'core', 'safejson.js'),
]);
const inDir = (p, dir) => p === dir || p.startsWith(dir + sep);
const layerViolations = [];
for (const f of files) {
  const isLib = inDir(f, join('src', 'lib'));
  const isEnv = inDir(f, join('src', 'env'));
  if (!isLib && !isEnv) continue;
  for (const dep of graph[f]) {
    if (ALLOWED_EXTRA.has(dep)) continue;
    if (isLib && inDir(dep, join('src', 'lib'))) continue;
    if (isEnv && (inDir(dep, join('src', 'lib')) || inDir(dep, join('src', 'env')))) continue;
    layerViolations.push(`${f} -> ${dep}`);
  }
}
for (const v of layerViolations) {
  console.error(
    `layer violation: ${v}\n  src/lib/** may import only src/lib/**, src/core/config.js and src/core/safejson.js\n  src/env/** may import only src/lib/**, src/env/**, src/core/config.js and src/core/safejson.js`,
  );
}

process.exit(sccs.length || layerViolations.length ? 1 : 0);
