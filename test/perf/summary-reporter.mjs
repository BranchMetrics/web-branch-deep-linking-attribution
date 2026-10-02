// CLS values only: the job summary is public.
import { appendFileSync } from 'node:fs';

export default class SummaryReporter {
  rows = [];

  onTestEnd(test, result) {
    const find = (type) =>
      [...(result.annotations ?? []), ...test.annotations].find(
        (a) => a.type === type,
      )?.description;
    const cls = find('cls');
    this.rows.push(
      `| ${test.parent.project().name} | ${test.title} | ` +
        `${cls === undefined ? '-' : Number(cls).toFixed(3)} | ` +
        `${find('allowed') ?? '-'} | ${result.status === 'passed' ? '✅' : '❌'} |`,
    );
  }

  onEnd() {
    const file = process.env.GITHUB_STEP_SUMMARY;
    if (!file || !this.rows.length) return;
    const phase =
      process.env.PERF_PHASE === 'serial' ? 'legacy phone banners' : 'CLS';
    appendFileSync(
      file,
      [
        `### ${phase}`,
        '| Device | Test | CLS | Expected | Result |',
        '|---|---|---|---|---|',
        ...this.rows.sort(),
        '',
      ].join('\n'),
    );
  }
}
