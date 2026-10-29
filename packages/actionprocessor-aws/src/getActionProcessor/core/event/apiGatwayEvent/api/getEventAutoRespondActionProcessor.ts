import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';
import { getHttpApiEventAutoRespondActionProcessor } from '@qpqjs/webserver';

/**
 *
 */
export const getEventAutoRespondActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getHttpApiEventAutoRespondActionProcessor(qpqConfig, dynamicModuleLoader)),
});
