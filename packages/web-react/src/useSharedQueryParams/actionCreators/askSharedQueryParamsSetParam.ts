import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { SharedQueryParamsEffect } from '../effects/SharedQueryParamsEffect';
import { SharedQueryParamsSetParamEffect } from '../effects/SharedQueryParamsSetParamEffect';

export function* askSharedQueryParamsSetParam(key: string, values: string[]): AskResponse<void> {
  yield* askStateDispatchEffect<SharedQueryParamsSetParamEffect>(SharedQueryParamsEffect.SetParam, {
    key,
    values,
  });
}
