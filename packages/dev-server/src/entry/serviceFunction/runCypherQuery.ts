import {
  askGraphDatabaseExecuteOpenCypherQuery,
  AskResponse,
  GraphCypherResponse,
  GraphDatabaseExecuteOpenCypherQueryActionPayload,
} from '@qpqjs/core';
import { ExecuteServiceFunctionEvent } from '@qpqjs/webserver';

/**
 *
 */
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
