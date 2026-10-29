import { StateActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { getStateDispatchActionListResolver } from './getStateDispatchActionProcessor';

describe('getStateDispatchActionListResolver', () => {
  it('resolves a Dispatch processor that forwards the action to dispatch', async () => {
    const dispatch = vi.fn();
    const processors = await getStateDispatchActionListResolver(dispatch)(buildTestQpqConfig(), noopDynamicModuleLoader);

    const result = await invokeProcessor(processors[StateActionType.Dispatch]!, { action: { type: 'inc' } });

    expect(dispatch).toHaveBeenCalledWith({ type: 'inc' });
    expect(result).toEqual([undefined]);
  });
});
