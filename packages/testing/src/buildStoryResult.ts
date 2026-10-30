import { QpqRuntimeType, StoryResult } from '@qpqjs/core';

import { buildTestStorySession, TEST_TIME_NOW } from './runtimeTesting';

/**
 * A complete story result for tests that read one (loggers, redaction, the trace replay, the
 * admin log views): every required field has a fixed, assertable value and `overrides` replaces
 * only the fields a test is about, so no test needs to cast a partial object.
 */
export const buildStoryResult = <TArgs extends unknown[] = unknown[], TResult = unknown>(
  overrides: Partial<StoryResult<TArgs, TResult>> = {},
): StoryResult<TArgs, TResult> => ({
  input: [] as unknown as TArgs,
  session: buildTestStorySession(),
  history: [],
  startedAt: TEST_TIME_NOW,
  finishedAt: TEST_TIME_NOW,
  correlation: 'corr-1',
  tags: [],
  moduleName: 'test-module',
  runtimeType: QpqRuntimeType.UNIT_TEST,
  ...overrides,
});
