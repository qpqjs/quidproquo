import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getGraphDatabaseExecuteOpenCypherQueryActionProcessor } from './getGraphDatabaseExecuteOpenCypherQueryActionProcessor';
import { getGraphDatabaseInternalFieldNamesActionProcessor } from './getGraphDatabaseInternalFieldNamesActionProcessor';

export const getGraphDatabaseActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getGraphDatabaseExecuteOpenCypherQueryActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getGraphDatabaseInternalFieldNamesActionProcessor(qpqConfig, dynamicModuleLoader)),
});
