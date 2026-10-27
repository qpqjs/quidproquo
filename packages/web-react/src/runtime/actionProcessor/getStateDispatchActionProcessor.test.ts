import { StateActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getStateDispatchActionListResolver } from './getStateDispatchActionProcessor';

describe('getStateDispatchActionListResolver', () => {
  it('resolves a Dispatch processor that forwards the action to dispatch', async () => {
    const dispatch = vi.fn();
    const processors = await getStateDispatchActionListResolver(dispatch)({} as any, {} as any);

    const result = await processors[StateActionType.Dispatch](
      { action: { type: 'inc' } },
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    expect(dispatch).toHaveBeenCalledWith({ type: 'inc' });
    expect(result).toEqual([undefined]);
  });
});
