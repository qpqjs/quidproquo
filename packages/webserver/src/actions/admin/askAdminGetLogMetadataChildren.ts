import { createActionRequester, QpqPagedData, StoryResultMetadata } from '@qpqjs/core';

import { AdminActionType } from './AdminActionType';

export const askAdminGetLogMetadataChildren = createActionRequester<QpqPagedData<StoryResultMetadata>>()({
  actionType: AdminActionType.GetLogMetadataChildren,
  getPayload: (correlationId: string, nextPageKey?: string) => ({ correlationId, nextPageKey }),
});
