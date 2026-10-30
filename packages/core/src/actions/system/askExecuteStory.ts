import { createActionRequester } from '../../logic/actions/createActionRequester';
import { QpqFunctionRuntime, StorySession } from '../../types';
import { AskResponse } from '../../types/StorySession';
import { SystemActionType } from './SystemActionType';

export const askExecuteStoryBase = createActionRequester<unknown>()({
  actionType: SystemActionType.ExecuteStory,
  errorTypes: [
    'NotFound', // the runtime could not be dynamically loaded
  ],
  getPayload: (runtime: QpqFunctionRuntime, params: unknown[], storySession?: StorySession) => ({ runtime, params, storySession }),
});

// The target story's params and result are only known to the caller, so the base takes
// and returns unknown and this story casts to what the caller declared.
function* askExecuteStoryTyped<StoryInput extends Array<any>, StoryOutput>(
  runtime: QpqFunctionRuntime,
  params: StoryInput,
  storySession?: StorySession,
): AskResponse<StoryOutput> {
  return (yield* askExecuteStoryBase(runtime, params, storySession)) as StoryOutput;
}

/** Runs another story by its runtime pointer. Carries the base requester's `errorType` catalog so callers can match on it. */
export const askExecuteStory = Object.assign(askExecuteStoryTyped, { errorType: askExecuteStoryBase.errorType });
