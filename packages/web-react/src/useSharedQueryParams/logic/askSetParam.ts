import { AskResponse } from '@qpqjs/core';
import { askQueryParamsSet } from '@qpqjs/web';

import { askSharedQueryParamsUISetParam } from '../actionCreators/askSharedQueryParamsUISetParam';

export function* askSetParam(key: string, values: string[]): AskResponse<void> {
  yield* askQueryParamsSet(key, values, false);
  yield* askSharedQueryParamsUISetParam(key, values);
}
