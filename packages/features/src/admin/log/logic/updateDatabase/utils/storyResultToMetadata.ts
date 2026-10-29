import { StoryResult } from '@qpqjs/core';

import { LogMetadata } from '../../../entry/domain';
import { genericTextExtractorsByRuntimeType } from './genericTextExtractorsByRuntimeType';
import { getDecodedAccessTokenFromGetStorySessionActionInStoryResult } from './getDecodedAccessTokenFromGetStorySessionActionInStoryResult';
import { getDecodedAccessTokenFromSetAccessTokenActionInStoryResult } from './getDecodedAccessTokenFromSetAccessTokenActionInStoryResult';

export const storyResultToMetadata = (storyResult: StoryResult<any>, ttl?: number): LogMetadata => {
  const tags = [...(genericTextExtractorsByRuntimeType[storyResult.runtimeType]?.(storyResult) || []), ...storyResult.tags];

  const decodedAccessToken =
    storyResult.session?.decodedAccessToken ||
    getDecodedAccessTokenFromSetAccessTokenActionInStoryResult(storyResult) ||
    getDecodedAccessTokenFromGetStorySessionActionInStoryResult(storyResult);

  // Base metadata
  const metadata: LogMetadata = {
    correlation: storyResult.correlation,
    fromCorrelation: storyResult.fromCorrelation,
    moduleName: storyResult.moduleName,
    runtimeType: storyResult.runtimeType,
    startedAt: storyResult.startedAt,
    generic: tags.filter((t) => !!t).join(', '),
    executionTimeMs: new Date(storyResult.finishedAt).getTime() - new Date(storyResult.startedAt).getTime(),
    ttl,

    userInfo: decodedAccessToken?.username || decodedAccessToken?.userId,

    qpqFunctionRuntimeInfo: storyResult.qpqFunctionRuntimeInfo,
  };

  // Extract error text
  if (storyResult.error) {
    metadata.error = storyResult.error.errorText;
    metadata.ttl = undefined;
  }

  return metadata;
};
