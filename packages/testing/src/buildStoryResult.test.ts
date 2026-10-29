import { QpqRuntimeType } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { buildStoryResult } from './buildStoryResult';
import { TEST_TIME_NOW } from './runtimeTesting';

describe('buildStoryResult', () => {
  it('fills every required field with a fixed value', () => {
    const result = buildStoryResult();

    expect(result).toMatchObject({
      input: [],
      history: [],
      startedAt: TEST_TIME_NOW,
      finishedAt: TEST_TIME_NOW,
      correlation: 'corr-1',
      tags: [],
      moduleName: 'test-module',
      runtimeType: QpqRuntimeType.UNIT_TEST,
    });
    expect(result.session.correlation).toBe('corr-0');
  });

  it('applies overrides on top', () => {
    const result = buildStoryResult<[number], string>({ input: [1], result: 'done', correlation: 'corr-9' });

    expect(result.input).toEqual([1]);
    expect(result.result).toBe('done');
    expect(result.correlation).toBe('corr-9');
    expect(result.moduleName).toBe('test-module');
  });
});
