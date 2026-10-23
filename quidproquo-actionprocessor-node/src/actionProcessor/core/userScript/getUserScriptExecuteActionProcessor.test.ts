import {
  actionResult,
  actionResultError,
  askFileReadTextContents,
  askUserScriptExecute,
  buildTestQpqConfig,
  createStreamRegistry,
  createStubLogger,
  defineUserScriptModule,
  DynamicModuleLoader,
  ErrorTypeEnum,
  FileActionType,
  resolveActionResult,
  resolveActionResultError,
  UserScriptActionType,
} from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserScriptHostModuleLoadError } from './logic/UserScriptHostModuleLoadError';
import { getUserScriptExecuteActionProcessor } from './getUserScriptExecuteActionProcessor';

const qpqConfig = buildTestQpqConfig();
const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as any;
const logger = createStubLogger();

type Payload = { drive: string; filepath: string; functionName: string; args: unknown[]; scope?: string };

// A fake drive: the ReadTextContents processor serves text by `drive:filepath`, so a
// test writes a script with one line and reads it back through the real seam.
const createFileReadProcessor = (files: Record<string, string>) => ({
  [FileActionType.ReadTextContents]: async ({ drive, filepath }: { drive: string; filepath: string }) => {
    const key = `${drive}:${filepath}`;
    return key in files ? actionResult(files[key]) : actionResultError(askFileReadTextContents.errorType.FileNotFound, `File not found: ${filepath}`);
  },
});

const invoke = async (
  payload: Payload,
  actionProcessors: Record<string, any>,
  callerSession: any = session,
  config = qpqConfig,
  dynamicModuleLoader: DynamicModuleLoader = async () => null,
) => {
  const processors = await getUserScriptExecuteActionProcessor(config, dynamicModuleLoader);
  const process = processors[UserScriptActionType.Execute] as (p: any, ...rest: any[]) => Promise<any>;
  return process(payload, callerSession, actionProcessors, logger, undefined, dynamicModuleLoader, createStreamRegistry());
};

// A service that lets its scripts import `my-sdk/v1`, served by a loader that knows only it.
const SDK_RUNTIME = '/entry/scriptModules::mySdkV1';
const sdkConfig = buildTestQpqConfig([defineUserScriptModule('my-sdk/v1', SDK_RUNTIME)]);
const sdkModule = { shout: (text: string) => `${text.toUpperCase()}!` };
const sdkLoader: DynamicModuleLoader = async (runtime) => (runtime === SDK_RUNTIME ? sdkModule : null);

const SCRIPT = `
  const { askFileReadTextContents } = require('quidproquo-core');
  exports.doubleThenAdd = function* (seed) {
    const doubled = yield { type: 'Double', payload: { value: seed } };
    return doubled + 1;
  };
  exports.fetchThing = async (id) => ({ id });
  exports.add = (a, b) => a + b;
  exports.notCallable = 42;
  exports.explodes = () => { throw new Error('kaboom'); };
  exports.rejects = async () => { throw new Error('later'); };
  exports.fails = function* () { yield { type: 'Fails' }; return 'unreachable'; };
  exports.readsAFile = function* () { return yield* askFileReadTextContents('scripts', 'tenant-a/report/data.txt'); };
  exports.capturesSession = function* () { yield { type: 'Capture' }; return 'ok'; };
`;

// Any file name: the filepath names the built file exactly, `main.js` is not assumed.
const files = { 'scripts:tenant-a/report/build-7.js': SCRIPT };
const payloadFor = (functionName: string, args: unknown[] = []): Payload => ({
  drive: 'scripts',
  filepath: 'tenant-a/report/build-7.js',
  functionName,
  args,
});

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getUserScriptExecuteActionProcessor', () => {
  it('lets a script require a module the service declared, served by the dynamic module loader', async () => {
    const sdkFiles = { 'scripts:sdk.js': `const { shout } = require('my-sdk/v1'); exports.run = (text) => shout(text);` };

    const result = await invoke(
      { ...payloadFor('run', ['hi']), filepath: 'sdk.js' },
      createFileReadProcessor(sdkFiles),
      session,
      sdkConfig,
      sdkLoader,
    );

    expect(resolveActionResult(result)).toBe('HI!');
  });

  it('still refuses a module the service did not declare', async () => {
    const otherFiles = { 'scripts:other.js': `require('other-sdk/v1'); exports.run = () => 1;` };

    const result = await invoke({ ...payloadFor('run'), filepath: 'other.js' }, createFileReadProcessor(otherFiles), session, sdkConfig, sdkLoader);

    expect(resolveActionResultError(result).errorType).toBe(askUserScriptExecute.errorType.ModuleNotFound);
  });

  it('throws when a declared module does not load, rather than blaming the script', async () => {
    await expect(invoke(payloadFor('add', [1, 2]), createFileReadProcessor(files), session, sdkConfig, async () => null)).rejects.toBeInstanceOf(
      UserScriptHostModuleLoadError,
    );
  });

  it('runs a generator export as a sub-story whose actions go through the passed processors', async () => {
    const actionProcessors = {
      ...createFileReadProcessor(files),
      Double: async (payload: { value: number }) => actionResult(payload.value * 2),
    };

    const result = await invoke(payloadFor('doubleThenAdd', [21]), actionProcessors);

    expect(resolveActionResult(result)).toBe(43);
  });

  it('awaits an async export', async () => {
    const result = await invoke(payloadFor('fetchThing', ['abc']), createFileReadProcessor(files));

    expect(resolveActionResult(result)).toEqual({ id: 'abc' });
  });

  it('returns a plain export result, and each export is reachable by name', async () => {
    const result = await invoke(payloadFor('add', [20, 22]), createFileReadProcessor(files));

    expect(resolveActionResult(result)).toBe(42);
  });

  it('loads exactly the given file, never a main.js beside it', async () => {
    const result = await invoke(
      { ...payloadFor('add'), filepath: 'tenant-a/report' },
      createFileReadProcessor({ ...files, 'scripts:tenant-a/report/main.js': SCRIPT }),
    );

    const error = resolveActionResultError(result);
    expect(error.errorType).toBe(askUserScriptExecute.errorType.ScriptNotFound);
  });

  it('returns ScriptNotFound when there is no file at the filepath', async () => {
    const result = await invoke({ ...payloadFor('add'), filepath: 'nowhere.js' }, createFileReadProcessor(files));

    const error = resolveActionResultError(result);
    expect(error.errorType).toBe(askUserScriptExecute.errorType.ScriptNotFound);
    expect(error.errorText).toContain('scripts:nowhere.js');
  });

  it('re-labels a scope refusal from the read into its own catalog', async () => {
    const actionProcessors = {
      [FileActionType.ReadTextContents]: async () => actionResultError(askFileReadTextContents.errorType.InvalidScope, 'scope refused'),
    };

    const error = resolveActionResultError(await invoke(payloadFor('add'), actionProcessors));

    expect(error.errorType).toBe(askUserScriptExecute.errorType.InvalidScope);
    expect(error.errorText).toBe('scope refused');
  });

  it('passes any other read failure through with its own type', async () => {
    const actionProcessors = {
      [FileActionType.ReadTextContents]: async () => actionResultError(ErrorTypeEnum.GenericError, 'bucket exploded'),
    };

    const error = resolveActionResultError(await invoke(payloadFor('add'), actionProcessors));

    expect(error.errorType).toBe(ErrorTypeEnum.GenericError);
  });

  it('returns ModuleNotFound when the script requires outside the shared packages', async () => {
    const error = resolveActionResultError(
      await invoke(payloadFor('anything'), createFileReadProcessor({ 'scripts:tenant-a/report/build-7.js': `require('fs');` })),
    );

    expect(error.errorType).toBe(askUserScriptExecute.errorType.ModuleNotFound);
    expect(error.errorText).toContain('[fs]');
  });

  it('returns ScriptInvalid when the module body throws while loading', async () => {
    const error = resolveActionResultError(
      await invoke(payloadFor('anything'), createFileReadProcessor({ 'scripts:tenant-a/report/build-7.js': `throw new Error('top');` })),
    );

    expect(error.errorType).toBe(askUserScriptExecute.errorType.ScriptInvalid);
    expect(error.errorText).toContain('top');
  });

  it('returns FunctionNotFound for an unknown export', async () => {
    const error = resolveActionResultError(await invoke(payloadFor('nope'), createFileReadProcessor(files)));

    expect(error.errorType).toBe(askUserScriptExecute.errorType.FunctionNotFound);
    expect(error.errorText).toContain('build-7.js#nope');
  });

  it('returns FunctionNotFound for a non-function export', async () => {
    const error = resolveActionResultError(await invoke(payloadFor('notCallable'), createFileReadProcessor(files)));

    expect(error.errorType).toBe(askUserScriptExecute.errorType.FunctionNotFound);
  });

  it('returns FunctionThrew when a plain export throws synchronously', async () => {
    const error = resolveActionResultError(await invoke(payloadFor('explodes'), createFileReadProcessor(files)));

    expect(error.errorType).toBe(askUserScriptExecute.errorType.FunctionThrew);
    expect(error.errorText).toContain('kaboom');
  });

  it('returns FunctionThrew when an async export rejects', async () => {
    const error = resolveActionResultError(await invoke(payloadFor('rejects'), createFileReadProcessor(files)));

    expect(error.errorType).toBe(askUserScriptExecute.errorType.FunctionThrew);
    expect(error.errorText).toContain('later');
  });

  it('propagates a story error from inside the script with its original type', async () => {
    const actionProcessors = {
      ...createFileReadProcessor(files),
      Fails: async () => actionResultError(ErrorTypeEnum.NotFound, 'boom'),
    };

    const error = resolveActionResultError(await invoke(payloadFor('fails'), actionProcessors));

    expect(error.errorType).toBe(ErrorTypeEnum.NotFound);
    expect(error.errorText).toBe('boom');
  });

  it('lets the script use the shared core package it required', async () => {
    const withData = { ...files, 'scripts:tenant-a/report/data.txt': 'hello from the drive' };

    const result = await invoke(payloadFor('readsAFile'), createFileReadProcessor(withData));

    expect(resolveActionResult(result)).toBe('hello from the drive');
  });

  it('carries the caller function globals into the script story session', async () => {
    let seenGlobals: Record<string, unknown> | undefined;
    const actionProcessors = {
      ...createFileReadProcessor(files),
      Capture: async (_payload: unknown, storySession: { functionGlobals?: Record<string, unknown> }) => {
        seenGlobals = storySession.functionGlobals;
        return actionResult(null);
      },
    };
    const callerSession = { ...session, functionGlobals: { eventDocUserDirectory: 'users' } };

    const result = await invoke(payloadFor('capturesSession'), actionProcessors, callerSession);

    expect(resolveActionResult(result)).toBe('ok');
    expect(seenGlobals).toEqual({ eventDocUserDirectory: 'users' });
  });
});
