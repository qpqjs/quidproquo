import {
  actionResult,
  actionResultError,
  createStreamRegistry,
  defineInlineFunction,
  ErrorTypeEnum,
  InlineFunctionActionType,
  resolveActionResult,
  resolveActionResultError,
} from '@qpqjs/core';
import { buildTestQpqConfig, createStubLogger } from '@qpqjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getInlineFunctionExecuteActionProcessor } from './getInlineFunctionExecuteActionProcessor';

const qpqConfig = buildTestQpqConfig([defineInlineFunction('/entry/fn::handler')]);

const session = { correlation: 'corr-0', depth: 0, context: {}, localContext: {} } as any;
const logger = createStubLogger();

const invoke = async (payload: { functionName: string; payload: unknown }, actionProcessors: Record<string, any>, dynamicModuleLoader: any) => {
  const processors = await getInlineFunctionExecuteActionProcessor(qpqConfig, async () => null);
  const process = processors[InlineFunctionActionType.Execute] as (p: any, ...rest: any[]) => Promise<any>;
  return process(payload, session, actionProcessors, logger, undefined, dynamicModuleLoader, createStreamRegistry());
};

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getInlineFunctionExecuteActionProcessor', () => {
  it('runs the loaded story and returns its result', async () => {
    function* echoStory(input: unknown): any {
      return input;
    }

    const result = await invoke({ functionName: 'handler', payload: { value: 42 } }, {}, async () => echoStory);

    expect(resolveActionResult(result)).toEqual({ value: 42 });
  });

  it('returns NotFound when the function name is not configured', async () => {
    const result = await invoke({ functionName: 'missing', payload: {} }, {}, async () => undefined);

    const error = resolveActionResultError(result);
    expect(error.errorType).toBe(ErrorTypeEnum.NotFound);
    expect(error.errorText).toContain('missing');
  });

  // Security regression: the name is a config key, not a path; path-shaped names never reach the module loader.
  it.each(['../entry/fn::handler', '/entry/fn::handler', 'entry/../../etc::x', 'node:child_process'])(
    'returns NotFound for the path-shaped name %s without loading anything',
    async (functionName: any) => {
      const loader = vi.fn(async () => ({ handler: () => actionResult('never') }));
      const result = await invoke({ functionName, payload: {} }, {}, loader);

      expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.NotFound);
      expect(loader).not.toHaveBeenCalled();
    },
  );

  it('returns NotFound when the module cannot be loaded', async () => {
    const result = await invoke({ functionName: 'handler', payload: {} }, {}, async () => null);

    const error = resolveActionResultError(result);
    expect(error.errorType).toBe(ErrorTypeEnum.NotFound);
    expect(error.errorText).toContain('Unable to dynamically load');
  });

  it('carries the caller function globals into the inline story session', async () => {
    // The inline function runs WITHIN the caller's function, so route-level
    // globals (e.g. eventDocUserDirectory) must be visible to its actions -
    // this is what lets the tenant scope resolver resolve the current user.
    let seenGlobals: Record<string, unknown> | undefined;

    function* capturesSession(): any {
      yield { type: 'Capture' };
      return 'ok';
    }

    const actionProcessors = {
      Capture: async (_payload: unknown, storySession: { functionGlobals?: Record<string, unknown> }) => {
        seenGlobals = storySession.functionGlobals;
        return actionResult(null);
      },
    };

    const processors = await getInlineFunctionExecuteActionProcessor(qpqConfig, async () => null);
    const process = processors[InlineFunctionActionType.Execute] as (p: any, ...rest: any[]) => Promise<any>;

    const callerSession = {
      correlation: 'corr-0',
      depth: 0,
      context: {},
      localContext: {},
      functionGlobals: { eventDocUserDirectory: 'users' },
    } as any;

    await process(
      { functionName: 'handler', payload: {} },
      callerSession,
      actionProcessors,
      logger,
      undefined,
      async () => capturesSession,
      createStreamRegistry(),
    );

    expect(seenGlobals).toEqual({ eventDocUserDirectory: 'users' });
  });

  it('propagates a story error as an action error', async () => {
    function* failStory(): any {
      yield { type: 'Fails' };
      return 'unreachable';
    }

    const actionProcessors = { Fails: async () => actionResultError(ErrorTypeEnum.NotFound, 'boom') };

    const result = await invoke({ functionName: 'handler', payload: {} }, actionProcessors, async () => failStory);

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.NotFound);
  });
});
