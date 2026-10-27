import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getQueueSendMessagesActionProcessor } from './getQueueSendMessageActionProcessor';

export const getQueueActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getQueueSendMessagesActionProcessor(qpqConfig, dynamicModuleLoader)),
});
