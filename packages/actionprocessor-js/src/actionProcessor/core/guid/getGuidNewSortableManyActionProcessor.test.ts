import { buildTestQpqConfig, GuidActionType, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getGuidNewSortableManyActionProcessor } from './getGuidNewSortableManyActionProcessor';

const { mint } = vi.hoisted(() => {
  let calls = 0;
  return { mint: () => `018f0000-0000-7000-8000-${String(calls++).padStart(12, '0')}` };
});

vi.mock('uuidv7', () => ({
  uuidv7: () => mint(),
}));

describe('getGuidNewSortableManyActionProcessor', () => {
  it('returns count ids in mint (= sort) order', async () => {
    const processor = (await getGuidNewSortableManyActionProcessor(buildTestQpqConfig(), async () => null))[GuidActionType.NewSortableMany] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const result = await processor({ count: 3 }, undefined as any);

    const ids = resolveActionResult(result) as string[];
    expect(ids).toHaveLength(3);
    expect([...ids].sort()).toEqual(ids);
    expect(new Set(ids).size).toBe(3);
  });
});
