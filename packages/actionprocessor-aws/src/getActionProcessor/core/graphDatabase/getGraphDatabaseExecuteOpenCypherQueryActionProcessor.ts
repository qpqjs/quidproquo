import {
  ActionProcessorList,
  ActionProcessorListResolver,
  askGraphDatabaseExecuteOpenCypherQuery,
  getProcessCustomImplementation,
  GraphDatabaseActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { randomGuid } from '../../../awsLambdaUtils';
import { getGraphDatabaseForNeptuneActionProcessor } from './customActions';
import { askRunNeptuneOpenCypherQuery } from './stories';

export const getGraphDatabaseExecuteOpenCypherQueryActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
): Promise<ActionProcessorList> => ({
  [GraphDatabaseActionType.ExecuteOpenCypherQuery]: getProcessCustomImplementation<ProcessorFor<typeof askGraphDatabaseExecuteOpenCypherQuery>>(
    qpqConfig,
    askRunNeptuneOpenCypherQuery,
    'Neptune Cypher Query',
    getGraphDatabaseForNeptuneActionProcessor,
    () => new Date().toISOString(),
    randomGuid,
  ),
});
