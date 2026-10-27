import { defineActionProcessors, QPQConfig } from 'quidproquo-core';

import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';

export const defineStateDispatchOverWebsockets = (): QPQConfig => [
  defineActionProcessors(getFeatureEntryQpqFunctionRuntime('webSocketQueue', 'actionProcessor', 'getStateDispatch::getStateDispatch')),
];
