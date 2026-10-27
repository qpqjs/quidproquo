import { buildTestQpqConfig, PlatformActionType, resolveActionResult } from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getPlatformDelayActionProcessor } from './getPlatformDelayActionProcessor';

describe('getPlatformDelayActionProcessor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the requested delay elapses', async () => {
    const processor = (await getPlatformDelayActionProcessor(buildTestQpqConfig(), async () => null))[PlatformActionType.Delay] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const pending = processor({ timeMs: 1000 }, undefined as any);
    await vi.advanceTimersByTimeAsync(1000);

    expect(resolveActionResult(await pending)).toBeUndefined();
  });
});
