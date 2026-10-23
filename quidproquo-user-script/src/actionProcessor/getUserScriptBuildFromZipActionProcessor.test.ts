import { getUserScriptModuleMap, loadUserScriptModule } from 'quidproquo-actionprocessor-node';
import {
  actionResult,
  actionResultError,
  askFileReadBinaryContents,
  askUserScriptBuildFromZip,
  buildTestQpqConfig,
  createStreamRegistry,
  createStubLogger,
  FileActionType,
  resolveActionResult,
  resolveActionResultError,
  UserScriptActionType,
} from 'quidproquo-core';

import { zipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { USER_SCRIPT_SOURCE_LIMITS } from './logic/USER_SCRIPT_SOURCE_LIMITS';
import { getUserScriptBuildFromZipActionProcessor } from './getUserScriptBuildFromZipActionProcessor';

const qpqConfig = buildTestQpqConfig();
const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as any;
const logger = createStubLogger();

type Payload = { drive: string; zipFilepath: string; outputDirectory: string; scope?: string };

const text = (value: string): Uint8Array => new TextEncoder().encode(value);
const makeZip = (files: Record<string, Uint8Array>): Buffer => Buffer.from(zipSync(files));

// An in-memory drive: binary reads answer base64 by `drive:path`, text writes land in `files`.
const createDrive = (binaries: Record<string, Buffer>) => {
  const files: Record<string, string> = {};
  return {
    files,
    processors: {
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

const invoke = async (payload: Payload, actionProcessors: Record<string, any>) => {
  const processors = await getUserScriptBuildFromZipActionProcessor(qpqConfig, async () => null);
  const process = processors[UserScriptActionType.BuildFromZip] as (p: any, ...rest: any[]) => Promise<any>;
  return process(payload, session, actionProcessors, logger, undefined, async () => null, createStreamRegistry());
};

const PROJECT_ZIP = makeZip({
  'my-script/src/main.ts': text(`
    import { askFileWriteTextContents, AskResponse } from 'quidproquo-core';
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

const payload: Payload = { drive: 'scripts', zipFilepath: 'doc-1/assets/script.zip', outputDirectory: 'doc-1/built', scope: 'tenant-a' };

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getUserScriptBuildFromZipActionProcessor', () => {
  it('builds a zipped two-file project off the drive and publishes main.js and its map, passing the scope through', async () => {
    const drive = createDrive({ 'scripts:doc-1/assets/script.zip': PROJECT_ZIP });

    const result = await invoke(payload, drive.processors);

    expect(resolveActionResult(result)).toEqual({ exports: ['add', 'greet'] });
    expect(drive.files['scripts:doc-1/built/main.js']).toContain('require("quidproquo-core")');
    expect(drive.files['scripts:doc-1/built/main.js.map']).toContain('"sources"');
    const scriptExports = loadUserScriptModule('main.js', drive.files['scripts:doc-1/built/main.js'], getUserScriptModuleMap());
    expect((scriptExports.greet as (name: string) => string)('smoke')).toBe('hello smoke');
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
