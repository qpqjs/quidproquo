import { AskResponse, createActionRequester } from 'quidproquo-core';

import { StateMachineActionType } from './StateMachineActionType';

/** An event sent to a state machine; extra fields ride along to guard and action stories. */
export type StateMachineEvent = {
  type: string;
  [key: string]: unknown;
};

export const askStateMachineSendEventBase = createActionRequester<unknown>()({
  actionType: StateMachineActionType.SendEvent,
  getPayload: (stateMachineName: string, id: string, event: StateMachineEvent) => ({ stateMachineName, id, event }),
});

/**
 * Sends an event to a state machine instance, persisting the transition and
 * running any configured guard and action stories. Errors with BadRequest when
 * the event is not valid for the current state.
 */
export function* askStateMachineSendEvent<T>(stateMachineName: string, id: string, event: StateMachineEvent): AskResponse<T> {
  return (yield* askStateMachineSendEventBase(stateMachineName, id, event)) as T;
}
