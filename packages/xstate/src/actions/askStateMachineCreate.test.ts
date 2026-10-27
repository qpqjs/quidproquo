import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askStateMachineCreate } from './askStateMachineCreate';
import { StateMachineActionType } from './StateMachineActionType';

describe('askStateMachineCreate', () => {
  it('yields a Create action carrying the name, id and item', () => {
    const { action } = captureRequester(askStateMachineCreate('order', 'order-1', { total: 10 }));

    expect(action).toEqual({
      type: StateMachineActionType.Create,
      payload: { stateMachineName: 'order', id: 'order-1', item: { total: 10 } },
    });
  });

  it('returns the entity the runtime resolves', () => {
    const entity = { id: 'order-1', total: 10 };
    const { returned } = captureRequester(askStateMachineCreate('order', 'order-1', { total: 10 }), entity);

    expect(returned).toBe(entity);
  });
});
