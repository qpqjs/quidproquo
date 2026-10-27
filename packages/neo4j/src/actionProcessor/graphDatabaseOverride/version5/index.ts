import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getGraphDatabaseExecuteOpenCypherQueryActionProcessor } from './getGraphDatabaseExecuteOpenCypherQueryActionProcessor';

// Loaded dynamically by name: defineGraphDatabaseNeo4j registers this resolver
// via defineActionProcessors, keyed on the version folder.
export const getGraphDatabaseActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getGraphDatabaseExecuteOpenCypherQueryActionProcessor(qpqConfig, dynamicModuleLoader)),
});
