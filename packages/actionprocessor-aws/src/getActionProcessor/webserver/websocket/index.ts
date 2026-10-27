import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getWebsocketSendMessageActionProcessor } from './getWebsocketSendMessageActionProcessor';

export const getWebsocketActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getWebsocketSendMessageActionProcessor(qpqConfig, dynamicModuleLoader)),
});
