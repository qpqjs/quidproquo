import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { InlineFunctionActionType } from './InlineFunctionActionType';

export const askInlineFunctionExecuteBase = createActionRequester<unknown>()({
  actionType: InlineFunctionActionType.Execute,
  getPayload: (functionName: string, payload: unknown) => ({ functionName, payload }),
});

// The function's payload and result types are only known to the caller, so the base
// takes and returns unknown and this story casts to what the caller declared.
export function* askInlineFunctionExecute<R, T>(functionName: string, payload: T): AskResponse<R> {
  return (yield* askInlineFunctionExecuteBase(functionName, payload)) as R;
}
