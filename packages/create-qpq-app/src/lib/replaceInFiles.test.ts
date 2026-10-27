import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { replaceInFiles } from './replaceInFiles';

describe('replaceInFiles', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'cqa-replace-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('replaces every occurrence in text files, including nested ones', () => {
    fs.mkdirSync(path.join(root, 'nested'));
    fs.writeFileSync(path.join(root, 'a.ts'), "import '@todo/x'; import '@todo/y';");
    fs.writeFileSync(path.join(root, 'nested', 'b.json'), '{"path": "apps/todo/web"}');

    replaceInFiles(root, [
      ['@todo/', '@myapp/'],
      ['apps/todo/', 'apps/myapp/'],
    ]);

    expect(fs.readFileSync(path.join(root, 'a.ts'), 'utf8')).toBe("import '@myapp/x'; import '@myapp/y';");
    expect(fs.readFileSync(path.join(root, 'nested', 'b.json'), 'utf8')).toBe('{"path": "apps/myapp/web"}');
  });

  it('leaves non-text files untouched', () => {
    const binary = path.join(root, 'logo.png');
    fs.writeFileSync(binary, '@todo/left-alone');

    replaceInFiles(root, [['@todo/', '@myapp/']]);

    expect(fs.readFileSync(binary, 'utf8')).toBe('@todo/left-alone');
  });
});
