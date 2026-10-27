import { buildTestQpqConfig, MathActionType, resolveActionResult } from 'quidproquo-core';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { getMathRandomNumberActionProcessor } from './getMathRandomNumberActionProcessor';

describe('getMathRandomNumberActionProcessor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the value produced by Math.random', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4242);
    const processor = (await getMathRandomNumberActionProcessor(buildTestQpqConfig(), async () => null))[MathActionType.RandomNumber] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const result = await processor(undefined, undefined as any);

    expect(resolveActionResult(result)).toBe(0.4242);
  });
});
