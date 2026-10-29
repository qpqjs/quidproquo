import { AskResponse } from '@qpqjs/core';
import { askQueryParamsSet } from '@qpqjs/web';

import { askSharedQueryParamsSetParam } from '../actionCreators/askSharedQueryParamsSetParam';

export function* askSetParam(key: string, values: string[]): AskResponse<void> {
  yield* askQueryParamsSet(key, values, false);
  yield* askSharedQueryParamsSetParam(key, values);
}
