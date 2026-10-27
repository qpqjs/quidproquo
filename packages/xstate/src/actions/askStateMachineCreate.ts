import { AskResponse, createActionRequester } from 'quidproquo-core';

import { StateMachineActionType } from './StateMachineActionType';

export const askStateMachineCreateBase = createActionRequester<unknown>()({
  actionType: StateMachineActionType.Create,
  getPayload: (stateMachineName: string, id: string, item: unknown) => ({ stateMachineName, id, item }),
});

/** Creates a state machine entity from item, persisting it with the machine's initial snapshot, and returns the stored entity. */
export function* askStateMachineCreate<T>(stateMachineName: string, id: string, item: T): AskResponse<T> {
  return (yield* askStateMachineCreateBase(stateMachineName, id, item)) as T;
}
