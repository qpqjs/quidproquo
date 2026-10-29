import { AskResponse } from '@qpqjs/core';
import { askQueryParamsGetAll } from '@qpqjs/web';

import { askSharedQueryParamsUISetParam } from '../sharedQueryParamsActionCreator';

export function* askSyncParams(): AskResponse<void> {
  const params = yield* askQueryParamsGetAll();
  for (const key in params) {
    yield* askSharedQueryParamsUISetParam(key, params[key]);
  }
}
