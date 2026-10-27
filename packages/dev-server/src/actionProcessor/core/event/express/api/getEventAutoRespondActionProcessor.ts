import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';
import { getHttpApiEventAutoRespondActionProcessor } from 'quidproquo-webserver';

export const getEventAutoRespondActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getHttpApiEventAutoRespondActionProcessor(qpqConfig, dynamicModuleLoader)),
});
