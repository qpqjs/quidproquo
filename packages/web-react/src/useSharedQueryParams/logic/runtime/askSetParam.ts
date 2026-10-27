import { AskResponse } from 'quidproquo-core';
import { askQueryParamsSet } from 'quidproquo-web';

import { askSharedQueryParamsUISetParam } from '../sharedQueryParamsActionCreator';

export function* askSetParam(key: string, values: string[]): AskResponse<void> {
  yield* askQueryParamsSet(key, values, false);
  yield* askSharedQueryParamsUISetParam(key, values);
}
