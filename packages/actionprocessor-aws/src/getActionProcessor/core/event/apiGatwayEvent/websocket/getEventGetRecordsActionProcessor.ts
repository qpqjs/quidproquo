import { actionResult, askEventGetRecordsBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { WebSocketEventType } from 'quidproquo-webserver';

import { EventInput, GLOBAL_WEBSOCKET_API_NAME, InternalEventRecord } from './types';

const awsToQoqEventTypeMap = {
  MESSAGE: WebSocketEventType.Message,
  CONNECT: WebSocketEventType.Connect,
  DISCONNECT: WebSocketEventType.Disconnect,
};

const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [websocketEvent, context] = eventParams as EventInput;

    const internalEventRecord: InternalEventRecord = {
      eventType: awsToQoqEventTypeMap[websocketEvent.requestContext.eventType],

      messageId: websocketEvent.requestContext.messageId,
      connectionId: websocketEvent.requestContext.connectionId,
      requestTimeEpoch: websocketEvent.requestContext.requestTimeEpoch,
      sourceIp: websocketEvent.requestContext.identity.sourceIp,
      userAgent: websocketEvent.requestContext.identity.userAgent,
      requestTime: new Date(websocketEvent.requestContext.requestTimeEpoch).toISOString(),
      body: websocketEvent.body as string | Blob | ArrayBuffer | undefined,

      apiName: GLOBAL_WEBSOCKET_API_NAME,
    };

    return actionResult([internalEventRecord]);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
