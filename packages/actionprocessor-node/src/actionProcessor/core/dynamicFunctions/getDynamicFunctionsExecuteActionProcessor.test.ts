import {
  actionResult,
  actionResultError,
  buildTestQpqConfig,
  createActionProcessor,
  createStreamRegistry,
  createStubLogger,
  defineDynamicFunctions,
  DynamicFunctionsActionType,
  DynamicFunctionsExecuteErrorTypeEnum,
  ErrorTypeEnum,
  ProcessorFor,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDynamicFunctionsExecuteActionProcessor } from './getDynamicFunctionsExecuteActionProcessor';

const qpqConfig = buildTestQpqConfig([defineDynamicFunctions('templateEventDoc', '/entry/eventDocs::templateEventDoc')]);

const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as any;
const logger = createStubLogger();

const invoke = async (
  payload: { dynamicFunctionsName: string; functionName: string; args: unknown[] },
  actionProcessors: Record<string, any>,
  dynamicModuleLoader: any,
  callerSession: any = session,
) => {
  const processors = await getDynamicFunctionsExecuteActionProcessor(qpqConfig, async () => null);
  const process = processors[DynamicFunctionsActionType.Execute] as (p: any, ...rest: any[]) => Promise<any>;
  return process(payload, callerSession, actionProcessors, logger, undefined, dynamicModuleLoader, createStreamRegistry());
};

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getDynamicFunctionsExecuteActionProcessor', () => {
  it('calls a plain member with positional args and returns its result', async () => {
    const functionsObject = {
      add: (a: number, b: number) => a + b,
    };

    const result = await invoke({ dynamicFunctionsName: 'templateEventDoc', functionName: 'add', args: [1, 2] }, {}, async () => functionsObject);

    expect(resolveActionResult(result)).toBe(3);
  });

  it('awaits an async member', async () => {
    const functionsObject = {
      fetchThing: async (id: string) => ({ id }),
    };

    const result = await invoke(
      { dynamicFunctionsName: 'templateEventDoc', functionName: 'fetchThing', args: ['abc'] },
      {},
      async () => functionsObject,
    );

    expect(resolveActionResult(result)).toEqual({ id: 'abc' });
  });

  it('runs a generator member as a sub-story and returns its story result', async () => {
    const functionsObject = {
      *foldThing(seed: number): any {
        const doubled = yield { type: 'Double', payload: { value: seed } };
        return doubled + 1;
      },
    };

    const actionProcessors = {
      Double: async (payload: { value: number }) => actionResult(payload.value * 2),
    };

    const result = await invoke(
      { dynamicFunctionsName: 'templateEventDoc', functionName: 'foldThing', args: [21] },
      actionProcessors,
      async () => functionsObject,
    );

    expect(resolveActionResult(result)).toBe(43);
  });

  it('carries the caller function globals into the sub-story session', async () => {
    let seenGlobals: Record<string, unknown> | undefined;

    const functionsObject = {
      *capturesSession(): any {
        yield { type: 'Capture' };
        return 'ok';
      },
    };

    const actionProcessors = {
      Capture: async (_payload: unknown, storySession: { functionGlobals?: Record<string, unknown> }) => {
        seenGlobals = storySession.functionGlobals;
        return actionResult(null);
      },
    };

    const callerSession = {
      correlation: 'corr-0',
      depth: 0,
      context: {},
      localContext: {},
      functionGlobals: { eventDocUserDirectory: 'users' },
    } as any;

    await invoke(
      { dynamicFunctionsName: 'templateEventDoc', functionName: 'capturesSession', args: [] },
      actionProcessors,
      async () => functionsObject,
      callerSession,
    );

    expect(seenGlobals).toEqual({ eventDocUserDirectory: 'users' });
  });

  it('propagates a sub-story error with its original error type', async () => {
    const functionsObject = {
      *fails(): any {
        yield { type: 'Fails' };
        return 'unreachable';
      },
    };

    const actionProcessors = { Fails: async () => actionResultError(ErrorTypeEnum.NotFound, 'boom') };

    const result = await invoke(
      { dynamicFunctionsName: 'templateEventDoc', functionName: 'fails', args: [] },
      actionProcessors,
      async () => functionsObject,
    );

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns DynamicFunctionsNotFound for an unregistered name', async () => {
    const result = await invoke({ dynamicFunctionsName: 'missingFunctions', functionName: 'anything', args: [] }, {}, async () => ({}));

    const error = resolveActionResultError(result);
    expect(error.errorType).toBe(DynamicFunctionsExecuteErrorTypeEnum.DynamicFunctionsNotFound);
    expect(error.errorText).toContain('missingFunctions');
  });

  it('returns ModuleLoadFailed when the module cannot be loaded', async () => {
    const result = await invoke({ dynamicFunctionsName: 'templateEventDoc', functionName: 'anything', args: [] }, {}, async () => null);

    const error = resolveActionResultError(result);
    expect(error.errorType).toBe(DynamicFunctionsExecuteErrorTypeEnum.ModuleLoadFailed);
    expect(error.errorText).toContain('templateEventDoc');
  });

  it('returns FunctionNotFound for a missing member', async () => {
    const result = await invoke({ dynamicFunctionsName: 'templateEventDoc', functionName: 'nope', args: [] }, {}, async () => ({}));

    const error = resolveActionResultError(result);
    expect(error.errorType).toBe(DynamicFunctionsExecuteErrorTypeEnum.FunctionNotFound);
    expect(error.errorText).toContain('templateEventDoc.nope');
  });

  it('returns FunctionNotFound for a non-function member', async () => {
    const result = await invoke({ dynamicFunctionsName: 'templateEventDoc', functionName: 'notCallable', args: [] }, {}, async () => ({
      notCallable: 42,
    }));

    expect(resolveActionResultError(result).errorType).toBe(DynamicFunctionsExecuteErrorTypeEnum.FunctionNotFound);
  });

  it('returns FunctionNotFound for a member reachable only through the prototype', async () => {
    class WithProtoMember {
      inherited() {
        return 'never';
      }
    }

    const result = await invoke(
      { dynamicFunctionsName: 'templateEventDoc', functionName: 'inherited', args: [] },
      {},
      async () => new WithProtoMember(),
    );

    expect(resolveActionResultError(result).errorType).toBe(DynamicFunctionsExecuteErrorTypeEnum.FunctionNotFound);
  });

  it('returns FunctionThrew when a plain member throws synchronously', async () => {
    const functionsObject = {
      explodes: () => {
        throw new Error('kaboom');
      },
    };

    const result = await invoke({ dynamicFunctionsName: 'templateEventDoc', functionName: 'explodes', args: [] }, {}, async () => functionsObject);

    const error = resolveActionResultError(result);
    expect(error.errorType).toBe(DynamicFunctionsExecuteErrorTypeEnum.FunctionThrew);
    expect(error.errorText).toContain('kaboom');
  });

  it('returns FunctionThrew when an async member rejects', async () => {
    const functionsObject = {
      rejects: async () => {
        throw new Error('async kaboom');
      },
    };

    const result = await invoke({ dynamicFunctionsName: 'templateEventDoc', functionName: 'rejects', args: [] }, {}, async () => functionsObject);

    const error = resolveActionResultError(result);
    expect(error.errorType).toBe(DynamicFunctionsExecuteErrorTypeEnum.FunctionThrew);
    expect(error.errorText).toContain('async kaboom');
  });
});
