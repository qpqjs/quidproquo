import { createActionRequester, StoryResultMetadata } from 'quidproquo-core';

import { AdminActionType } from './AdminActionType';

export const askAdminGetLogMetadata = createActionRequester<StoryResultMetadata>()({
  actionType: AdminActionType.GetLogMetadata,
  getPayload: (correlationId: string) => ({ correlationId }),
});
