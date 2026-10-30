import { AskResponse } from '@qpqjs/core';
import { askQueryParamsGetAll } from '@qpqjs/web';

import { askSharedQueryParamsSetParam } from '../actionCreators/askSharedQueryParamsSetParam';

export function* askSyncParams(): AskResponse<void> {
  const params = yield* askQueryParamsGetAll();
  for (const [key, values] of Object.entries(params)) {
    yield* askSharedQueryParamsSetParam(key, values);
  }
}
