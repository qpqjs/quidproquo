import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const templateRoot = path.resolve(__dirname, '..', '..', 'template');

const walk = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? [full, ...walk(full)] : [full];
  });

// Security regression: the scaffold ships no local state or credentials and, once the dotless gitignore is
// restored, a new app ignores env files, dev secrets and keys, and CDK output from its first commit.
describe('create-qpq-app template contents', () => {
  const entries = walk(templateRoot).map((full) => path.relative(templateRoot, full));
  const baseNames = entries.map((entry) => path.basename(entry));

  it('ships no env files, dependency trees, runtime state or cdk output', () => {
    expect(baseNames.filter((name) => name.startsWith('.env'))).toEqual([]);
    expect(baseNames.filter((name) => ['node_modules', '.qpq-runtime', 'cdk.out', 'cdk.context.json', 'dist'].includes(name))).toEqual([]);
  });

  it('stores every gitignore dotless so npm keeps it in the tarball', () => {
    expect(baseNames.filter((name) => name === '.gitignore')).toEqual([]);
    expect(baseNames.includes('gitignore')).toBe(true);
  });

  it('ignores env files, dev runtime state and cdk output in the root gitignore', () => {
    const lines = fs
      .readFileSync(path.join(templateRoot, 'gitignore'), 'utf8')
      .split('\n')
      .map((line) => line.trim());

    for (const required of ['.env', '.qpq-runtime/', 'cdk.out/', 'node_modules/']) {
      expect(lines).toContain(required);
    }
  });
});
