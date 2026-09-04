import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getEmailActionProcessor } from './email';
import { getOpenApiActionProcessor } from './openApi';
import { getServiceFunctionActionProcessor } from './serviceFunctionOverride';
import { getWebsocketActionProcessor } from './websocket';

export const getWebserverActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getEmailActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getOpenApiActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getServiceFunctionActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getWebsocketActionProcessor(qpqConfig, dynamicModuleLoader)),
});
