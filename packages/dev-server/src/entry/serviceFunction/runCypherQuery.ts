import {
  askGraphDatabaseExecuteOpenCypherQuery,
  AskResponse,
  GraphCypherResponse,
  GraphDatabaseExecuteOpenCypherQueryActionPayload,
} from 'quidproquo-core';
import { ExecuteServiceFunctionEvent } from 'quidproquo-webserver';

export function* runCypherQuery(
  event: ExecuteServiceFunctionEvent<GraphDatabaseExecuteOpenCypherQueryActionPayload>,
): AskResponse<GraphCypherResponse> {
  const queryResponse = yield* askGraphDatabaseExecuteOpenCypherQuery(
    event.payload.graphDatabaseName,
    event.payload.instance,
    event.payload.openCypherQuery,
    event.payload.params,
  );

  return queryResponse;
}
