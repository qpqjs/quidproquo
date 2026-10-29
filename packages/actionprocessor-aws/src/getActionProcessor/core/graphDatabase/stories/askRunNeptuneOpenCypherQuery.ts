import {
  askNetworkRequest,
  AskResponse,
  askThrowError,
  ErrorTypeEnum,
  GraphCypherResponse,
  GraphDatabaseExecuteOpenCypherQueryActionPayload,
  GraphDatabaseInstanceType,
} from '@qpqjs/core';

import { askGraphDatabaseForNeptuneGetEndpoints, askGraphDatabaseForNeptuneSignRequest } from '../customActions';
import { askConvertNeptuneCypherResponseToCypherResponse } from './converters/askConvertNeptuneCypherResponseToCypherResponse';
import { NeptuneCypherRequest, NeptuneCypherResponse } from './types';
import { convertQpqQueryToNeptune } from './utils';

export function* askRunNeptuneOpenCypherQuery({
  graphDatabaseName,
  openCypherQuery,
  params,
  instance,
}: GraphDatabaseExecuteOpenCypherQueryActionPayload): AskResponse<GraphCypherResponse> {
  const graphEndpoints = yield* askGraphDatabaseForNeptuneGetEndpoints(graphDatabaseName);
  const graphEndpoint = instance === GraphDatabaseInstanceType.Read ? graphEndpoints.readEndpoint : graphEndpoints.writeEndpoint;

  if (!graphEndpoint) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `No [${instance}] endpoint found`);
  }

  const neptuneQuery = convertQpqQueryToNeptune(openCypherQuery);
  const url = `${graphEndpoint}/openCypher`;

  // The cluster requires IAM authentication: the body is serialised once so the signature covers the exact bytes sent.
  const request: NeptuneCypherRequest = { query: neptuneQuery, parameters: params };
  const body = JSON.stringify(request);
  const signedHeaders = yield* askGraphDatabaseForNeptuneSignRequest(url, body);

  const response = yield* askNetworkRequest<NeptuneCypherResponse, string>('POST', url, {
    body,
    headers: signedHeaders,
  });

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, 'Unable to query database');
  }

  return yield* askConvertNeptuneCypherResponseToCypherResponse(response.data);
}
