import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getEventBusSendMessagesActionProcessor } from './getEventBusSendMessagesActionProcessor';

export const getEventBusActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getEventBusSendMessagesActionProcessor(qpqConfig, dynamicModuleLoader)),
});
