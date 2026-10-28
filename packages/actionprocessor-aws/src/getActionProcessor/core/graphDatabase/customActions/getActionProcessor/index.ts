import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getGraphDatabaseForNeptuneGetEndpointsActionProcessor } from './getGraphDatabaseForNeptuneGetEndpointsActionProcessor';
import { getGraphDatabaseForNeptuneSignRequestActionProcessor } from './getGraphDatabaseForNeptuneSignRequestActionProcessor';

export const getGraphDatabaseForNeptuneActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getGraphDatabaseForNeptuneGetEndpointsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getGraphDatabaseForNeptuneSignRequestActionProcessor(qpqConfig, dynamicModuleLoader)),
});
