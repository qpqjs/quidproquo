import { getViewsEntryDistPath } from '@qpqjs/core';

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveViewsEntry } from './resolveViewsEntry';

describe('resolveViewsEntry', () => {
  let root: string;
  let viewsDir: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-views-entry-'));
    viewsDir = path.join(root, 'apps', 'app', 'services', 'design', 'views');
    fs.mkdirSync(path.join(viewsDir, 'src', 'modules'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("uses the package's own main.ts and index.html when it has them", () => {
    fs.writeFileSync(path.join(viewsDir, 'src', 'main.ts'), "import('./bootstrap');");

    expect(resolveViewsEntry(viewsDir, root, 'app', 'design')).toEqual({
      entry: path.join(viewsDir, 'src', 'main.ts'),
      htmlTemplate: path.join(viewsDir, 'src', 'index.html'),
      isDefault: false,
    });
  });

  it('falls back to main.js for a JavaScript app', () => {
    fs.writeFileSync(path.join(viewsDir, 'src', 'main.js'), "import('./bootstrap');");

    expect(resolveViewsEntry(viewsDir, root, 'app', 'design').entry).toBe(path.join(viewsDir, 'src', 'main.js'));
  });

  it('writes a default main, bootstrap and index.html for a modules-only package', () => {
    const entry = resolveViewsEntry(viewsDir, root, 'app', 'design');
    const entryDir = getViewsEntryDistPath(root, 'app', 'design');

    expect(entry).toEqual({ entry: path.join(entryDir, 'main.ts'), htmlTemplate: path.join(entryDir, 'index.html'), isDefault: true });
    expect(fs.readFileSync(entry.entry, 'utf8')).toContain("import('./bootstrap')");
    expect(fs.existsSync(path.join(entryDir, 'bootstrap.ts'))).toBe(true);
    expect(fs.readFileSync(entry.htmlTemplate, 'utf8')).toContain('app design');
  });
});
