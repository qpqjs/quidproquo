import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getApiRequestActionProcessor } from './api';
import { getQueryParamsActionProcessor } from './queryParams';
import { getWindowActionProcessor } from './window';

export * from './api';

export const getWebActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getApiRequestActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getQueryParamsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getWindowActionProcessor(qpqConfig, dynamicModuleLoader)),
});
