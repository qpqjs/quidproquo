import { buildTestQpqConfig, GuidActionType, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getGuidNewSortableActionProcessor } from './getGuidNewSortableActionProcessor';

vi.mock('uuidv7', () => ({
  uuidv7: () => '018f0000-0000-7000-8000-000000000000',
}));

describe('getGuidNewSortableActionProcessor', () => {
  it('returns a sortable v7 uuid', async () => {
    const processor = (await getGuidNewSortableActionProcessor(buildTestQpqConfig(), async () => null))[GuidActionType.NewSortable] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const result = await processor(undefined, undefined as any);

    expect(resolveActionResult(result)).toBe('018f0000-0000-7000-8000-000000000000');
  });
});
