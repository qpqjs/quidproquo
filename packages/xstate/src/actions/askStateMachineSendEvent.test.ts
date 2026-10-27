import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askStateMachineSendEvent } from './askStateMachineSendEvent';
import { StateMachineActionType } from './StateMachineActionType';

describe('askStateMachineSendEvent', () => {
  it('yields a SendEvent action carrying the name, id and event', () => {
    const { action } = captureRequester(askStateMachineSendEvent('order', 'order-1', { type: 'SUBMIT' }));

    expect(action).toEqual({
      type: StateMachineActionType.SendEvent,
      payload: { stateMachineName: 'order', id: 'order-1', event: { type: 'SUBMIT' } },
    });
  });

  it('returns the entity the runtime resolves', () => {
    const entity = { id: 'order-1' };
    const { returned } = captureRequester(askStateMachineSendEvent('order', 'order-1', { type: 'SUBMIT' }), entity);

    expect(returned).toBe(entity);
  });
});
