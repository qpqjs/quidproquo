import { buildTestStorySession, resolveActionResult, SystemActionType } from 'quidproquo-core';

import { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';

import { getLambdaRuntimeRemainingTimeActionProcessor } from './getLambdaRuntimeRemainingTimeActionProcessor';

describe('getLambdaRuntimeRemainingTimeActionProcessor', () => {
  it('reads the live remaining time from the invocation context', async () => {
    let remaining = 9000;
    const context = { getRemainingTimeInMillis: () => remaining } as unknown as Context;

    const processor = getLambdaRuntimeRemainingTimeActionProcessor(context)[SystemActionType.GetRuntimeRemainingTime];

    expect(
      resolveActionResult(
        await processor(
          undefined,
          buildTestStorySession(),
          {},
          {} as any,
          () => {},
          async () => null,
          {} as any,
        ),
      ),
    ).toBe(9000);

    remaining = 1500;

    expect(
      resolveActionResult(
        await processor(
          undefined,
          buildTestStorySession(),
          {},
          {} as any,
          () => {},
          async () => null,
          {} as any,
        ),
      ),
    ).toBe(1500);
  });
});
