import { getFederatedKeyFromQpqFunctionRuntime, StoryResult } from 'quidproquo-core';

export const unknownGenericTextExtractor = (storyResult: StoryResult<any>): string[] => {
  if (storyResult.qpqFunctionRuntimeInfo) {
    return [getFederatedKeyFromQpqFunctionRuntime(storyResult.qpqFunctionRuntimeInfo)];
  }

  return [''];
};
