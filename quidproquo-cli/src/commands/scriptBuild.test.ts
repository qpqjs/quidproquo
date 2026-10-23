import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createUserScriptProject } from '../lib/userScriptTemplate';
import { scriptBuildCommand } from './scriptBuild';

let tempRoot: string;
let logged: string[];

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-script-build-'));
  logged = [];
  vi.spyOn(console, 'log').mockImplementation((line: string) => {
    logged.push(String(line));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe('scriptBuildCommand', () => {
  // The template builds without `npm install`: its only import is external and the
  // build does not type check. That is the promise the template README makes.
  it('builds a freshly written template project with no install', async () => {
    const project = path.join(tempRoot, 'fresh');
    createUserScriptProject(project);

    await scriptBuildCommand([project]);

    expect(fs.readdirSync(path.join(project, 'dist'))).toEqual(['main.js']);
    expect(fs.readFileSync(path.join(project, 'dist', 'main.js'), 'utf8')).not.toContain('sourceMappingURL');
    expect(logged.join('\n')).toContain('exports: add, greet');
  }, 60_000);

  it('embeds the source map in main.js with --source-map, still writing one file', async () => {
    const project = path.join(tempRoot, 'mapped');
    createUserScriptProject(project);

    await scriptBuildCommand([project, '--source-map']);

    expect(fs.readdirSync(path.join(project, 'dist'))).toEqual(['main.js']);
    expect(fs.readFileSync(path.join(project, 'dist', 'main.js'), 'utf8')).toContain('//# sourceMappingURL=data:application/json');
  }, 60_000);

  it('honours --out', async () => {
    const project = path.join(tempRoot, 'elsewhere');
    createUserScriptProject(project);
    const outDir = path.join(tempRoot, 'published', 'my-script');

    await scriptBuildCommand([project, '--out', outDir]);

    expect(fs.existsSync(path.join(outDir, 'main.js'))).toBe(true);
    expect(fs.existsSync(path.join(project, 'dist'))).toBe(false);
  }, 60_000);
});
