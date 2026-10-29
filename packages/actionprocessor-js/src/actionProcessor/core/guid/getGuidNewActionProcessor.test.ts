import { GuidActionType, resolveActionResult } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { getGuidNewActionProcessor } from './getGuidNewActionProcessor';

vi.mock('@qpqjs/core', async (importActual: () => Promise<typeof import('@qpqjs/core')>) => {
  const actual = await importActual();
  return {
    ...actual,
    generateUuid: () => '00000000-0000-4000-8000-000000000000',
  };
});

describe('getGuidNewActionProcessor', () => {
  it('returns a v4 uuid', async () => {
    const processor = (await getGuidNewActionProcessor(buildTestQpqConfig(), async () => null))[GuidActionType.New] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const result = await processor(undefined, undefined as any);

    expect(resolveActionResult(result)).toBe('00000000-0000-4000-8000-000000000000');
  });
});
