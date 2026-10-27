import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askStateMachineGet } from './askStateMachineGet';
import { StateMachineActionType } from './StateMachineActionType';

describe('askStateMachineGet', () => {
  it('yields a Get action carrying the name and id', () => {
    const { action } = captureRequester(askStateMachineGet('order', 'order-1'));

    expect(action).toEqual({
      type: StateMachineActionType.Get,
      payload: { stateMachineName: 'order', id: 'order-1' },
    });
  });

  it('returns the entity the runtime resolves', () => {
    const entity = { id: 'order-1' };
    const { returned } = captureRequester(askStateMachineGet('order', 'order-1'), entity);

    expect(returned).toBe(entity);
  });
});
