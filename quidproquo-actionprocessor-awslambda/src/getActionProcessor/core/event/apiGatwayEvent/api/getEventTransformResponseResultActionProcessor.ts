import {
  actionResult,
  askEventTransformResponseResultBase,
  createActionProcessor,
  DynamicModuleLoader,
  EitherActionResult,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
  QPQError,
} from 'quidproquo-core';
import { HttpEventHeaders, qpqWebServerUtils } from 'quidproquo-webserver';

import { EventInput, EventOutput, InternalEventOutput, InternalEventRecord } from './types';

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

const transformHttpEventHeadersToAPIGatewayProxyResultHeaders = (
  headers: HttpEventHeaders,
): {
  [header: string]: boolean | number | string;
} => {
  return Object.keys(headers)
    .filter((header) => !!headers[header])
    .reduce((acc, header) => ({ ...acc, [header]: headers[header] }), {});
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

  // We might need to JSON.stringify the body.
  return async ({ eventParams: rawEventParams, qpqEventRecordResponses: rawQpqEventRecordResponses }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const eventParams = rawEventParams as EventInput;
    const qpqEventRecordResponses = rawQpqEventRecordResponses as EitherActionResult<InternalEventOutput>[];

    const [apiGatewayEvent] = eventParams;
    const [record] = qpqEventRecordResponses;

    // If we have an error, we need to transform it to a response, otherwise we can just use the record as is
    let successRecord = record.success ? record.result : getResponseFromErrorResult(record.error);

    // Return an error if the body is the wrong type.
    if (successRecord.body && typeof successRecord.body !== 'string') {
      successRecord = getResponseFromErrorResult({
        errorText: 'Response body must be a string',
        errorType: ErrorTypeEnum.GenericError,
      });
    }

    // Add the cors headers
    const currentHeaders = successRecord.headers || {};
    const headers: HttpEventHeaders = {
      ...qpqWebServerUtils.getCorsHeaders(qpqConfig, {}, apiGatewayEvent.headers, domainResolver),
      ...currentHeaders,
    };

    // Transform back to api gateway
    return actionResult<EventOutput>({
      statusCode: successRecord.status,
      body: apiGatewayEvent.httpMethod === 'HEAD' || !successRecord.body ? '' : successRecord.body,
      isBase64Encoded: successRecord.isBase64Encoded,
      headers: transformHttpEventHeadersToAPIGatewayProxyResultHeaders(headers),
    });
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
