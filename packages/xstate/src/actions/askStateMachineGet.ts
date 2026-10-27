import { AskResponse, createActionRequester } from 'quidproquo-core';

import { StateMachineActionType } from './StateMachineActionType';

export const askStateMachineGetBase = createActionRequester<unknown>()({
  actionType: StateMachineActionType.Get,
  getPayload: (stateMachineName: string, id: string) => ({ stateMachineName, id }),
});

/** Returns the stored entity for a state machine instance, including its persisted machine state. */
export function* askStateMachineGet<T>(stateMachineName: string, id: string): AskResponse<T> {
  return (yield* askStateMachineGetBase(stateMachineName, id)) as T;
}
