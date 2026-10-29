import { QpqRuntimeType, StoryResult } from '@qpqjs/core';

// TODO: @joe-coady: Fill this out using history
export const AUTH_VERIFY_AUTH_CHALLENGE_GenericTextExtractor = (storyResult: StoryResult<any>): string[] => {
  if (storyResult.runtimeType === QpqRuntimeType.AUTH_VERIFY_AUTH_CHALLENGE) {
    return [storyResult.input[0]?.triggerSource || 'unknown'];
  }

  return [''];
};
