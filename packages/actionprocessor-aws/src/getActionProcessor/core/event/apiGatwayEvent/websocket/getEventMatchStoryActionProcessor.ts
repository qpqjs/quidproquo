import { actionResult, actionResultError, askEventMatchStoryBase, createActionProcessor, ErrorTypeEnum, ProcessorFor, QPQConfig } from '@qpqjs/core';
import { qpqWebServerUtils, WebSocketEventType } from '@qpqjs/webserver';

import { InternalEventRecord, MatchResult } from './types';

const getProcessMatchStory = (qpqConfig: QPQConfig, websocketApiName: string): ProcessorFor<typeof askEventMatchStoryBase> => {
  const userDirectoryConfig = qpqWebServerUtils.resolveWebsocketOrThrow(websocketApiName, qpqConfig);

  return async ({ qpqEventRecord: rawQpqEventRecord }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const qpqEventRecord = rawQpqEventRecord as InternalEventRecord;

    switch (qpqEventRecord.eventType) {
      case WebSocketEventType.Connect:
        return actionResult<MatchResult>({
          runtime: userDirectoryConfig.eventProcessors.onConnect,
        });
      case WebSocketEventType.Disconnect:
        return actionResult<MatchResult>({
          runtime: userDirectoryConfig.eventProcessors.onDisconnect,
        });
      case WebSocketEventType.Message:
        return actionResult<MatchResult>({
          runtime: userDirectoryConfig.eventProcessors.onMessage,
        });
      default:
        return actionResultError(ErrorTypeEnum.NotFound, `Websocket lambda not implemented for ${qpqEventRecord.eventType}`);
    }
  };
};

/** The api the lambda serves comes from the handler, which reads it from the lambda environment once. */
export const getEventMatchStoryActionProcessor = (websocketApiName: string) =>
  createActionProcessor(askEventMatchStoryBase, (qpqConfig) => getProcessMatchStory(qpqConfig, websocketApiName));
