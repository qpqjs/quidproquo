import {
  askNetworkRequest,
  AskResponse,
  askThrowError,
  ErrorTypeEnum,
  GraphCypherResponse,
  GraphDatabaseExecuteOpenCypherQueryActionPayload,
  GraphDatabaseInstanceType,
} from 'quidproquo-core';

import { askGraphDatabaseForNeptuneGetEndpoints } from '../customActions';
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

  const response = yield* askNetworkRequest<NeptuneCypherRequest, NeptuneCypherResponse>('POST', `${graphEndpoint}/openCypher`, {
    body: { query: neptuneQuery, parameters: params },
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, 'Unable to query database');
  }

  return yield* askConvertNeptuneCypherResponseToCypherResponse(response.data);
}
