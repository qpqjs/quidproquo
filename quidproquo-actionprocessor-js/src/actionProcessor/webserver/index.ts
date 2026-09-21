import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getDnsActionProcessor } from './dns';
import { getEmailActionProcessor } from './email';
import { getOpenApiActionProcessor } from './openApi';

export * from './dns';
export * from './email';
export * from './openApi';

export const getWebserverActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getDnsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEmailActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getOpenApiActionProcessor(qpqConfig, dynamicModuleLoader)),
});
