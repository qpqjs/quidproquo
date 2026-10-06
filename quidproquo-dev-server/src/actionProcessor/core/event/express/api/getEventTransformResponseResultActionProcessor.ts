import { awsLambdaUtils } from 'quidproquo-actionprocessor-awslambda';
import {
  actionResult,
  askEventTransformResponseResultBase,
  createActionProcessor,
  DynamicModuleLoader,
  EitherActionResult,
  ErrorTypeEnum,
  EventActionType,
  HTTPMethod,
  ProcessorFor,
  QPQConfig,
  QPQError,
} from 'quidproquo-core';
import { HttpEventHeaders, qpqWebServerUtils, RouteOptions, RouteQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { EventInput, EventOutput, InternalEventOutput } from './types';

const ErrorTypeHttpResponseMap: Record<string, number> = {
  [ErrorTypeEnum.BadRequest]: 400,
  [ErrorTypeEnum.Unauthorized]: 401,
  [ErrorTypeEnum.PaymentRequired]: 402,
  [ErrorTypeEnum.Forbidden]: 403,
  [ErrorTypeEnum.NotFound]: 404,
  [ErrorTypeEnum.TimeOut]: 408,
  [ErrorTypeEnum.Conflict]: 409,
  [ErrorTypeEnum.UnsupportedMediaType]: 415,
  [ErrorTypeEnum.OutOfResources]: 500,
  [ErrorTypeEnum.GenericError]: 500,
  [ErrorTypeEnum.NotImplemented]: 501,
  [ErrorTypeEnum.NoContent]: 204,
  [ErrorTypeEnum.Invalid]: 422,
};

const getResponseFromErrorResult = (error: QPQError): InternalEventOutput => {
  const statusCode = ErrorTypeHttpResponseMap[error.errorType] || 500;
  return qpqWebServerUtils.toJsonEventResponse(
    {
      errorType: error.errorType,
      errorText: error.errorText,
    },
    statusCode,
  );
};

const getProcessTransformResponseResult = async (
  qpqConfig: QPQConfig,
  loader: DynamicModuleLoader,
): Promise<ProcessorFor<typeof askEventTransformResponseResultBase>> => {
  const domainResolver = await qpqWebServerUtils.loadDomainResolver(qpqConfig, loader);
  const routes: RouteQPQWebServerConfigSetting[] = qpqWebServerUtils.getAllRoutes(qpqConfig);

  // The options of the route the request matched, so a response carries the same CORS headers as
  // its preflight (e.g. a route's own allowedOrigins), as on lambda. No match (a 404) falls back
  // to the defaults.
  const getMatchedRouteOptions = (expressEvent: EventInput[0]): RouteOptions => {
    const found = awsLambdaUtils.findApiRoute(routes, expressEvent.method as HTTPMethod, expressEvent.path || '');
    return found ? qpqWebServerUtils.mergeAllRouteOptions('api', found.route, qpqConfig) : {};
  };

  // We might need to JSON.stringify the body.
  return async ({ eventParams: rawEventParams, qpqEventRecordResponses }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const eventParams = rawEventParams as EventInput;

    const [record] = qpqEventRecordResponses as EitherActionResult<InternalEventOutput>[];
    const [expressEvent] = eventParams;

    // If we have an error, we need to transform it to a response, otherwise we can just use the record as is
    const successRecord = record.success ? record.result : getResponseFromErrorResult(record.error);

    const recordHeaders = successRecord.headers || {};
    const headers: HttpEventHeaders = {
      ...qpqWebServerUtils.getCorsHeaders(qpqConfig, getMatchedRouteOptions(expressEvent), expressEvent.headers, domainResolver),
      ...recordHeaders,
    };

    return actionResult<EventOutput>({
      statusCode: successRecord.status,
      body: successRecord.body || '',
      isBase64Encoded: successRecord.isBase64Encoded,
      headers,
    });
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
