import { askMapParallel, AskResponse, StoryResultMetadata, StoryResultMetadataWithChildren } from '@qpqjs/core';

import { askLogMetadataGetAllByFromCorrelation } from './askLogMetadataGetAllByFromCorrelation';

// The log and, recursively, every log it spawned, children ordered by start time.
export function* askLogMetadataCreateHierarchy(rootStoryResultMetadata: StoryResultMetadata): AskResponse<StoryResultMetadataWithChildren> {
  const childrenLogs: StoryResultMetadata[] = yield* askLogMetadataGetAllByFromCorrelation(rootStoryResultMetadata.correlation);

  const sortedChildren = childrenLogs.sort((a, b) => {
    return a.startedAt < b.startedAt ? -1 : 1;
  });

  const childrenWithHierarchies = yield* askMapParallel(sortedChildren, askLogMetadataCreateHierarchy);
  return {
    ...rootStoryResultMetadata,
    children: childrenWithHierarchies,
  };
}
