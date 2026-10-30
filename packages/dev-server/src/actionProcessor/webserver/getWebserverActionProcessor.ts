import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { ResolvedDevServerConfig } from '../../types';
import { getEmailActionProcessor } from './email';
import { getOpenApiActionProcessor } from './openApi';
import { getServiceFunctionActionProcessor } from './serviceFunctionOverride';
import { getWebsocketActionProcessor } from './websocket';

export const getWebserverActionProcessor =
  (devServerConfig: ResolvedDevServerConfig): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getEmailActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getOpenApiActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getServiceFunctionActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getWebsocketActionProcessor(qpqConfig, dynamicModuleLoader)),
  });
