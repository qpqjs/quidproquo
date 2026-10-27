import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { LoaderContext } from '@rspack/core';

import sourceMapLoader from './sourceMapLoader';

type LoaderResult = { error: Error | null | undefined; content?: string | Buffer; map?: unknown };

const runLoader = (resourcePath: string, content: string): Promise<LoaderResult & { dependencies: string[] }> =>
  new Promise((resolve) => {
    const dependencies: string[] = [];
    const context = {
      resourcePath,
      addDependency: (file: string) => dependencies.push(file),
      async: () => (error: Error | null | undefined, newContent?: string | Buffer, map?: unknown) =>
        resolve({ error, content: newContent, map, dependencies }),
    } as unknown as LoaderContext;

    sourceMapLoader.call(context, content);
  });

describe('sourceMapLoader', () => {
  let workDirectory: string;

  beforeEach(() => {
    workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-source-map-loader-'));
  });

  afterEach(() => {
    fs.rmSync(workDirectory, { recursive: true, force: true });
  });

  it('passes source without a sourceMappingURL through untouched', async () => {
    const source = 'exports.a = 1;\n';

    const result = await runLoader(path.join(workDirectory, 'a.js'), source);

    expect(result.error).toBeNull();
    expect(result.content).toBe(source);
    expect(result.map).toBeUndefined();
  });

  it('reads an external map file next to the source and strips the comment', async () => {
    const map = { version: 3, sources: ['a.ts'], sourcesContent: ['const a: number = 1;'], mappings: 'AAAA' };
    fs.writeFileSync(path.join(workDirectory, 'a.js.map'), JSON.stringify(map));
    const source = 'exports.a = 1;\n//# sourceMappingURL=a.js.map\n';

    const result = await runLoader(path.join(workDirectory, 'a.js'), source);

    expect(result.error).toBeNull();
    expect(result.content).not.toContain('sourceMappingURL');
    expect(result.map).toMatchObject({ sources: ['a.ts'], sourcesContent: ['const a: number = 1;'] });
    expect(result.dependencies).toContain(path.join(workDirectory, 'a.js.map'));
  });

  it('decodes an inline base64 data-url map', async () => {
    const map = { version: 3, sources: ['b.ts'], sourcesContent: ['const b = 2;'], mappings: 'AAAA' };
    const encoded = Buffer.from(JSON.stringify(map)).toString('base64');
    const source = `exports.b = 2;\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${encoded}\n`;

    const result = await runLoader(path.join(workDirectory, 'b.js'), source);

    expect(result.error).toBeNull();
    expect(result.map).toMatchObject({ sources: ['b.ts'] });
  });

  it('fills missing sourcesContent from files on disk', async () => {
    fs.writeFileSync(path.join(workDirectory, 'c.ts'), 'const c: number = 3;');
    const map = { version: 3, sources: ['c.ts'], mappings: 'AAAA' };
    fs.writeFileSync(path.join(workDirectory, 'c.js.map'), JSON.stringify(map));
    const source = 'exports.c = 3;\n//# sourceMappingURL=c.js.map\n';

    const result = await runLoader(path.join(workDirectory, 'c.js'), source);

    expect(result.error).toBeNull();
    expect(result.map).toMatchObject({ sourcesContent: ['const c: number = 3;'] });
  });

  it('passes through when the referenced map file is missing', async () => {
    const source = 'exports.d = 4;\n//# sourceMappingURL=missing.js.map\n';

    const result = await runLoader(path.join(workDirectory, 'd.js'), source);

    expect(result.error).toBeNull();
    expect(result.content).toBe(source);
    expect(result.map).toBeUndefined();
  });

  it('passes through when the map file is not valid json', async () => {
    fs.writeFileSync(path.join(workDirectory, 'e.js.map'), 'not json');
    const source = 'exports.e = 5;\n//# sourceMappingURL=e.js.map\n';

    const result = await runLoader(path.join(workDirectory, 'e.js'), source);

    expect(result.error).toBeNull();
    expect(result.content).toBe(source);
    expect(result.map).toBeUndefined();
  });
});
