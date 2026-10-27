import { StoryResultMetadata, StoryResultMetadataWithChildren } from 'quidproquo-core';

import { cache } from '../../logic';
import { fineLogDirectChildren } from './findLogDirectChildren';

export const createHierarchy = cache(
  async (rootStoryResultMetadata: StoryResultMetadata, apiBasePath: string, accessToken?: string): Promise<StoryResultMetadataWithChildren> => {
    const childrenLogs: StoryResultMetadata[] = await fineLogDirectChildren(rootStoryResultMetadata.correlation, apiBasePath, accessToken);

    const children = await Promise.all(
      childrenLogs
        .sort((a, b) => {
          return a.startedAt < b.startedAt ? -1 : 1;
        })
        .map((child) => createHierarchy(child, apiBasePath, accessToken)),
    );

    return {
      ...rootStoryResultMetadata,
      children,
    };
  },
);
