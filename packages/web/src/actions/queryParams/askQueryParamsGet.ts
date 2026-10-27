import { createActionRequester } from 'quidproquo-core';

import { QueryParamsActionType } from './QueryParamsActionType';

export const askQueryParamsGet = createActionRequester<string[]>()({
  actionType: QueryParamsActionType.Get,
  getPayload: (key: string) => ({ key }),
});
