import { buildTestQpqConfig, buildTestStorySession, resolveActionResult, SystemActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getSystemGetRuntimeRemainingTimeActionProcessor } from './getSystemGetRuntimeRemainingTimeActionProcessor';

describe('getSystemGetRuntimeRemainingTimeActionProcessor', () => {
  it('reports an effectively unlimited budget', async () => {
    const processor = (await getSystemGetRuntimeRemainingTimeActionProcessor(buildTestQpqConfig(), async () => null))[
      SystemActionType.GetRuntimeRemainingTime
    ] as (p: any, ...rest: any[]) => Promise<any>;

    const result = await processor(undefined, buildTestStorySession());

    expect(resolveActionResult(result)).toBe(Number.MAX_SAFE_INTEGER);
  });
});
