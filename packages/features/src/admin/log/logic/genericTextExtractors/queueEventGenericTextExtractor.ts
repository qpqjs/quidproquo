import { QpqRuntimeType, StoryResult } from '@qpqjs/core';

export const queueEventGenericTextExtractor = (storyResult: StoryResult<any>): string[] => {
  if (storyResult.runtimeType === QpqRuntimeType.QUEUE_EVENT) {
    return [storyResult.input[0]?.type || ''];
  }

  return [''];
};
