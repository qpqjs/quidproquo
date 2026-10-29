import {
  ActionProcessorList,
  ActionProcessorListResolver,
  askGraphDatabaseExecuteOpenCypherQuery,
  generateUuid,
  getProcessCustomImplementation,
  GraphDatabaseActionType,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { getGraphDatabaseForNeptuneActionProcessor } from './customActions';
import { askRunNeptuneOpenCypherQuery } from './stories';

/**
 *
 */
export const getGraphDatabaseExecuteOpenCypherQueryActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
): Promise<ActionProcessorList> => ({
  [GraphDatabaseActionType.ExecuteOpenCypherQuery]: getProcessCustomImplementation<ProcessorFor<typeof askGraphDatabaseExecuteOpenCypherQuery>>(
    qpqConfig,
    askRunNeptuneOpenCypherQuery,
    'Neptune Cypher Query',
    getGraphDatabaseForNeptuneActionProcessor,
    () => new Date().toISOString(),
    generateUuid,
  ),
});
