import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getQueueSendMessagesActionProcessor } from './getQueueSendMessagesActionProcessor';

export const getQueueActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getQueueSendMessagesActionProcessor(qpqConfig, dynamicModuleLoader)),
});
