import { buildTestQpqConfig, DateActionType, resolveActionResult } from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDateNowActionProcessor } from './getDateNowActionProcessor';

describe('getDateNowActionProcessor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-26T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current time as an ISO string', async () => {
    const processor = (await getDateNowActionProcessor(buildTestQpqConfig(), async () => null))[DateActionType.Now] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const result = await processor(undefined, undefined as any);

    expect(resolveActionResult(result)).toBe('2026-06-26T12:00:00.000Z');
  });
});
