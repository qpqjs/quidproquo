import {
  actionResult,
  askEventTransformResponseResultBase,
  createActionProcessor,
  DynamicModuleLoader,
  EitherActionResult,
  ErrorTypeEnum,
  EventActionType,
  ProcessorFor,
  QPQConfig,
  QPQError,
} from 'quidproquo-core';
import { HttpEventHeaders, qpqWebServerUtils } from 'quidproquo-webserver';

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
      ...qpqWebServerUtils.getCorsHeaders(qpqConfig, {}, expressEvent.headers, domainResolver),
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
