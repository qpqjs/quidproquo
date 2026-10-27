import {
  ActionProcessorList,
  ActionProcessorListResolver,
  askGraphDatabaseExecuteOpenCypherQuery,
  getProcessCustomImplementation,
  GraphDatabaseActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { randomUUID } from 'crypto';

import { askRunNeo4jOpenCypherQuery } from './stories';

export const getGraphDatabaseExecuteOpenCypherQueryActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
): Promise<ActionProcessorList> => ({
  [GraphDatabaseActionType.ExecuteOpenCypherQuery]: getProcessCustomImplementation<ProcessorFor<typeof askGraphDatabaseExecuteOpenCypherQuery>>(
    qpqConfig,
    askRunNeo4jOpenCypherQuery,
    'Neo4j Cypher Query',
    // No extra action processors beyond the caller's list.
    null,
    // Platform boundary: the real clock and uuid source live here; the story
    // itself only ever reaches them through askDateNow/askNewGuid.
    () => new Date().toISOString(),
    randomUUID,
  ),
});
