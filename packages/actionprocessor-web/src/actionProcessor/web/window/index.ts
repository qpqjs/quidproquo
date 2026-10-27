import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getWindowGetLocationActionProcessor } from './getWindowGetLocationActionProcessor';

export const getWindowActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getWindowGetLocationActionProcessor(qpqConfig, dynamicModuleLoader)),
});
