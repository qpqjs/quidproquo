import { createActionRequester } from 'quidproquo-core';

import { QueryParamsActionType } from './QueryParamsActionType';

export const askQueryParamsSet = createActionRequester<void>()({
  actionType: QueryParamsActionType.Set,
  getPayload: (key: string, values: string[], createHistoryEntry: boolean = false) => ({ key, values, createHistoryEntry }),
});
