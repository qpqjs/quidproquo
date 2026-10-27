import { createActionRequester, StoryResultMetadata } from '@qpqjs/core';

import { AdminActionType } from './AdminActionType';

export const askAdminGetLogMetadata = createActionRequester<StoryResultMetadata>()({
  actionType: AdminActionType.GetLogMetadata,
  getPayload: (correlationId: string) => ({ correlationId }),
});
