import { StateActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getStateReadActionListResolver } from './getStateReadActionProcessor';

describe('getStateReadActionListResolver', () => {
  it('resolves a Read processor that returns the current state', async () => {
    const processors = await getStateReadActionListResolver(() => ({ count: 3 }))({} as any, {} as any);
    const result = await processors[StateActionType.Read]({} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);

    expect(result).toEqual([{ count: 3 }]);
  });
});
