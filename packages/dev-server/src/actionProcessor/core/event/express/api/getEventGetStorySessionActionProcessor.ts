import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';
import { getHttpApiEventGetStorySessionActionProcessor } from 'quidproquo-webserver';

export const getEventGetStorySessionActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getHttpApiEventGetStorySessionActionProcessor(qpqConfig, dynamicModuleLoader)),
});
