import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getApiRequestActionProcessor } from './api';
import { getQueryParamsActionProcessor } from './queryParams';
import { getWindowActionProcessor } from './window';

export const getWebActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getApiRequestActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getQueryParamsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getWindowActionProcessor(qpqConfig, dynamicModuleLoader)),
});
