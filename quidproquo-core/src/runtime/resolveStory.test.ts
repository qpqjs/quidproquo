import { describe, expect, it, vi } from 'vitest';

import { actionResult, actionResultError } from '../logic/actionLogic';
import { buildTestQpqConfig } from '../testing/configTesting';
import {
  buildActionProcessorResolver,
  buildTestStorySession,
  createStubLogger,
  getTestTimeNow,
  noopDynamicModuleLoader,
} from '../testing/runtimeTesting';
import { Action } from '../types/Action';
import { ErrorTypeEnum } from '../types/ErrorTypeEnum';
import { AskResponse, QpqRuntimeType } from '../types/StorySession';
import { resolveStory } from './resolveStory';

const qpqConfig = buildTestQpqConfig();
const logger = createStubLogger();

const run = (story: any, args: any[], processors: any, callerSession = buildTestStorySession()) =>
  resolveStory(
    story,
    args,
    qpqConfig,
    callerSession,
    buildActionProcessorResolver(processors),
    getTestTimeNow,
    logger,
    'corr-run',
    QpqRuntimeType.UNIT_TEST,
    noopDynamicModuleLoader as any,
  );

const runWithRuntimeInfo = (story: any, args: any[], processors: any, dynamicModuleLoader: any, qpqFunctionRuntimeInfo: any) =>
  resolveStory(
    story,
    args,
    qpqConfig,
    buildTestStorySession(),
    buildActionProcessorResolver(processors),
    getTestTimeNow,
    logger,
    'corr-run',
    QpqRuntimeType.UNIT_TEST,
    dynamicModuleLoader,
    qpqFunctionRuntimeInfo,
  );

describe('resolveStory', () => {
  it('runs a story to completion and records history per action', async () => {
    function* story(): AskResponse<string> {
      const a: string = yield { type: 'First' };
      const b: string = yield { type: 'Second' };
      return `${a}-${b}`;
    }

    const result = await run(story, [], {
      First: async () => actionResult('one'),
      Second: async () => actionResult('two'),
    });

    expect(result.result).toBe('one-two');
    expect(result.error).toBeUndefined();
    expect(result.history).toHaveLength(2);
    expect(result.moduleName).toBe('test-module');
    expect(result.runtimeType).toBe(QpqRuntimeType.UNIT_TEST);
    expect(result.correlation).toBe('corr-run');
    expect(result.fromCorrelation).toBe('corr-0');
  });

  it('stops with an error when a processor errors and the action does not return errors', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    function* story(): AskResponse<string> {
      yield { type: 'Fails' };
      yield { type: 'NeverReached' };
      return 'done';
    }

    const result = await run(story, [], {
      Fails: async () => actionResultError(ErrorTypeEnum.NotFound, 'gone'),
      NeverReached: async () => actionResult('nope'),
    });

    expect(result.result).toBeUndefined();
    expect(result.error?.errorType).toBe(ErrorTypeEnum.NotFound);
    expect(result.error?.errorText).toBe('gone');
    expect(result.history).toHaveLength(1);

    vi.restoreAllMocks();
  });

  it('feeds an errored result back to the story when returnErrors is set', async () => {
    function* story(): AskResponse<string> {
      const either = yield { type: 'MaybeFails', returnErrors: true } as Action<any>;
      if (!either.success) {
        return `caught:${either.error.errorText}`;
      }
      return 'unexpected';
    }

    const result = await run(story, [], {
      MaybeFails: async () => actionResultError(ErrorTypeEnum.BadRequest, 'oops'),
    });

    expect(result.error).toBeUndefined();
    expect(result.result).toBe('caught:oops');
  });

  it('persists updateSession changes from one processor to the next action', async () => {
    function* story(): AskResponse<string> {
      yield { type: 'Login' };
      const token: string = yield { type: 'WhoAmI' };
      return token;
    }

    const login = async (_payload: any, _session: any, _processors: any, _logger: any, updateSession: any) => {
      updateSession({ decodedAccessToken: { userId: 'user-1' } });
      return actionResult(null);
    };

    const result = await run(story, [], {
      Login: login,
      WhoAmI: async (_payload: any, session: any) => actionResult(session.decodedAccessToken?.userId),
    });

    expect(result.result).toBe('user-1');
  });

  it('returns a depth-exceeded error when the caller session is too deep', async () => {
    function* story(): AskResponse<string> {
      return 'never';
    }

    const result = await run(story, [], {}, buildTestStorySession({ depth: 101 }));

    expect(result.error?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(result.error?.errorText).toContain('Story depth exceeded');
  });

  it('merges runtime-attached action processor overrides over the base list', async () => {
    function* story(): AskResponse<string> {
      const base: string = yield { type: 'BaseOnly' };
      const overridden: string = yield { type: 'Overridden' };
      return `${base}-${overridden}`;
    }

    // The runtime attaches one override source; the loader resolves it to a
    // resolver providing a replacement for the Overridden action only.
    const loadOverrideSource = async () => async () => ({
      Overridden: async () => actionResult('override'),
    });

    const runtimeInfo = {
      basePath: '/service/src',
      relativePath: '/overrides::getOverrides',
      functionName: 'getOverrides',
      actionProcessors: [{ basePath: '/service/src', relativePath: '/overrides/impl::getOverrides', functionName: 'getOverrides' }],
    };

    const result = await runWithRuntimeInfo(
      story,
      [],
      {
        BaseOnly: async () => actionResult('base'),
        Overridden: async () => actionResult('service-wide'),
      },
      loadOverrideSource,
      runtimeInfo,
    );

    expect(result.error).toBeUndefined();
    expect(result.result).toBe('base-override');
  });

  it('does not load overrides for a runtime with none attached', async () => {
    function* story(): AskResponse<string> {
      const value: string = yield { type: 'Ping' };
      return value;
    }

    const loader = vi.fn();

    const result = await runWithRuntimeInfo(story, [], { Ping: async () => actionResult('pong') }, loader, '/plain/relative::runtime');

    expect(result.error).toBeUndefined();
    expect(result.result).toBe('pong');
    expect(loader).not.toHaveBeenCalled();
  });

  it('captures an uncaught throw as a GenericError', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    function* story(): AskResponse<string> {
      throw new Error('kaboom');
    }

    const result = await run(story, [], {});

    expect(result.error?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(result.error?.errorText).toBe('kaboom');

    vi.restoreAllMocks();
  });
});
