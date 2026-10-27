import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getEmailActionProcessor } from './email';
import { getServiceFunctionActionProcessor } from './serviceFunction';
import { getWebEntryActionProcessor } from './webEntry';
import { getWebsocketActionProcessor } from './websocket';

export * from './email';
export * from './serviceFunction';
export * from './webEntry';
export * from './websocket';

export const getWebserverActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getEmailActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getWebEntryActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getServiceFunctionActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getWebsocketActionProcessor(qpqConfig, dynamicModuleLoader)),
});
