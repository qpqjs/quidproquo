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

import { EventInput, InternalEventRecord, MatchResult } from './types';

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  return async ({ qpqEventRecord: rawQpqEventRecord, eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const qpqEventRecord = rawQpqEventRecord as InternalEventRecord;

    const webSocketConfig = qpqWebServerUtils.getWebsocketEntryByApiName(qpqEventRecord.apiName, qpqConfig);

    switch (qpqEventRecord.eventType) {
      case WebSocketEventType.Connect:
        return actionResult<MatchResult>({
          runtime: webSocketConfig.eventProcessors.onConnect,
        });
      case WebSocketEventType.Disconnect:
        return actionResult<MatchResult>({
          runtime: webSocketConfig.eventProcessors.onDisconnect,
        });
      case WebSocketEventType.Message:
        return actionResult<MatchResult>({
          runtime: webSocketConfig.eventProcessors.onMessage,
        });
      default:
        return actionResultError(ErrorTypeEnum.NotFound, `Websocket lambda not implemented for ${qpqEventRecord.eventType}`);
    }
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
