import { getUserScriptModuleMap, loadUserScriptModule } from '@qpqjs/actionprocessor-node';
import { FileActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildUserScript } from './buildUserScript';
import { checkUserScriptOutput } from './checkUserScriptOutput';
import { UserScriptBuildError, UserScriptBuildErrorCode } from './UserScriptBuildError';

const fixtures = path.join(__dirname, '__fixtures__');

let tempRoot: string;
const outDirFor = (name: string): string => path.join(tempRoot, name);

const expectBuildError = async (promise: Promise<unknown>, code: UserScriptBuildErrorCode, messagePart: string) => {
  const error = await promise.then(
    () => undefined,
    (caught) => caught,
  );

  expect(error).toBeInstanceOf(UserScriptBuildError);
  expect((error as UserScriptBuildError).code).toBe(code);
  expect((error as UserScriptBuildError).message).toContain(messagePart);
};

beforeAll(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-user-script-build-'));
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterAll(() => {
  vi.restoreAllMocks();
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

// These run rspack for real, so each takes a few seconds.
describe('buildUserScript', () => {
  it('builds a TypeScript project with a helper file and an npm package into one loadable main.js', async () => {
    const outDir = outDirFor('basic');

    const result = await buildUserScript({ projectDir: path.join(fixtures, 'basic'), outDir });

    expect(result.entryPath).toBe(path.join(outDir, 'main.js'));
    // The whole output is the one file: no .map beside it, no source map inside it.
    expect(fs.readdirSync(outDir)).toEqual(['main.js']);
    expect(checkUserScriptOutput(result.entryPath)).toEqual(['add', 'greet', 'makeId']);

    const built = fs.readFileSync(result.entryPath, 'utf8');
    expect(built).not.toContain('sourceMappingURL');
    expect(built).toContain('require("@qpqjs/core")');
    expect(built).not.toContain('require("uuidv7")');

    const scriptExports = loadUserScriptModule(result.entryPath, built, getUserScriptModuleMap());
    expect((scriptExports.greet as (name: string) => string)('smoke')).toBe('hello smoke');
    expect((scriptExports.makeId as () => string)()).toMatch(/^[0-9a-f-]{36}$/);

    const written: unknown[] = [];
    const sum = runStory((scriptExports.add as (...args: unknown[]) => any)('drive', 'out.txt', 20, 22), {
      [FileActionType.WriteTextContents]: (action) => {
        written.push(action.payload);
        return undefined;
      },
    });
    expect(sum).toBe(42);
    expect(written).toEqual([
      { drive: 'drive', filepath: 'out.txt', data: 'added 42', storageDriveAdvancedWriteOptions: undefined, scope: undefined },
    ]);
    expect(written[0]).toHaveProperty('data', 'added 42');
  }, 60_000);

  it('embeds the source map in main.js when asked, still writing no other file', async () => {
    const outDir = outDirFor('basicWithMap');

    const result = await buildUserScript({ projectDir: path.join(fixtures, 'basic'), outDir, sourceMap: true });

    expect(fs.readdirSync(outDir)).toEqual(['main.js']);
    const built = fs.readFileSync(result.entryPath, 'utf8');
    const inlineMap = built.match(/\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,(\S+)/);
    expect(inlineMap).not.toBeNull();

    const map = JSON.parse(Buffer.from(inlineMap?.[1] ?? '', 'base64').toString('utf8'));
    expect(map.sources.some((source: string) => source.endsWith('src/main.ts'))).toBe(true);
    expect(checkUserScriptOutput(result.entryPath)).toEqual(['add', 'greet', 'makeId']);
  }, 60_000);

  it('fails BuildFailed naming the builtin when a script imports fs', async () => {
    await expectBuildError(
      buildUserScript({ projectDir: path.join(fixtures, 'builtin'), outDir: outDirFor('builtin') }),
      UserScriptBuildErrorCode.BuildFailed,
      'imports the Node builtin [fs]',
    );
  }, 60_000);

  it('fails NoEntry before running rspack when there is no src/main', async () => {
    await expectBuildError(
      buildUserScript({ projectDir: path.join(fixtures, 'noEntry'), outDir: outDirFor('noEntry') }),
      UserScriptBuildErrorCode.NoEntry,
      'src/main.ts, src/main.js',
    );
  });

  it('builds a script that exports a value, leaving the check to fail NonFunctionExport', async () => {
    const outDir = outDirFor('nonFunction');
    const result = await buildUserScript({ projectDir: path.join(fixtures, 'nonFunction'), outDir });

    await expectBuildError(
      Promise.resolve().then(() => checkUserScriptOutput(result.entryPath)),
      UserScriptBuildErrorCode.NonFunctionExport,
      'export [version] is not a function',
    );
  }, 60_000);
});
