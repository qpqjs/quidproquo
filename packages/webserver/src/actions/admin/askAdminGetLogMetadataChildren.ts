import { createActionRequester } from 'quidproquo-core';

import { AdminActionType } from './AdminActionType';
import { QpqLogList } from './AdminActionType';

export const askAdminGetLogMetadataChildren = createActionRequester<QpqLogList>()({
  actionType: AdminActionType.GetLogMetadataChildren,
  getPayload: (correlationId: string, nextPageKey?: string) => ({ correlationId, nextPageKey }),
});
