import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import type { LoaderContext } from '@rspack/core';

import userScriptModuleTypesLoader from './userScriptModuleTypesLoader';

type LoaderResult = { error: Error | null | undefined; content?: string | Buffer; contextDependencies: string[] };

const fixtures = path.join(__dirname, '__fixtures__', 'userScriptModuleTypes');

const runLoader = (resourcePath: string): Promise<LoaderResult> =>
  new Promise((resolve) => {
    const contextDependencies: string[] = [];
    const context = {
      resourcePath,
      addContextDependency: (directory: string) => contextDependencies.push(directory),
      callback: (error: Error | null | undefined, content?: string | Buffer) => resolve({ error, content, contextDependencies }),
    } as unknown as LoaderContext;

    userScriptModuleTypesLoader.call(context);
  });

// The loaded module's declarations export, as the bundle would expose it.
const evaluate = (content: string | Buffer | undefined): Record<string, unknown> => {
  const moduleExports: Record<string, unknown> = {};
  new Function('exports', String(content))(moduleExports);
  return moduleExports;
};

// These run the TypeScript compiler, so each takes a few seconds.
describe('userScriptModuleTypesLoader', () => {
  it("emits the entry's bundled declarations: its own exports, with the quidproquo types inlined", async () => {
    const result = await runLoader(path.join(fixtures, 'sdk.ts'));

    expect(result.error).toBeNull();
    const declarations = evaluate(result.content).declarations as string;
    expect(declarations).toContain('export declare const shout: (text: string) => string;');
    expect(declarations).toContain('export declare const askNewGuid');
    expect(declarations).toContain('export type AskResponse<T>');
    // Self-contained: nothing left for a browser editor to resolve.
    expect(declarations).not.toMatch(/from ['"]quidproquo/);
    // The types the exports use are present but not exported.
    expect(declarations).toMatch(/\ninterface Action<T>/);
  }, 60_000);

  it("watches the entry's folder, so editing the module regenerates its declarations", async () => {
    const result = await runLoader(path.join(fixtures, 'sdk.ts'));

    expect(result.contextDependencies).toEqual([fixtures]);
  }, 60_000);

  it('fails the build, naming the entry, when the entry does not type check', async () => {
    // Written at test time: a fixture that does not type check would break this package's own build.
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-user-script-module-types-'));
    fs.copyFileSync(path.join(fixtures, 'tsconfig.json'), path.join(directory, 'tsconfig.json'));
    const entry = path.join(directory, 'sdk.ts');
    fs.writeFileSync(entry, `export const broken: number = 'not a number';\n`);

    try {
      const result = await runLoader(entry);

      expect(result.error?.message).toContain(`Could not generate the user script module types for [${entry}]`);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }, 60_000);
});
