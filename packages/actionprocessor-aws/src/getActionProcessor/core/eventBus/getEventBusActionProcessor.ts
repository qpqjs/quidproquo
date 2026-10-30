import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getEventBusSendMessagesActionProcessor } from './getEventBusSendMessagesActionProcessor';

export const getEventBusActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getEventBusSendMessagesActionProcessor(qpqConfig, dynamicModuleLoader)),
});
