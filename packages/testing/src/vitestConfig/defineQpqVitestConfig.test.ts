import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

import { defineQpqVitestConfig } from './defineQpqVitestConfig';

const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-vitest-config-'));

const addPackage = (folder: string, name: string, withSource: boolean) => {
  const dir = path.join(workspaceDir, folder);
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name }));
  if (withSource) {
    fs.writeFileSync(path.join(dir, 'src', 'index.ts'), 'export {};');
  }
  return pathToFileURL(path.join(dir, 'vitest.config.ts')).href;
};

const callerUrl = addPackage('caller', '@scope/caller', true);
addPackage('sibling', '@scope/sibling', true);
addPackage('no-source', '@scope/no-source', false);

afterAll(() => fs.rmSync(workspaceDir, { recursive: true, force: true }));

describe('defineQpqVitestConfig', () => {
  it('aliases every sibling with a src entry to its src folder', () => {
    const config = defineQpqVitestConfig(callerUrl);

    expect(config.resolve?.alias).toEqual({
      '@scope/caller': path.join(workspaceDir, 'caller', 'src'),
      '@scope/sibling': path.join(workspaceDir, 'sibling', 'src'),
    });
  });

  it('defaults to node, globals and worker threads', () => {
    expect(defineQpqVitestConfig(callerUrl).test).toEqual({ globals: true, environment: 'node', pool: 'threads' });
  });

  it('merges overrides on top of the defaults', () => {
    const config = defineQpqVitestConfig(callerUrl, { test: { environment: 'jsdom', env: { FLAG: 'off' } } });

    expect(config.test).toEqual({ globals: true, environment: 'jsdom', pool: 'threads', env: { FLAG: 'off' } });
    expect(config.resolve?.alias).toHaveProperty('@scope/sibling');
  });
});
