import {
  actionResult,
  actionResultError,
  askEventMatchStoryBase,
  createActionProcessor,
  ErrorTypeEnum,
  EventActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';
import { qpqWebServerUtils, WebSocketEventType } from 'quidproquo-webserver';

import { EventInput, GLOBAL_WEBSOCKET_API_NAME, InternalEventRecord, MatchResult } from './types';

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  const userDirectoryConfig = qpqWebServerUtils.getWebsocketEntryByApiName(GLOBAL_WEBSOCKET_API_NAME, qpqConfig);

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

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
