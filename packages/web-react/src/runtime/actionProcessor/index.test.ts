import { StateActionType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getStateActionProcessor } from './index';

describe('getStateActionProcessor', () => {
  it('resolves both the Read and Dispatch processors', async () => {
    const dispatch = vi.fn();
    const processors = await getStateActionProcessor(dispatch, () => ({ count: 1 }))({} as any, {} as any);

    expect(Object.keys(processors).sort()).toEqual([StateActionType.Dispatch, StateActionType.Read].sort());

    const readResult = await processors[StateActionType.Read]({} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    await processors[StateActionType.Dispatch]({ action: { type: 'x' } }, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);

    expect(readResult).toEqual([{ count: 1 }]);
    expect(dispatch).toHaveBeenCalledWith({ type: 'x' });
  });
});
