import { QpqFunctionRuntime, StorySession } from '../../types';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { SystemActionType } from './SystemActionType';

export const askExecuteStoryBase = createActionRequester<unknown>()({
  actionType: SystemActionType.ExecuteStory,
  getPayload: (runtime: QpqFunctionRuntime, params: unknown[], storySession?: StorySession) => ({ runtime, params, storySession }),
});

// The target story's params and result are only known to the caller, so the base takes
// and returns unknown and this story casts to what the caller declared.
export function* askExecuteStory<StoryInput extends Array<any>, StoryOutput>(
  runtime: QpqFunctionRuntime,
  params: StoryInput,
  storySession?: StorySession,
): AskResponse<StoryOutput> {
  return (yield* askExecuteStoryBase(runtime, params, storySession)) as StoryOutput;
}
