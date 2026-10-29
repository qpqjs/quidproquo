import { getErrorActionProcessor } from '@qpqjs/actionprocessor-js';
import { getUserScriptModuleMap, listUserScriptExports, loadUserScriptModule } from '@qpqjs/actionprocessor-node';
import {
  actionResult,
  actionResultError,
  askFileListDirectory,
  askUserScriptBuild,
  askUserScriptListExports,
  createStreamRegistry,
  FileActionType,
  resolveActionResult,
  resolveActionResultError,
  UserScriptActionType,
} from '@qpqjs/core';
import { buildTestQpqConfig, createStubLogger } from '@qpqjs/testing';

import fs from 'fs';
import os from 'os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getUserScriptBuildActionProcessor } from './getUserScriptBuildActionProcessor';

const qpqConfig = buildTestQpqConfig();
const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as any;
const logger = createStubLogger();

type Payload = { drive: string; sourceDirectory: string; outputFilepath: string; scope?: string; sourceMap: boolean };

// An in-memory drive keyed `drive:path`. The listing answers one level like the real
// processors do; `missingDirectoryIsError` mimics the dev server, which refuses to list a
// directory that does not exist, while S3 just answers an empty page.
const createDrive = (initial: Record<string, string>, missingDirectoryIsError = false) => {
  const files = { ...initial };
  const entriesOf = (drive: string, folderPath: string) => {
    const prefix = `${drive}:${folderPath}/`;
    const seen = new Map<string, { filepath: string; drive: string; isDir: boolean }>();
    for (const key of Object.keys(files)) {
      if (!key.startsWith(prefix)) continue;
      const [head, ...tail] = key.slice(prefix.length).split('/');
      seen.set(head, { filepath: `${folderPath}/${head}`, drive, isDir: tail.length > 0 });
    }
    return [...seen.values()];
  };

  return {
    files,
    processors: {
      [FileActionType.ListDirectory]: async ({ drive, folderPath }: { drive: string; folderPath: string }) => {
        const entries = entriesOf(drive, folderPath);
        if (entries.length === 0 && missingDirectoryIsError) {
          return actionResultError(askFileListDirectory.errorType.DirectoryNotFound, `no such directory ${folderPath}`);
        }
        return actionResult({ fileInfos: entries, pageToken: undefined });
      },
      [FileActionType.ReadTextContents]: async ({ drive, filepath }: { drive: string; filepath: string }) =>
        actionResult(files[`${drive}:${filepath}`]),
      [FileActionType.WriteTextContents]: async ({ drive, filepath, data }: { drive: string; filepath: string; data: string }) => {
        files[`${drive}:${filepath}`] = data;
        return actionResult(undefined);
      },
      // The runner's part, done in-process here: load what was published and report its exports.
      [UserScriptActionType.ListExports]: async ({ drive, filepath }: { drive: string; filepath: string }) => {
        try {
          return actionResult(listUserScriptExports(filepath, files[`${drive}:${filepath}`], getUserScriptModuleMap()));
        } catch (error) {
          return actionResultError(askUserScriptListExports.errorType.ScriptInvalid, String(error));
        }
      },
    },
  };
};

// The collect story throws through askThrowError, so the real error processor sits
// beside the fake drive, as it does in every runtime's list.
const invoke = async (payload: Payload, actionProcessors: Record<string, any>) => {
  const processors = await getUserScriptBuildActionProcessor(qpqConfig, async () => null);
  const process = processors[UserScriptActionType.Build] as (p: any, ...rest: any[]) => Promise<any>;
  const withErrorProcessor = { ...(await getErrorActionProcessor(qpqConfig, async () => null)), ...actionProcessors };
  return process(payload, session, withErrorProcessor, logger, undefined, async () => null, createStreamRegistry());
};

const PROJECT = {
  'scripts:a/source/src/main.ts': `
    import { askFileWriteTextContents, AskResponse } from '@qpqjs/core';
    import { formatSum } from './helpers/formatSum';
    export function* add(drive: string, filepath: string, a: number, b: number): AskResponse<number> {
      const sum = a + b;
      yield* askFileWriteTextContents(drive, filepath, formatSum(sum));
      return sum;
    }
    export const greet = (name: string): string => 'hello ' + name;
  `,
  'scripts:a/source/src/helpers/formatSum.ts': `export const formatSum = (sum: number): string => 'added ' + sum;`,
};

const payload: Payload = { drive: 'scripts', sourceDirectory: 'a/source', outputFilepath: 'a/built.js', sourceMap: false };

let tempDirsCreated: string[];

beforeEach(() => {
  tempDirsCreated = [];
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const realMkdtemp = fs.mkdtempSync;
  vi.spyOn(fs, 'mkdtempSync').mockImplementation((prefix) => {
    const created = realMkdtemp(prefix);
    tempDirsCreated.push(created);
    return created;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getUserScriptBuildActionProcessor', () => {
  it('builds a two-file project off the drive and publishes exactly one file at the output path', async () => {
    const drive = createDrive(PROJECT);

    const result = await invoke(payload, drive.processors);

    expect(resolveActionResult(result)).toEqual({ exports: ['add', 'greet'] });
    const written = Object.keys(drive.files).filter((key) => !(key in PROJECT));
    expect(written).toEqual(['scripts:a/built.js']);
    expect(drive.files['scripts:a/built.js']).toContain('require("@qpqjs/core")');
    expect(drive.files['scripts:a/built.js']).not.toContain('sourceMappingURL');

    const scriptExports = loadUserScriptModule('built.js', drive.files['scripts:a/built.js'], getUserScriptModuleMap());
    expect((scriptExports.greet as (name: string) => string)('smoke')).toBe('hello smoke');
    expect(tempDirsCreated).toHaveLength(1);
    expect(fs.existsSync(tempDirsCreated[0])).toBe(false);
    expect(tempDirsCreated[0].startsWith(os.tmpdir())).toBe(true);
  }, 60_000);

  it('returns SourceNotFound when the listing is empty (an S3 drive)', async () => {
    const error = resolveActionResultError(await invoke({ ...payload, sourceDirectory: 'nowhere' }, createDrive(PROJECT).processors));

    expect(error.errorType).toBe(askUserScriptBuild.errorType.SourceNotFound);
  });

  it('returns SourceNotFound when the listing refuses a missing directory (the dev server)', async () => {
    const error = resolveActionResultError(await invoke({ ...payload, sourceDirectory: 'nowhere' }, createDrive(PROJECT, true).processors));

    expect(error.errorType).toBe(askUserScriptBuild.errorType.SourceNotFound);
    expect(error.errorText).toContain('nowhere');
  });

  it('returns SourceTooLarge for a node_modules folder without building', async () => {
    const drive = createDrive({ ...PROJECT, 'scripts:a/source/node_modules/x/index.js': 'x' });

    const error = resolveActionResultError(await invoke(payload, drive.processors));

    expect(error.errorType).toBe(askUserScriptBuild.errorType.SourceTooLarge);
    expect(tempDirsCreated).toHaveLength(0);
  });

  it('returns BuildFailed naming a refused builtin and leaves no temp directory', async () => {
    const drive = createDrive({
      'scripts:a/source/src/main.ts': `import { readFileSync } from 'fs'; export const f = () => readFileSync('/x', 'utf8');`,
    });

    const error = resolveActionResultError(await invoke(payload, drive.processors));

    expect(error.errorType).toBe(askUserScriptBuild.errorType.BuildFailed);
    expect(error.errorText).toContain('[fs]');
    expect(fs.existsSync(tempDirsCreated[0])).toBe(false);
    expect(drive.files['scripts:a/built.js']).toBeUndefined();
  }, 60_000);

  it('returns NonFunctionExport for a value export', async () => {
    const drive = createDrive({ 'scripts:a/source/src/main.ts': `export const greet = (n: string) => n; export const version = 3;` });

    const error = resolveActionResultError(await invoke(payload, drive.processors));

    expect(error.errorType).toBe(askUserScriptBuild.errorType.NonFunctionExport);
  }, 60_000);

  it('passes DriveNotFound from the listing through in its own catalog', async () => {
    const actionProcessors = {
      [FileActionType.ListDirectory]: async () => actionResultError(askFileListDirectory.errorType.DriveNotFound, 'no drive'),
    };

    const error = resolveActionResultError(await invoke(payload, actionProcessors));

    expect(error.errorType).toBe(askUserScriptBuild.errorType.DriveNotFound);
  });
});
