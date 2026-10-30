import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createUserScriptProject } from './userScriptTemplate';

const ownVersion = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')).version as string;

let tempRoot: string;

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-script-new-'));
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe('createUserScriptProject', () => {
  it('writes the template with the package named after the directory and core pinned to this version', () => {
    const target = path.join(tempRoot, 'my-report');

    const written = createUserScriptProject(target);

    expect(written).toEqual(['.gitignore', 'README.md', 'package.json', 'src/main.ts', 'tsconfig.json']);
    const packageJson = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
    expect(packageJson.name).toBe('my-report');
    expect(packageJson.dependencies['@qpqjs/core']).toBe(ownVersion);
    expect(fs.readFileSync(path.join(target, 'README.md'), 'utf8')).toContain('# my-report');
    expect(fs.readFileSync(path.join(target, 'src/main.ts'), 'utf8')).toContain('export function* stampedGreeting');
  });

  it('refuses a directory that already has files in it', () => {
    const target = path.join(tempRoot, 'taken');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'existing.txt'), 'x');

    expect(() => createUserScriptProject(target)).toThrow('is not empty');
  });
});
