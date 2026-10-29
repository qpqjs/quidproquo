import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

// The template is snapshotted from quidproquojs.com at prepack and is not committed, so the probe checks
// the two inputs that decide what a scaffold ships: the snapshot script's exclusion lists and the root
// gitignore that is copied (dotless) into every new app.
const packageRoot = path.resolve(__dirname, '..', '..');
const snapshotScript = fs.readFileSync(path.join(packageRoot, 'scripts', 'snapshotTemplate.mjs'), 'utf8');
const sourceGitignore = fs
  .readFileSync(path.resolve(packageRoot, '..', '..', 'quidproquojs.com', '.gitignore'), 'utf8')
  .split('\n')
  .map((line) => line.trim());

const excludedDirNames = /EXCLUDED_DIR_NAMES = new Set\(\[([^\]]*)\]/.exec(snapshotScript)?.[1] ?? '';
const excludedFileNames = /EXCLUDED_FILE_NAMES = new Set\(\[([^\]]*)\]/.exec(snapshotScript)?.[1] ?? '';

// Security regression: a scaffold must never ship local state, credentials or lockfiles, and a new app
// must ignore env files, dev secrets and keys, and CDK output from its first commit.
describe('create-qpq-app template snapshot rules', () => {
  it.each(['node_modules', 'dist', '.git', 'cdk.out', '.qpq-runtime'])('excludes every %s directory from the snapshot', (name: any) => {
    expect(excludedDirNames).toContain(`'${name}'`);
  });

  it('excludes lockfiles, the cdk context cache and every .env* file from the snapshot', () => {
    expect(excludedFileNames).toContain("'package-lock.json'");
    expect(excludedFileNames).toContain("'cdk.context.json'");
    expect(snapshotScript).toContain("EXCLUDED_FILE_PREFIXES = ['.env']");
  });

  it('stores gitignore files dotless so npm keeps them in the tarball', () => {
    expect(snapshotScript).toContain("entry.name === '.gitignore' ? 'gitignore' : entry.name");
  });

  it('ignores env files, dev runtime state and cdk output in the gitignore a new app receives', () => {
    for (const required of ['.env', '.qpq-runtime/', 'cdk.out/', 'node_modules/']) {
      expect(sourceGitignore).toContain(required);
    }
  });
});
