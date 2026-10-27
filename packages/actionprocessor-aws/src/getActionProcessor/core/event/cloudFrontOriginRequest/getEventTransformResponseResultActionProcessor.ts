import {
  actionResult,
  askEventTransformResponseResultBase,
  createActionProcessor,
  EitherActionResult,
  ErrorTypeEnum,
  EventActionType,
  ProcessorFor,
  QPQConfig,
  QPQError,
} from 'quidproquo-core';
import { HttpEventHeaders } from 'quidproquo-webserver';

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
  return {
    status: statusCode,
    body: JSON.stringify({
      errorType: error.errorType,
      errorText: error.errorText,
    }),
    fallbackToCDN: true,
  };
};

const getProcessTransformResponseResult = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventTransformResponseResultBase> => {
  // We might need to JSON.stringify the body.
  return async ({ eventParams: rawEventParams, qpqEventRecordResponses: rawQpqEventRecordResponses }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const eventParams = rawEventParams as EventInput;
    const qpqEventRecordResponses = rawQpqEventRecordResponses as EitherActionResult<InternalEventOutput>[];

    const [cloudFrontRequestEvent] = eventParams;
    const [seoEventResponse] = qpqEventRecordResponses;

    // If we have an error, we need to transform it to a response, otherwise we can just use the record as is
    const successRecord = seoEventResponse.success ? seoEventResponse.result : getResponseFromErrorResult(seoEventResponse.error);

    if (successRecord.fallbackToCDN) {
      return actionResult(cloudFrontRequestEvent.Records[0].cf.request);
    }

    const headers = successRecord.headers || {};
    const responseHeaders = Object.keys(headers).reduce((acc, header) => ({ ...acc, [header]: [{ value: headers[header] }] }), {});

    const result: EventOutput = {
      status: `${successRecord.status}`,
      statusDescription: 'OK',
      body: successRecord.body,
      headers: responseHeaders,

      // TODO: Revist this.
      bodyEncoding: successRecord.bodyEncoding === 'base64' ? 'base64' : 'text',
    };

    return actionResult(result);
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
