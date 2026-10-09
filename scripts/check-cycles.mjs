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
// graph: runtime imports, for cycles. typeGraph: type-only imports, which the renderer
// boundary also counts.
const graph = {};
const typeGraph = {};
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  graph[f] = [];
  typeGraph[f] = [];
  const re = /^\s*(?:import|export)\s+(type\s+)?[^;]*?from\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gms;
  for (const m of src.matchAll(re)) {
    const r = resolve(f, m[2] || m[3]);
    if (r) (m[1] ? typeGraph : graph)[f].push(r);
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
//   src/lib/**                   may import only src/lib/**, src/core/config.js, src/core/safejson.js
//   src/env/**                   may import only src/lib/**, src/env/**, src/core/config.js, src/core/safejson.js
//   src/journeys/v2/renderer/**  may import only src/journeys/v2/renderer/**
//   everything else              may import from the renderer only renderer/index.ts
const ALLOWED_EXTRA = new Set([
  join('src', 'core', 'config.js'),
  join('src', 'core', 'safejson.js'),
]);
const LIB = join('src', 'lib');
const ENV = join('src', 'env');
const RENDERER = join('src', 'journeys', 'v2', 'renderer');
const RENDERER_ENTRY = join(RENDERER, 'index.ts');
const inDir = (p, dir) => p === dir || p.startsWith(dir + sep);
const RULES = {
  lib: 'src/lib/** may import only src/lib/**, src/core/config.js and src/core/safejson.js',
  env: 'src/env/** may import only src/lib/**, src/env/**, src/core/config.js and src/core/safejson.js',
  renderer: 'src/journeys/v2/renderer/** may import only src/journeys/v2/renderer/**',
  'renderer-entry':
    'code outside src/journeys/v2/renderer/** may import from it only src/journeys/v2/renderer/index.ts',
};
const layerViolations = [];
const violate = (f, dep, rule) => layerViolations.push({ edge: `${f} -> ${dep}`, rule });
for (const f of files) {
  for (const dep of [...graph[f], ...typeGraph[f]]) {
    if (inDir(f, RENDERER)) {
      if (!inDir(dep, RENDERER)) violate(f, dep, 'renderer');
    } else if (inDir(dep, RENDERER) && dep !== RENDERER_ENTRY) {
      violate(f, dep, 'renderer-entry');
    }
  }
  for (const dep of graph[f]) {
    if (ALLOWED_EXTRA.has(dep) || inDir(dep, LIB)) continue;
    if (inDir(f, LIB)) violate(f, dep, 'lib');
    else if (inDir(f, ENV) && !inDir(dep, ENV)) violate(f, dep, 'env');
  }
}
for (const v of layerViolations) {
  console.error(`layer violation: ${v.edge}\n  ${RULES[v.rule]}`);
}

process.exit(sccs.length || layerViolations.length ? 1 : 0);
