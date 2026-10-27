import { buildTestQpqConfig, resolveActionResult, StreamActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getStreamReadActionProcessor } from './getStreamReadActionProcessor';

const qpqConfig = buildTestQpqConfig();

describe('getStreamReadActionProcessor', () => {
  it('reads the next chunk from the registry and returns it', async () => {
    const chunk = { done: false, data: 'hello' };
    const streamRegistry = { read: vi.fn().mockResolvedValue(chunk) } as any;

    const processors = await getStreamReadActionProcessor(qpqConfig, async () => null);
    const process = processors[StreamActionType.Read] as (p: any, ...rest: any[]) => Promise<any>;

    const result = await process({ streamId: 's1', noWait: true }, undefined, undefined, undefined, undefined, undefined, streamRegistry);

    expect(streamRegistry.read).toHaveBeenCalledWith('s1', true);
    expect(resolveActionResult(result)).toEqual(chunk);
  });
});
