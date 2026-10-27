import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askStateMachineGetState } from './askStateMachineGetState';
import { StateMachineActionType } from './StateMachineActionType';

describe('askStateMachineGetState', () => {
  it('yields a GetState action carrying the name and id', () => {
    const { action } = captureRequester(askStateMachineGetState('order', 'order-1'));

    expect(action).toEqual({
      type: StateMachineActionType.GetState,
      payload: { stateMachineName: 'order', id: 'order-1' },
    });
  });

  it('returns the state info the runtime resolves', () => {
    const stateInfo = { value: 'active', done: false };
    const { returned } = captureRequester(askStateMachineGetState('order', 'order-1'), stateInfo);

    expect(returned).toBe(stateInfo);
  });
});
