import { createActionRequester, StoryResult } from 'quidproquo-core';

import { AdminActionType } from './AdminActionType';

export const askAdminGetLog = createActionRequester<StoryResult<any>>()({
  actionType: AdminActionType.GetLog,
  getPayload: (correlationId: string) => ({ correlationId }),
});
