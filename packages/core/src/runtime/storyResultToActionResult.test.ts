import { describe, expect, it } from 'vitest';

import { isErroredActionResult, resolveActionResult, resolveActionResultError } from '../logic/actionLogic';
import { ErrorTypeEnum } from '../types/ErrorTypeEnum';
import { QpqRuntimeType, StoryResult } from '../types/StorySession';
import { storyResultToActionResult } from './storyResultToActionResult';

const buildStoryResult = (overrides: Partial<StoryResult<any>>): StoryResult<any> => ({
  input: [],
  session: { depth: 0, context: {} },
  history: [],
  startedAt: '',
  finishedAt: '',
  correlation: 'corr',
  tags: [],
  moduleName: 'test-module',
  runtimeType: QpqRuntimeType.EXECUTE_STORY,
  ...overrides,
});

describe('storyResultToActionResult', () => {
  it('returns the story result on success', () => {
    const result = storyResultToActionResult(buildStoryResult({ result: 42 }), 'fn');

    expect(isErroredActionResult(result)).toBe(false);
    expect(resolveActionResult(result)).toBe(42);
  });

  it('puts the label in front of the error stack', () => {
    const result = storyResultToActionResult(
      buildStoryResult({ error: { errorType: ErrorTypeEnum.NotFound, errorText: 'missing', errorStack: 'inner' } }),
      'fn',
    );

    expect(resolveActionResultError(result)).toEqual({ errorType: ErrorTypeEnum.NotFound, errorText: 'missing', errorStack: 'fn -> [inner]' });
  });

  it('uses the label as the stack when the error has none', () => {
    const result = storyResultToActionResult(buildStoryResult({ error: { errorType: ErrorTypeEnum.GenericError, errorText: 'boom' } }), 'fn');

    expect(resolveActionResultError(result).errorStack).toBe('fn');
  });
});
