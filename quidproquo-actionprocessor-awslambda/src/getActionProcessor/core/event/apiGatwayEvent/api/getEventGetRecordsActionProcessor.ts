import {
  actionResult,
  askEventGetRecordsBase,
  createActionProcessor,
  EventActionType,
  HTTPMethod,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from 'quidproquo-core';
import { FileUploadErrorTypeEnum, HTTPEvent, HttpEventQuery, qpqWebServerUtils } from 'quidproquo-webserver';

import { FileUploadValidationError, parseMultipartFormData } from '../../utils/parseMultipartFormData';
import { EventInput, InternalEventRecord } from './types';

const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  const fileUploadSettings = qpqWebServerUtils.getFileUploadSettings(qpqConfig);

  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [apiGatewayEvent, context] = eventParams as EventInput;

    // Initialize `path` by removing the service name prefix from `apiGatewayEvent.path`.
    // This adjustment is necessary because the API gateway routes requests to services based on
    // a base path that includes the service name. By subtracting `serviceName.length + 1` from the
    // substring method's start index, we effectively strip the leading `/<serviceName>` segment,
    // accounting for the leading slash. This ensures `path` reflects the intended resource location
    // after the service name. Defaults to '/' if `apiGatewayEvent.path` is not provided.
    const path = (apiGatewayEvent.path || '/').substring(serviceName.length + 1);

    const internalEventRecord: InternalEventRecord = {
      path,
      query: {
        ...(apiGatewayEvent.multiValueQueryStringParameters || {}),
        ...(apiGatewayEvent.queryStringParameters || {}),
      } as HttpEventQuery,
      body: apiGatewayEvent.body === null ? undefined : apiGatewayEvent.body,
      headers: apiGatewayEvent.headers,
      method: apiGatewayEvent.httpMethod as HTTPMethod,
      correlation: context.awsRequestId,
      sourceIp: apiGatewayEvent.requestContext.identity.sourceIp,
      isBase64Encoded: apiGatewayEvent.isBase64Encoded,
    };

    // Transform the body if its a multipart/form-data
    if ((qpqWebServerUtils.getHeaderValue('Content-Type', apiGatewayEvent.headers) || '').startsWith('multipart/form-data') && apiGatewayEvent.body) {
      try {
        internalEventRecord.files = await parseMultipartFormData(apiGatewayEvent, fileUploadSettings);
      } catch (error) {
        // Stamp the failure on the record so the auto-respond step returns the matching
        // 4xx before the route story runs - throwing here would fail the whole event as a 5xx
        internalEventRecord.fileUploadError =
          error instanceof FileUploadValidationError
            ? { errorType: error.errorType, message: error.message }
            : { errorType: FileUploadErrorTypeEnum.malformed, message: 'Unable to parse multipart/form-data body' };
      }
    }

    return actionResult([internalEventRecord]);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
