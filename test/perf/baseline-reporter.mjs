export default class BaselineReporter {
  measured = new Map();

  onTestEnd(test, result) {
    const cls = [...(result.annotations ?? []), ...test.annotations].find(
      (a) => a.type === 'cls',
    );
    if (!cls) return;
    const key = `${test.parent.project().name} | ${test.title}`;
    if (!this.measured.has(key)) this.measured.set(key, []);
    this.measured.get(key).push(Number(cls.description));
  }

  onEnd() {
    const rows = [...this.measured].sort(([a], [b]) => a.localeCompare(b));
    const width = Math.max(...rows.map(([key]) => key.length));
    console.log('\nCLS measured (min-max over n loads):');
    for (const [key, values] of rows) {
      const min = Math.min(...values).toFixed(3);
      const max = Math.max(...values).toFixed(3);
      const range = min === max ? min : `${min}-${max}`;
      console.log(`  ${key.padEnd(width)}  ${range}  (n=${values.length})`);
    }
  }
}
