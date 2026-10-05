// scripts/check-cycles.mjs
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

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
process.exit(sccs.length ? 1 : 0);
