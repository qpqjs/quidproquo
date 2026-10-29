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
  getPayload: (
    graphDatabaseName: string,
    instance: GraphDatabaseInstanceType,
    openCypherQuery: GraphDatabaseExecuteOpenCypherQueryActionPayload['openCypherQuery'],
    params?: GraphDatabaseExecuteOpenCypherQueryActionPayload['params'],
  ) => ({ graphDatabaseName, openCypherQuery, params, instance }),
});
