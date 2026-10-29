import { buildTestQpqConfig } from '@qpqjs/testing';
import {
  buildActionProcessorList,
  buildTestStorySession,
  createStubLogger,
  getTestTimeNow,
  noopDynamicModuleLoader,
  testRandomGuid,
} from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { actionResult, isErroredActionResult, resolveActionResult, resolveActionResultError } from './logic/actionLogic';
import { AskResponse, QpqRuntimeType } from './types/StorySession';
import { createImplementationRuntime, getProcessCustomImplementation } from './createImplementationRuntime';

const qpqConfig = buildTestQpqConfig();

describe('createImplementationRuntime', () => {
  it('runs a story with incremented depth, implementation runtime type, and module::guid correlation', async () => {
    const runStory = createImplementationRuntime(
      qpqConfig,
      ['tag-a'],
      getTestTimeNow,
      testRandomGuid,
      buildTestStorySession({ depth: 3 }),
      buildActionProcessorList({ Echo: async (payload: string) => actionResult(payload) }),
      createStubLogger(),
      noopDynamicModuleLoader as any,
    );

    function* story(msg: string): AskResponse<string> {
      return yield { type: 'Echo', payload: msg };
    }

    const result = await runStory(story, ['hi']);

    expect(result.result).toBe('hi');
    expect(result.runtimeType).toBe(QpqRuntimeType.EXECUTE_IMPLEMENTATION_STORY);
    expect(result.correlation).toBe('test-module::guid-0');
    expect(result.session.depth).toBe(5);
    expect(result.tags).toEqual(['tag-a']);
  });
});

describe('getProcessCustomImplementation', () => {
  const invoke = (processor: any, payload: any) =>
    processor(
      payload,
      buildTestStorySession(),
      buildActionProcessorList({ Echo: async (p: string) => actionResult(p) }),
      createStubLogger(),
      () => {},
      noopDynamicModuleLoader,
      {} as any,
    );

  it('returns actionResult of the story result on success', async () => {
    function* story(msg: string): AskResponse<string> {
      const echoed: string = yield { type: 'Echo', payload: msg };
      return `${echoed}!`;
    }

    const processor = getProcessCustomImplementation(qpqConfig, story as any, 'impl', null, getTestTimeNow, testRandomGuid);
    const result = await invoke(processor, 'hey');

    expect(isErroredActionResult(result)).toBe(false);
    expect(resolveActionResult(result)).toBe('hey!');
  });

  it('returns actionResultError when the story errors', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    function* story(): AskResponse<string> {
      throw new Error('impl boom');
    }

    const processor = getProcessCustomImplementation(qpqConfig, story as any, 'impl', null, getTestTimeNow, testRandomGuid);
    const result = await invoke(processor, undefined);

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorText).toBe('An unexpected error occurred [Error].');
    expect(resolveActionResultError(result).errorStack).toContain('impl boom');

    vi.restoreAllMocks();
  });
});
