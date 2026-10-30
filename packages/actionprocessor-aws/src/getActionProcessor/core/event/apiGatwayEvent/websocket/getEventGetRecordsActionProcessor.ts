import { actionResult, askEventGetRecordsBase, createActionProcessor, ProcessorFor } from '@qpqjs/core';
import { WebSocketEventType } from '@qpqjs/webserver';

import { EventInput, InternalEventRecord } from './types';

const awsToQoqEventTypeMap = {
  MESSAGE: WebSocketEventType.Message,
  CONNECT: WebSocketEventType.Connect,
  DISCONNECT: WebSocketEventType.Disconnect,
};

const getProcessGetRecords = (websocketApiName: string): ProcessorFor<typeof askEventGetRecordsBase> => {
  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [websocketEvent] = eventParams as EventInput;

    const internalEventRecord: InternalEventRecord = {
      eventType: awsToQoqEventTypeMap[websocketEvent.requestContext.eventType],

      messageId: websocketEvent.requestContext.messageId,
      connectionId: websocketEvent.requestContext.connectionId,
      requestTimeEpoch: websocketEvent.requestContext.requestTimeEpoch,
      sourceIp: websocketEvent.requestContext.identity.sourceIp,
      userAgent: websocketEvent.requestContext.identity.userAgent,
      requestTime: new Date(websocketEvent.requestContext.requestTimeEpoch).toISOString(),
      body: websocketEvent.body as string | Blob | ArrayBuffer | undefined,

      apiName: websocketApiName,
    };

    return actionResult([internalEventRecord]);
  };
};

/** The api the lambda serves comes from the handler, which reads it from the lambda environment once. */
export const getEventGetRecordsActionProcessor = (websocketApiName: string) =>
  createActionProcessor(askEventGetRecordsBase, () => getProcessGetRecords(websocketApiName));
