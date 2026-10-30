import { getUserScriptModuleMap, listUserScriptExports, loadUserScriptModule, UserScriptModuleMap } from '@qpqjs/actionprocessor-node';
import {
  actionResult,
  actionResultError,
  askFileReadBinaryContents,
  askUserScriptBuildFromZip,
  askUserScriptListExports,
  createStreamRegistry,
  defineUserScriptModule,
  DynamicModuleLoader,
  FileActionType,
  resolveActionResult,
  resolveActionResultError,
  UserScriptActionType,
} from '@qpqjs/core';
import { buildTestQpqConfig, createStubLogger } from '@qpqjs/testing';

import { zipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { USER_SCRIPT_SOURCE_LIMITS } from './logic/USER_SCRIPT_SOURCE_LIMITS';
import { getUserScriptBuildFromZipActionProcessor } from './getUserScriptBuildFromZipActionProcessor';

const qpqConfig = buildTestQpqConfig();
const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as any;
const logger = createStubLogger();

type Payload = { drive: string; zipFilepath: string; outputFilepath: string; scope?: string; sourceMap: boolean };

const text = (value: string): Uint8Array => new TextEncoder().encode(value);
const makeZip = (files: Record<string, Uint8Array>): Buffer => Buffer.from(zipSync(files));

// An in-memory drive: binary reads answer base64 by `drive:path`, text writes land in `files`.
// `hostModules` is what the stand-in runner hands a published script when it lists its exports.
const createDrive = (binaries: Record<string, Buffer>, hostModules: UserScriptModuleMap = {}) => {
  const files: Record<string, string> = {};
  return {
    files,
    processors: {
      [UserScriptActionType.ListExports]: async ({ drive, filepath }: { drive: string; filepath: string }) => {
        try {
          return actionResult(listUserScriptExports(filepath, files![`${drive}:${filepath}`]!, getUserScriptModuleMap(hostModules)));
        } catch (error) {
          return actionResultError(askUserScriptListExports.errorType.ScriptInvalid, String(error));
        }
      },
      [FileActionType.ReadBinaryContents]: async ({ drive, filepath }: { drive: string; filepath: string }) => {
        const found = binaries[`${drive}:${filepath}`];
        return found
          ? actionResult({ base64Data: found.toString('base64'), filename: filepath })
          : actionResultError(askFileReadBinaryContents.errorType.FileNotFound, `File not found: ${filepath}`);
      },
      [FileActionType.WriteTextContents]: async ({ drive, filepath, data }: { drive: string; filepath: string; data: string }) => {
        files[`${drive}:${filepath}`] = data;
        return actionResult(undefined);
      },
    },
  };
};

const invoke = async (
  payload: Payload,
  actionProcessors: Record<string, any>,
  config = qpqConfig,
  dynamicModuleLoader: DynamicModuleLoader = async () => null,
) => {
  const processors = await getUserScriptBuildFromZipActionProcessor(config, dynamicModuleLoader);
  const process = processors[UserScriptActionType.BuildFromZip] as (p: any, ...rest: any[]) => Promise<any>;
  return process(payload, session, actionProcessors, logger, undefined, dynamicModuleLoader, createStreamRegistry());
};

// A service that lets its scripts import `my-sdk/v1`, served by a loader that knows only it.
const SDK_RUNTIME = '/entry/scriptModules::mySdkV1';
const sdkConfig = buildTestQpqConfig([defineUserScriptModule('my-sdk/v1', SDK_RUNTIME)]);
const sdkLoader: DynamicModuleLoader = async (runtime) => (runtime === SDK_RUNTIME ? { shout: (text: string) => `${text.toUpperCase()}!` } : null);
const SDK_ZIP = makeZip({
  'src/main.ts': text(`
    import { shout } from 'my-sdk/v1';
    export const run = (value: string): string => shout(value);
  `),
});

const PROJECT_ZIP = makeZip({
  'my-script/src/main.ts': text(`
    import { askFileWriteTextContents, AskResponse } from '@qpqjs/core';
    import { formatSum } from './helpers/formatSum';
    export function* add(drive: string, filepath: string, a: number, b: number): AskResponse<number> {
      const sum = a + b;
      yield* askFileWriteTextContents(drive, filepath, formatSum(sum));
      return sum;
    }
    export const greet = (name: string): string => 'hello ' + name;
  `),
  'my-script/src/helpers/formatSum.ts': text(`export const formatSum = (sum: number): string => 'added ' + sum;`),
});

// The output is an asset-style path with no extension: the build writes exactly where it is told.
const payload: Payload = {
  drive: 'scripts',
  zipFilepath: 'doc-1/assets/script.zip',
  outputFilepath: 'doc-1/assets/built',
  scope: 'tenant-a',
  sourceMap: false,
};

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getUserScriptBuildFromZipActionProcessor', () => {
  it("keeps a declared script module external and checks the output against the service's instance", async () => {
    const drive = createDrive({ 'scripts:doc-1/assets/script.zip': SDK_ZIP }, { 'my-sdk/v1': await sdkLoader(SDK_RUNTIME) });

    const result = await invoke(payload, drive.processors, sdkConfig, sdkLoader);

    expect(resolveActionResult(result)).toEqual({ exports: ['run'] });
    const built = drive.files['scripts:doc-1/assets/built'];
    expect(built).toContain('require("my-sdk/v1")');
    const scriptExports = loadUserScriptModule('built', built!, getUserScriptModuleMap({ 'my-sdk/v1': await sdkLoader(SDK_RUNTIME) }));
    expect((scriptExports.run as (value: string) => string)('hi')).toBe('HI!');
  }, 60_000);

  it('fails the build when the module is not declared by the service', async () => {
    const drive = createDrive({ 'scripts:doc-1/assets/script.zip': SDK_ZIP });

    const error = resolveActionResultError(await invoke(payload, drive.processors));

    expect(error.errorType).toBe(askUserScriptBuildFromZip.errorType.BuildFailed);
    expect(error.errorText).toContain('my-sdk/v1');
  }, 60_000);

  it('builds a zipped two-file project off the drive and publishes exactly one file at the output path', async () => {
    const drive = createDrive({ 'scripts:doc-1/assets/script.zip': PROJECT_ZIP });

    const result = await invoke(payload, drive.processors);

    expect(resolveActionResult(result)).toEqual({ exports: ['add', 'greet'] });
    expect(Object.keys(drive.files)).toEqual(['scripts:doc-1/assets/built']);
    const built = drive.files['scripts:doc-1/assets/built'];
    expect(built).toContain('require("@qpqjs/core")');
    expect(built).not.toContain('sourceMappingURL');
    const scriptExports = loadUserScriptModule('built', built!, getUserScriptModuleMap());
    expect((scriptExports.greet as (name: string) => string)('smoke')).toBe('hello smoke');
  }, 60_000);

  it('embeds the source map in the one output file when asked', async () => {
    const drive = createDrive({ 'scripts:doc-1/assets/script.zip': PROJECT_ZIP });

    const result = await invoke({ ...payload, sourceMap: true }, drive.processors);

    expect(resolveActionResult(result)).toEqual({ exports: ['add', 'greet'] });
    expect(Object.keys(drive.files)).toEqual(['scripts:doc-1/assets/built']);
    expect(drive.files['scripts:doc-1/assets/built']).toContain('//# sourceMappingURL=data:application/json;charset=utf-8;base64,');
  }, 60_000);

  it('returns SourceNotFound when there is no zip at the path', async () => {
    const error = resolveActionResultError(await invoke({ ...payload, zipFilepath: 'nowhere.zip' }, createDrive({}).processors));

    expect(error.errorType).toBe(askUserScriptBuildFromZip.errorType.SourceNotFound);
  });

  it('returns SourceNotFound when the zip holds no src/main', async () => {
    const drive = createDrive({ 'scripts:doc-1/assets/script.zip': makeZip({ 'src/other.ts': text('x') }) });

    const error = resolveActionResultError(await invoke(payload, drive.processors));

    expect(error.errorType).toBe(askUserScriptBuildFromZip.errorType.SourceNotFound);
  });

  it('returns InvalidArchive for a file that is not a zip', async () => {
    const drive = createDrive({ 'scripts:doc-1/assets/script.zip': Buffer.from('not a zip') });

    const error = resolveActionResultError(await invoke(payload, drive.processors));

    expect(error.errorType).toBe(askUserScriptBuildFromZip.errorType.InvalidArchive);
    expect(error.errorText).toContain('doc-1/assets/script.zip');
  });

  it('returns UnsafeArchiveEntry for a zip-slip path', async () => {
    const drive = createDrive({ 'scripts:doc-1/assets/script.zip': makeZip({ '../escape.ts': text('x'), 'src/main.ts': text('x') }) });

    expect(resolveActionResultError(await invoke(payload, drive.processors)).errorType).toBe(askUserScriptBuildFromZip.errorType.UnsafeArchiveEntry);
  });

  it('returns SourceTooLarge for a zip file over the cap without reading it as an archive', async () => {
    const drive = createDrive({ 'scripts:doc-1/assets/script.zip': Buffer.alloc(USER_SCRIPT_SOURCE_LIMITS.maxBytes + 1) });

    const error = resolveActionResultError(await invoke(payload, drive.processors));

    expect(error.errorType).toBe(askUserScriptBuildFromZip.errorType.SourceTooLarge);
    expect(error.errorText).toContain('is larger than');
  });

  it('returns SourceTooLarge for a node_modules folder inside the zip', async () => {
    const drive = createDrive({ 'scripts:doc-1/assets/script.zip': makeZip({ 'src/main.ts': text('x'), 'node_modules/a/i.js': text('x') }) });

    expect(resolveActionResultError(await invoke(payload, drive.processors)).errorType).toBe(askUserScriptBuildFromZip.errorType.SourceTooLarge);
  });

  it('returns BuildFailed naming a refused builtin', async () => {
    const drive = createDrive({
      'scripts:doc-1/assets/script.zip': makeZip({
        'src/main.ts': text(`import { readFileSync } from 'fs'; export const f = () => readFileSync('/x', 'utf8');`),
      }),
    });

    const error = resolveActionResultError(await invoke(payload, drive.processors));

    expect(error.errorType).toBe(askUserScriptBuildFromZip.errorType.BuildFailed);
    expect(error.errorText).toContain('[fs]');
  }, 60_000);

  it('passes an unknown read failure through with its own type', async () => {
    const actionProcessors = { [FileActionType.ReadBinaryContents]: async () => actionResultError('Custom', 'boom') };

    expect(resolveActionResultError(await invoke(payload, actionProcessors)).errorType).toBe('Custom');
  });
});
