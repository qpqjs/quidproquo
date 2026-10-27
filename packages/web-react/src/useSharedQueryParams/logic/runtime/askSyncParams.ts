import { AskResponse } from 'quidproquo-core';
import { askQueryParamsGetAll, askQueryParamsSet } from 'quidproquo-web';

import { askSharedQueryParamsUISetParam } from '../sharedQueryParamsActionCreator';

export function* askSyncParams(): AskResponse<void> {
  const params = yield* askQueryParamsGetAll();
  for (const key in params) {
    yield* askSharedQueryParamsUISetParam(key, params[key]);
  }
}
