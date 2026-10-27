import { actionResult, actionResultError } from '../logic/actionLogic';
import { ActionProcessorResult } from '../types/Action';
import { StoryResult } from '../types/StorySession';

/**
 * Turns a nested story's result into the calling processor's action result.
 * On error, `label` (the function that ran) goes in front of the error stack so the trace shows where it failed.
 */
export const storyResultToActionResult = <R>(storyResult: StoryResult<any, R>, label: string): ActionProcessorResult<R> => {
  if (storyResult.error) {
    return actionResultError(
      storyResult.error.errorType,
      storyResult.error.errorText,
      storyResult.error.errorStack ? `${label} -> [${storyResult.error.errorStack}]` : label,
    );
  }

  return actionResult(storyResult.result as R);
};
