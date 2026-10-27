import { createActionRequester } from 'quidproquo-core';

import { AdminActionType } from './AdminActionType';
import { QpqLogList } from './AdminActionType';

export const askAdminGetLogs = createActionRequester<QpqLogList>()({
  actionType: AdminActionType.GetLogs,
  getPayload: (runtimeType: string, startIsoDateTime: string, endIsoDateTime: string, nextPageKey?: string) => ({
    runtimeType,
    nextPageKey,
    startIsoDateTime,
    endIsoDateTime,
  }),
});
