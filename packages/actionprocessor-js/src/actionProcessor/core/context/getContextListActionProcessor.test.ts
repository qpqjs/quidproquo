import { buildTestQpqConfig, buildTestStorySession, ContextActionType, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getContextListActionProcessor } from './getContextListActionProcessor';

describe('getContextListActionProcessor', () => {
  it('returns the whole shared context', async () => {
    const processor = (await getContextListActionProcessor(buildTestQpqConfig(), async () => null))[ContextActionType.List] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;
    const context = { tenant: 'acme', region: 'us-east-1' };

    const result = await processor(undefined, buildTestStorySession({ context }));

    expect(resolveActionResult(result)).toEqual(context);
  });
});
