import { defineActionProcessors, QPQConfig } from '@qpqjs/core';

import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';

export const defineStateDispatchOverWebsockets = (): QPQConfig => [
  defineActionProcessors(getFeatureEntryQpqFunctionRuntime('webSocketQueue', 'actionProcessor', 'getStateDispatch::getStateDispatch')),
];
