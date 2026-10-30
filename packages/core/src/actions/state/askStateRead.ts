import { createActionRequester } from '../../logic/actions/createActionRequester';
import { AskResponse } from '../../types/StorySession';
import { StateActionType } from './StateActionType';

export type StateReadActionPayload = {
  path?: string;
};

export const askStateReadBase = createActionRequester<unknown>()({
  actionType: StateActionType.Read,
  getPayload: (path?: string) => ({ path }),
});

// The state's shape at the given path is only known to the caller, so the base returns
// unknown and this story casts it to what the caller declared.
export function* askStateRead<R>(path?: string): AskResponse<R> {
  return (yield* askStateReadBase(path)) as R;
}
