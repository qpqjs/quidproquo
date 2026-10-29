import { createActionRequester } from '../../logic/actions/createActionRequester';
import { AskResponse } from '../../types/StorySession';
import { StateActionType } from './StateActionType';

export type StateDispatchActionPayload<T> = {
  action: T;
};

export const askStateDispatchBase = createActionRequester<void>()({
  actionType: StateActionType.Dispatch,
  getPayload: (action: unknown) => ({ action }),
});

// Generic so callers can pin the effect/action shape they are dispatching at the call site.
export function* askStateDispatch<T>(action: T): AskResponse<void> {
  return yield* askStateDispatchBase(action);
}
