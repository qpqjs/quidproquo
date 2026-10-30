import { resolveActionResult, SystemActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';

import { getLambdaRuntimeRemainingTimeActionProcessor } from './getLambdaRuntimeRemainingTimeActionProcessor';

describe('getLambdaRuntimeRemainingTimeActionProcessor', () => {
  it('reads the live remaining time from the invocation context', async () => {
    let remaining = 9000;
    const context = { getRemainingTimeInMillis: () => remaining } as unknown as Context;

    const processors = await getLambdaRuntimeRemainingTimeActionProcessor(context)(buildTestQpqConfig(), noopDynamicModuleLoader);
    const processor = processors[SystemActionType.GetRuntimeRemainingTime]!;

    expect(resolveActionResult(await invokeProcessor(processor, undefined))).toBe(9000);

    remaining = 1500;

    expect(resolveActionResult(await invokeProcessor(processor, undefined))).toBe(1500);
  });
});
