import { buildTestQpqConfig, buildTestStorySession, resolveActionResult, SystemActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getSystemGetRuntimeCorrelationActionProcessor } from './getSystemGetRuntimeCorrelationActionProcessor';

describe('getSystemGetRuntimeCorrelationActionProcessor', () => {
  it('returns the correlation id from the session', async () => {
    const processor = (await getSystemGetRuntimeCorrelationActionProcessor(buildTestQpqConfig(), async () => null))[
      SystemActionType.GetRuntimeCorrelation
    ] as (p: any, ...rest: any[]) => Promise<any>;

    const result = await processor(undefined, buildTestStorySession({ correlation: 'corr-42' }));

    expect(resolveActionResult(result)).toBe('corr-42');
  });
});
