import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';
import { getHttpApiEventGetStorySessionActionProcessor } from '@qpqjs/webserver';

/**
 *
 */
export const getEventGetStorySessionActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getHttpApiEventGetStorySessionActionProcessor(qpqConfig, dynamicModuleLoader)),
});
