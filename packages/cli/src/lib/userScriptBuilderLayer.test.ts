import { JavascriptRuntimeArchitecture } from 'quidproquo-core';

import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildUserScriptBuilderLayer, getBuilderLayerInstallArgs } from './userScriptBuilderLayer';

let tempRoot: string;

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-builder-layer-'));
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe('getBuilderLayerInstallArgs', () => {
  it('installs rspack for linux arm64 into the layer nodejs directory without touching a lockfile', () => {
    expect(getBuilderLayerInstallArgs({ outDir: '/layer', architecture: JavascriptRuntimeArchitecture.Arm64, rspackVersion: '2.1.5' })).toEqual([
      'install',
      '--prefix',
      '/layer/nodejs',
      '--os=linux',
      '--cpu=arm64',
      '--libc=glibc',
      '--omit=dev',
      '--no-save',
      '--no-package-lock',
      '--no-audit',
      '--no-fund',
      '@rspack/core@2.1.5',
    ]);
  });

  it('maps x86_64 to the npm cpu name x64', () => {
    expect(getBuilderLayerInstallArgs({ outDir: '/layer', architecture: JavascriptRuntimeArchitecture.X86_64, rspackVersion: '2.1.5' })).toContain('--cpu=x64');
  });
});

describe('buildUserScriptBuilderLayer', () => {
  const options = { outDir: '', architecture: JavascriptRuntimeArchitecture.Arm64, rspackVersion: '2.1.5' };

  // Stands in for npm by creating what a successful install leaves behind.
  const fakeInstall = (args: string[]) => {
    const nodeDir = args[args.indexOf('--prefix') + 1];
    for (const name of ['@rspack/core', '@rspack/binding', '@rspack/binding-linux-arm64-gnu']) {
      fs.mkdirSync(path.join(nodeDir, 'node_modules', name), { recursive: true });
    }
  };

  it('refuses an npm older than 9', () => {
    const run = () => buildUserScriptBuilderLayer({ ...options, outDir: path.join(tempRoot, 'layer') }, { getNpmVersion: () => '8.19.4', runNpm: fakeInstall });

    expect(run).toThrow('needs npm 9 or later');
  });

  it('empties the directory, writes the layer package.json, installs, and verifies the binding', () => {
    const outDir = path.join(tempRoot, 'layer');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'stale.txt'), 'old');
    const seen: string[][] = [];

    const nodeDir = buildUserScriptBuilderLayer({ ...options, outDir }, { getNpmVersion: () => '11.0.0', runNpm: (args) => { seen.push(args); fakeInstall(args); } });

    expect(nodeDir).toBe(path.join(outDir, 'nodejs'));
    expect(fs.existsSync(path.join(outDir, 'stale.txt'))).toBe(false);
    expect(JSON.parse(fs.readFileSync(path.join(nodeDir, 'package.json'), 'utf8'))).toEqual({ name: 'user-script-builder-layer', private: true });
    expect(seen).toEqual([getBuilderLayerInstallArgs({ ...options, outDir })]);
  });

  it('fails when the install leaves no linux binding behind', () => {
    const run = () =>
      buildUserScriptBuilderLayer({ ...options, outDir: path.join(tempRoot, 'layer') }, { getNpmVersion: () => '11.0.0', runNpm: () => {} });

    expect(run).toThrow('expected the rspack binding at');
  });
});
