import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { ConfigActionType } from './ConfigActionType';

export const askConfigGetGlobalBase = createActionRequester<unknown>()({
  actionType: ConfigActionType.GetGlobal,
  getPayload: (globalName: string) => ({ globalName }),
});

// The stored global's type is only known to the caller, so the base returns unknown
// and this story casts it to what the caller declared.
export function* askConfigGetGlobal<T>(globalName: string): AskResponse<T> {
  return (yield* askConfigGetGlobalBase(globalName)) as T;
}
