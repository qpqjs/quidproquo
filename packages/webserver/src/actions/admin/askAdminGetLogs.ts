import { createActionRequester, QpqPagedData, StoryResultMetadata } from '@qpqjs/core';

import { AdminActionType } from './AdminActionType';

export const askAdminGetLogs = createActionRequester<QpqPagedData<StoryResultMetadata>>()({
  actionType: AdminActionType.GetLogs,
  getPayload: (runtimeType: string, startIsoDateTime: string, endIsoDateTime: string, nextPageKey?: string) => ({
    runtimeType,
    nextPageKey,
    startIsoDateTime,
    endIsoDateTime,
  }),
});
