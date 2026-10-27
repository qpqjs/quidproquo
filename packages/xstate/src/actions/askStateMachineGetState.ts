import { createActionRequester } from 'quidproquo-core';

import { StateMachineActionType } from './StateMachineActionType';

/** The current machine state: the state value (objects serialised to JSON) and whether a final state was reached. */
export type StateMachineStateInfo = {
  value: string;
  done: boolean;
};

export const askStateMachineGetState = createActionRequester<StateMachineStateInfo>()({
  actionType: StateMachineActionType.GetState,
  getPayload: (stateMachineName: string, id: string) => ({ stateMachineName, id }),
});
