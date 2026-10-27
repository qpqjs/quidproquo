import { buildTestQpqConfig, isErroredActionResult, StreamActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getStreamCloseActionProcessor } from './getStreamCloseActionProcessor';

const qpqConfig = buildTestQpqConfig();

describe('getStreamCloseActionProcessor', () => {
  it('closes the stream in the registry and returns success', async () => {
    const streamRegistry = { close: vi.fn() } as any;

    const processors = await getStreamCloseActionProcessor(qpqConfig, async () => null);
    const process = processors[StreamActionType.Close] as (p: any, ...rest: any[]) => Promise<any>;

    const result = await process({ streamId: 's1' }, undefined, undefined, undefined, undefined, undefined, streamRegistry);

    expect(streamRegistry.close).toHaveBeenCalledWith('s1');
    expect(isErroredActionResult(result)).toBe(false);
  });
});
