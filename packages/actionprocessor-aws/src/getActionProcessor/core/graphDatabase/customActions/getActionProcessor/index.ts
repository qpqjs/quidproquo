import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getGraphDatabaseForNeptuneGetEndpointsActionProcessor } from './getGraphDatabaseForNeptuneGetEndpointsActionProcessor';

export const getGraphDatabaseForNeptuneActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getGraphDatabaseForNeptuneGetEndpointsActionProcessor(qpqConfig, dynamicModuleLoader)),
});
