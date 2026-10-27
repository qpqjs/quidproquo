import { createActionRequester } from 'quidproquo-core';

import { QueryParamsActionType } from './QueryParamsActionType';

/** Reads the whole query string of the current url as key -> all values for that key. */
export const askQueryParamsGetAll = createActionRequester<Record<string, string[]>>()({
  actionType: QueryParamsActionType.GetAll,
});
