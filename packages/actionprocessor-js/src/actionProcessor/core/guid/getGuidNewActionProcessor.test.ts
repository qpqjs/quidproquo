import { GuidActionType, resolveActionResult } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getGuidNewActionProcessor } from './getGuidNewActionProcessor';

const V4_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('getGuidNewActionProcessor', () => {
  it('returns a fresh v4 uuid on every call', async () => {
    const processor = (await getGuidNewActionProcessor(buildTestQpqConfig(), async () => null))[GuidActionType.New]!;

    const first = resolveActionResult(await invokeProcessor<string>(processor, undefined));
    const second = resolveActionResult(await invokeProcessor<string>(processor, undefined));

    expect(first).toMatch(V4_UUID);
    expect(second).toMatch(V4_UUID);
    expect(first).not.toBe(second);
  });
});
