import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
let status = 0;
for (const phase of ['parallel', 'serial']) {
  const run = spawnSync(
    'playwright',
    ['test', '--pass-with-no-tests', ...args],
    { stdio: 'inherit', env: { ...process.env, PERF_PHASE: phase } },
  );
  if (run.error) console.error(run.error);
  status ||= run.status ?? 1;
}
process.exit(status);
