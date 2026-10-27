import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { runHookForAllPackages, runHookForAppPackages } from './hooks';

const { ran } = vi.hoisted(() => ({ ran: [] as string[] }));

vi.mock('./runCommand', () => ({
  nextPrefixColor: () => '',
  runCommand: vi.fn(),
  runCommandPrefixed: vi.fn(async (label: string) => {
    ran.push(label);
  }),
}));

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-cli-hooks-'));

const writePackage = (dir: string, pkg: Record<string, unknown>) => {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.writeFileSync(path.join(root, dir, 'package.json'), JSON.stringify(pkg));
};

const build = { build: 'tsc -b' };

writePackage('.', { workspaces: ['docs', 'apps/*/packages/*'] });
writePackage('docs', { name: 'docs', scripts: build });
writePackage('apps/alpha', { name: 'alpha-app' });
writePackage('apps/alpha/packages/core', { name: '@alpha/core', scripts: build, dependencies: { '@beta/shared': '*' } });
writePackage('apps/beta', { name: 'beta-app', scripts: build });
writePackage('apps/beta/packages/shared', { name: '@beta/shared', scripts: build, dependencies: { '@beta/base': '*' } });
writePackage('apps/beta/packages/base', { name: '@beta/base', scripts: build });
writePackage('apps/beta/packages/other', { name: '@beta/other', scripts: build });
fs.mkdirSync(path.join(root, 'apps/alpha/services'), { recursive: true });
fs.mkdirSync(path.join(root, 'apps/beta/services'), { recursive: true });

beforeEach(() => {
  ran.length = 0;
  vi.spyOn(process, 'cwd').mockReturnValue(root);
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('runHookForAppPackages', () => {
  it("skips other apps' packages but keeps shared ones and everything the app depends on, deps first", async () => {
    const failures = await runHookForAppPackages('build', 'alpha', 1);

    expect(failures).toEqual([]);
    expect([...ran].sort()).toEqual(['@alpha/core', '@beta/base', '@beta/shared', 'docs']);
    expect(ran.indexOf('@beta/base')).toBeLessThan(ran.indexOf('@beta/shared'));
    expect(ran.indexOf('@beta/shared')).toBeLessThan(ran.indexOf('@alpha/core'));
  });
});

describe('runHookForAllPackages', () => {
  it('runs every app and workspace package that defines the hook', async () => {
    await runHookForAllPackages('build', 1);

    expect([...ran].sort()).toEqual(['@alpha/core', '@beta/base', '@beta/other', '@beta/shared', 'beta-app', 'docs']);
  });
});
