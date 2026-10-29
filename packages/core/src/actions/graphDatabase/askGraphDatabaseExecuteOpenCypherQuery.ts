import { GraphCypherResponse } from '../../config';
import { createActionRequester } from '../../logic/actions';
import { GraphDatabaseActionType } from './GraphDatabaseActionType';

export enum GraphDatabaseInstanceType {
  Read = 'read',
  Write = 'write',
}

export type GraphDatabaseExecuteOpenCypherQueryActionPayload = {
  graphDatabaseName: string;
  openCypherQuery: string;
  params?: Record<string, any>;
  instance: GraphDatabaseInstanceType;
};

export const askGraphDatabaseExecuteOpenCypherQuery = createActionRequester<GraphCypherResponse>()({
  actionType: GraphDatabaseActionType.ExecuteOpenCypherQuery,
  errorTypes: [
    'GraphDatabaseNotFound', // no graph database is defined under graphDatabaseName
    'EndpointNotFound', // the database has no endpoint for the requested instance (read or write)
    'QueryFailed', // the database answered the query with an error status
  ],
  getPayload: (
    graphDatabaseName: string,
    instance: GraphDatabaseInstanceType,
    openCypherQuery: GraphDatabaseExecuteOpenCypherQueryActionPayload['openCypherQuery'],
    params?: GraphDatabaseExecuteOpenCypherQueryActionPayload['params'],
  ) => ({ graphDatabaseName, openCypherQuery, params, instance }),
});
