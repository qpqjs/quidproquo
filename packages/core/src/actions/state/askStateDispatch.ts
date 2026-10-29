import { Action } from '../../types/Action';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { StateActionType } from './StateActionType';

export type StateDispatchActionPayload<T> = {
  action: T;
};

export type StateDispatchAction<T> = {
  type: StateActionType.Dispatch;
  payload: StateDispatchActionPayload<T>;
} & Action<StateDispatchActionPayload<T>>;

export const askStateDispatchBase = createActionRequester<void>()({
  actionType: StateActionType.Dispatch,
  getPayload: (action: unknown) => ({ action }),
});

// Generic so callers can pin the effect/action shape they are dispatching at the call site.
export function* askStateDispatch<T>(action: T): AskResponse<void> {
  return yield* askStateDispatchBase(action);
}
