import { getFederatedKeyFromQpqFunctionRuntime, StoryResult } from '@qpqjs/core';

export const unknownGenericTextExtractor = (storyResult: StoryResult<any>): string[] => {
  if (storyResult.qpqFunctionRuntimeInfo) {
    return [getFederatedKeyFromQpqFunctionRuntime(storyResult.qpqFunctionRuntimeInfo)];
  }

  return [''];
};
