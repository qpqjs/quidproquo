import { AskResponse, StoryResultMetadata } from '@qpqjs/core';

import { askAdminWebSocketBroadcast } from './askAdminWebSocketBroadcast';
import { WebSocketQueueQpqAdminServerEventMessageLogMetadata, WebSocketQueueQpqAdminServerMessageEventType } from './serverMessages';

export function* askLogSendToAdmins(log: StoryResultMetadata): AskResponse<void> {
  const logMessage: WebSocketQueueQpqAdminServerEventMessageLogMetadata = {
    type: WebSocketQueueQpqAdminServerMessageEventType.LogMetadata,
    payload: {
      log,
    },
  };

  yield* askAdminWebSocketBroadcast(logMessage);
}
