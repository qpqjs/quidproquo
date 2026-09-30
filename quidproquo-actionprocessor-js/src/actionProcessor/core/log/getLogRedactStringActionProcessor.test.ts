import { buildTestQpqConfig, buildTestStorySession, createStubLogger, LogActionType, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getLogRedactStringActionProcessor } from './getLogRedactStringActionProcessor';

describe('getLogRedactStringActionProcessor', () => {
  it('does nothing and returns nothing (the value only needs to reach the log)', async () => {
    const log = vi.fn();
    const processor = (await getLogRedactStringActionProcessor(buildTestQpqConfig(), async () => null))[LogActionType.RedactString] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const result = await processor({ value: 's3cr3t-value' }, buildTestStorySession(), {}, createStubLogger(log));

    expect(resolveActionResult(result)).toBeUndefined();
    expect(log).not.toHaveBeenCalled();
  });
});
