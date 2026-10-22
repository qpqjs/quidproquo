import {
  actionResult,
  actionResultError,
  askFileReadTextContents,
  askUserScriptExecute,
  buildTestQpqConfig,
  createStreamRegistry,
  createStubLogger,
  ErrorTypeEnum,
  FileActionType,
  resolveActionResult,
  resolveActionResultError,
  UserScriptActionType,
} from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getUserScriptExecuteActionProcessor } from './getUserScriptExecuteActionProcessor';

const qpqConfig = buildTestQpqConfig();
const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as any;
const logger = createStubLogger();

type Payload = { drive: string; directory: string; functionName: string; args: unknown[]; scope?: string };

// A fake drive: the ReadTextContents processor serves text by `drive:filepath`, so a
// test writes a script with one line and reads it back through the real seam.
const createFileReadProcessor = (files: Record<string, string>) => ({
  [FileActionType.ReadTextContents]: async ({ drive, filepath }: { drive: string; filepath: string }) => {
    const key = `${drive}:${filepath}`;
    return key in files ? actionResult(files[key]) : actionResultError(askFileReadTextContents.errorType.FileNotFound, `File not found: ${filepath}`);
  },
});

const invoke = async (payload: Payload, actionProcessors: Record<string, any>, callerSession: any = session) => {
  const processors = await getUserScriptExecuteActionProcessor(qpqConfig, async () => null);
  const process = processors[UserScriptActionType.Execute] as (p: any, ...rest: any[]) => Promise<any>;
  return process(payload, callerSession, actionProcessors, logger, undefined, async () => null, createStreamRegistry());
};

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

const files = { 'scripts:tenant-a/report/main.js': SCRIPT };
const payloadFor = (functionName: string, args: unknown[] = []): Payload => ({ drive: 'scripts', directory: 'tenant-a/report', functionName, args });

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getUserScriptExecuteActionProcessor', () => {
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

  it('reads the entry as main.js inside the directory, tolerating a trailing slash', async () => {
    const result = await invoke({ ...payloadFor('add', [1, 1]), directory: 'tenant-a/report/' }, createFileReadProcessor(files));

    expect(resolveActionResult(result)).toBe(2);
  });

  it('returns ScriptNotFound when the directory has no main.js', async () => {
    const result = await invoke({ ...payloadFor('add'), directory: 'nowhere' }, createFileReadProcessor(files));

    const error = resolveActionResultError(result);
    expect(error.errorType).toBe(askUserScriptExecute.errorType.ScriptNotFound);
    expect(error.errorText).toContain('scripts:nowhere/main.js');
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
      await invoke(payloadFor('anything'), createFileReadProcessor({ 'scripts:tenant-a/report/main.js': `require('fs');` })),
    );

    expect(error.errorType).toBe(askUserScriptExecute.errorType.ModuleNotFound);
    expect(error.errorText).toContain('[fs]');
  });

  it('returns ScriptInvalid when the module body throws while loading', async () => {
    const error = resolveActionResultError(
      await invoke(payloadFor('anything'), createFileReadProcessor({ 'scripts:tenant-a/report/main.js': `throw new Error('top');` })),
    );

    expect(error.errorType).toBe(askUserScriptExecute.errorType.ScriptInvalid);
    expect(error.errorText).toContain('top');
  });

  it('returns FunctionNotFound for an unknown export', async () => {
    const error = resolveActionResultError(await invoke(payloadFor('nope'), createFileReadProcessor(files)));

    expect(error.errorType).toBe(askUserScriptExecute.errorType.FunctionNotFound);
    expect(error.errorText).toContain('main.js#nope');
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
