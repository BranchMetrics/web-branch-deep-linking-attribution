import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const SCRIPT = resolve('scripts/check-cycles.mjs');

function run(files) {
  const dir = mkdtempSync(join(tmpdir(), 'check-cycles-'));
  try {
    for (const [path, body] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), body);
    }
    try {
      execFileSync(process.execPath, [SCRIPT], { cwd: dir, stdio: 'pipe' });
      return { code: 0, stderr: '' };
    } catch (e) {
      return { code: e.status, stderr: String(e.stderr) };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('scripts/check-cycles renderer boundary', () => {
  it('allows renderer modules to import each other', () => {
    const result = run({
      'src/journeys/v2/renderer/a.ts':
        "import { b } from './b.js';\nexport const a = b;\n",
      'src/journeys/v2/renderer/b.ts': 'export const b = 1;\n',
    });
    expect(result.code).toBe(0);
  });

  it('rejects a renderer import from outside renderer/, including lib and config', () => {
    for (const target of [
      'src/core/config.js',
      'src/lib/x.ts',
      'src/journeys/v2/payload.ts',
    ]) {
      const spec = `${'../'.repeat(3)}${target.replace(/^src\//, '')}`.replace(
        /\.ts$/,
        '.js',
      );
      const result = run({
        'src/journeys/v2/renderer/a.ts': `import { x } from '${spec}';\nexport const a = x;\n`,
        [target]: 'export const x = 1;\n',
      });
      expect(result.code).toBe(1);
      expect(result.stderr).toContain(
        'layer violation: src/journeys/v2/renderer/a.ts',
      );
    }
  });

  it('lets code outside the renderer import its entry, renderer/index.ts', () => {
    const result = run({
      'src/journeys/v2/journey.ts':
        "import { r } from './renderer/index.js';\nexport const j = r;\n",
      'src/journeys/v2/renderer/index.ts': 'export const r = 1;\n',
    });
    expect(result.code).toBe(0);
  });

  it('rejects imports of renderer internals from outside it, type-only ones too', () => {
    for (const statement of [
      "import { r } from './renderer/r.js';\nexport const j = r;\n",
      "import type { R } from './renderer/r.js';\nexport const j = 1;\n",
    ]) {
      const result = run({
        'src/journeys/v2/journey.ts': statement,
        'src/journeys/v2/renderer/r.ts':
          'export const r = 1;\nexport type R = number;\n',
      });
      expect(result.code).toBe(1);
      expect(result.stderr).toContain(
        'layer violation: src/journeys/v2/journey.ts -> src/journeys/v2/renderer/r.ts',
      );
    }
  });

  it('rejects a type-only import from the renderer to outside it', () => {
    const result = run({
      'src/journeys/v2/renderer/a.ts':
        "import type { P } from '../payload.js';\nexport const a = 1;\n",
      'src/journeys/v2/payload.ts': 'export type P = number;\n',
    });
    expect(result.code).toBe(1);
  });
});

describe('scripts/check-cycles lib and env layers', () => {
  it('rejects lib importing the renderer, even its entry', () => {
    const result = run({
      'src/lib/a.ts':
        "import { r } from '../journeys/v2/renderer/index.js';\nexport const a = r;\n",
      'src/journeys/v2/renderer/index.ts': 'export const r = 1;\n',
    });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain(
      'layer violation: src/lib/a.ts -> src/journeys/v2/renderer/index.ts',
    );
  });

  it('rejects env importing outside lib and env, but not type-only', () => {
    const files = {
      'src/core/x.ts': 'export const x = 1;\nexport type X = number;\n',
    };
    expect(
      run({
        ...files,
        'src/env/a.ts':
          "import { x } from '../core/x.js';\nexport const a = x;\n",
      }).code,
    ).toBe(1);
    expect(
      run({
        ...files,
        'src/env/a.ts':
          "import type { X } from '../core/x.js';\nexport const a = 1;\n",
      }).code,
    ).toBe(0);
  });
});
