import { describe, expect, it, vi } from 'vitest';

import { actionResult } from '../logic/actionLogic';
import { buildTestQpqConfig } from '../testing/configTesting';
import {
  buildActionProcessorResolver,
  buildTestStorySession,
  createStubLogger,
  getTestTimeNow,
  noopDynamicModuleLoader,
} from '../testing/runtimeTesting';
import { AskResponse, QpqRuntimeType } from '../types/StorySession';
import { createRuntime } from './createRuntime';

describe('createRuntime', () => {
  it('returns a runner that resolves a story through the full pipeline', async () => {
    const logSpy = vi.fn();

    const runStory = createRuntime(
      buildTestQpqConfig(),
      buildTestStorySession(),
      buildActionProcessorResolver({ Double: async (payload: number) => actionResult(payload * 2) }),
      getTestTimeNow,
      createStubLogger(logSpy),
      'corr-runtime',
      QpqRuntimeType.UNIT_TEST,
      noopDynamicModuleLoader as any,
    );

    function* story(n: number): AskResponse<number> {
      const doubled: number = yield { type: 'Double', payload: n };
      return doubled + 1;
    }

    const result = await runStory(story, [10]);

    expect(result.result).toBe(21);
    expect(result.runtimeType).toBe(QpqRuntimeType.UNIT_TEST);
    expect(logSpy).toHaveBeenCalledOnce();
  });
});
