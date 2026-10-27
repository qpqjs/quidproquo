import { Action } from '../../types/Action';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { StateActionType } from './StateActionType';

export type StateReadActionPayload = {
  path?: string;
};

export interface StateReadAction extends Action<StateReadActionPayload> {
  type: StateActionType.Read;
  payload: StateReadActionPayload;
}

export const askStateReadBase = createActionRequester<unknown>()({
  actionType: StateActionType.Read,
  getPayload: (path?: string) => ({ path }),
});

// The state's shape at the given path is only known to the caller, so the base returns
// unknown and this story casts it to what the caller declared.
export function* askStateRead<R>(path?: string): AskResponse<R> {
  return (yield* askStateReadBase(path)) as R;
}
