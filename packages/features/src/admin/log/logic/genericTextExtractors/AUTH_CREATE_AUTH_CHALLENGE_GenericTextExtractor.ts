import { QpqRuntimeType, StoryResult } from 'quidproquo-core';

// TODO: FIll this out using history
export const AUTH_CREATE_AUTH_CHALLENGE_GenericTextExtractor = (storyResult: StoryResult<any>): string[] => {
  if (storyResult.runtimeType === QpqRuntimeType.AUTH_CREATE_AUTH_CHALLENGE) {
    return [storyResult.input[0]?.triggerSource || 'unknown'];
  }

  return [''];
};
