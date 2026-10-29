import { askStreamReadBase, resolveActionResult, StreamActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { getStreamReadActionProcessor } from './getStreamReadActionProcessor';

const qpqConfig = buildTestQpqConfig();

const read = async (streamRegistry: unknown, payload = { streamId: 's1', noWait: true }) => {
  const processors = await getStreamReadActionProcessor(qpqConfig, noopDynamicModuleLoader);
  return invokeProcessor(processors[StreamActionType.Read]!, payload, { streamRegistry });
};

describe('getStreamReadActionProcessor', () => {
  it('reads the next chunk from the registry and returns it', async () => {
    const chunk = { done: false, data: 'hello' };
    const streamRegistry = { has: () => true, read: vi.fn().mockResolvedValue(chunk) };

    const result = await read(streamRegistry);

    expect(streamRegistry.read).toHaveBeenCalledWith('s1', true);
    expect(resolveActionResult(result)).toEqual(chunk);
  });

  it('answers StreamNotFound for an id the registry does not hold', async () => {
    const streamRegistry = { has: () => false, read: vi.fn() };

    const [, error] = await read(streamRegistry);

    expect(error?.errorType).toBe(askStreamReadBase.errorType.StreamNotFound);
    expect(streamRegistry.read).not.toHaveBeenCalled();
  });

  it('answers StreamFailed with the producer error when the read rejects', async () => {
    const streamRegistry = { has: () => true, read: vi.fn().mockRejectedValue(new Error('upstream closed')) };

    const [, error] = await read(streamRegistry);

    expect(error?.errorType).toBe(askStreamReadBase.errorType.StreamFailed);
    expect(error?.errorText).toContain('upstream closed');
  });
});
