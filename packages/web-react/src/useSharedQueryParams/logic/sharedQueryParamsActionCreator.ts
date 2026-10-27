import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { SharedQueryParamsEffect, SharedQueryParamsSetParamEffect } from './sharedQueryParamsTypes';

export function* askSharedQueryParamsUISetParam(key: string, values: string[]): AskResponse<void> {
  yield* askStateDispatchEffect<SharedQueryParamsSetParamEffect>(SharedQueryParamsEffect.SetParam, {
    key,
    values,
  });
}
